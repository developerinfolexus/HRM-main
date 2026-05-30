const dns = require('dns').promises;
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const execFileAsync = promisify(execFile);

const buildLocalUri = () => {
    const host = process.env.MONGODB_HOST || '127.0.0.1';
    const port = process.env.MONGODB_PORT || '27017';
    const dbName = process.env.MONGODB_DB || 'hrm';
    return `mongodb://${host}:${port}/${dbName}`;
};

const isAtlasSrvDnsError = (error) => (
    error?.code === 'ECONNREFUSED'
    && (error?.syscall === 'querySrv' || String(error?.message || '').includes('querySrv'))
);

const parseSrvUri = (srvUri) => {
    const withoutScheme = srvUri.replace(/^mongodb\+srv:\/\//, '');
    const [authAndHost, query = ''] = withoutScheme.split('?');
    const atIndex = authAndHost.lastIndexOf('@');

    if (atIndex === -1) {
        return { credentials: '', host: authAndHost.replace(/\/+$/, ''), query };
    }

    return {
        credentials: authAndHost.slice(0, atIndex + 1),
        host: authAndHost.slice(atIndex + 1).replace(/\/+$/, ''),
        query
    };
};

const resolveSrvHostsWithNslookup = async (host) => {
    const { stdout } = await execFileAsync(
        'nslookup',
        ['-type=SRV', `_mongodb._tcp.${host}`],
        { windowsHide: true }
    );

    const hosts = [...stdout.matchAll(/svr hostname\s*=\s*(\S+)/gi)].map((match) => ({
        name: match[1],
        port: 27017
    }));

    if (!hosts.length) {
        throw new Error(`No MongoDB SRV records found for ${host}`);
    }

    return hosts;
};

const resolveSrvHosts = async (host) => {
    try {
        return await dns.resolveSrv(`_mongodb._tcp.${host}`);
    } catch (error) {
        if (!isAtlasSrvDnsError(error)) {
            throw error;
        }

        logger.warn(`Node DNS SRV lookup failed for ${host}, retrying with nslookup`);
        console.warn(`⚠️  Node DNS SRV lookup failed for ${host}, retrying with nslookup`);
        return resolveSrvHostsWithNslookup(host);
    }
};

const buildDirectUriFromSrv = async (srvUri) => {
    const { credentials, host, query } = parseSrvUri(srvUri);
    const hosts = await resolveSrvHosts(host);
    const hostList = hosts.map((entry) => `${entry.name}:${entry.port || 27017}`).join(',');
    const params = new URLSearchParams(query);

    params.set('ssl', 'true');
    if (!params.has('authSource')) {
        params.set('authSource', 'admin');
    }

    const queryString = params.toString();
    return `mongodb://${credentials}${hostList}/${queryString ? `?${queryString}` : ''}`;
};

const connectWithUri = async (mongoUri) => {
    const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
};

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGODB_DIRECT_URI?.trim()
            || process.env.MONGODB_URI?.trim();
        const isDev = process.env.NODE_ENV !== 'production';

        if (!mongoUri) {
            mongoUri = buildLocalUri();
            logger.warn('MONGODB_URI not defined, falling back to local MongoDB:', mongoUri);
            console.warn('⚠️  MONGODB_URI not defined, using fallback:', mongoUri);
        }

        if (mongoUri.startsWith('mongodb+srv://')) {
            try {
                return await connectWithUri(mongoUri);
            } catch (error) {
                if (!isAtlasSrvDnsError(error)) {
                    throw error;
                }

                const directUri = await buildDirectUriFromSrv(mongoUri);
                logger.warn('Converted Atlas SRV URI to direct MongoDB URI after DNS failure');
                console.warn('⚠️  Atlas SRV DNS failed. Retrying with direct MongoDB connection.');
                return await connectWithUri(directUri);
            }
        }

        try {
            return await connectWithUri(mongoUri);
        } catch (error) {
            if (!isDev || !isAtlasSrvDnsError(error)) {
                throw error;
            }

            const localUri = buildLocalUri();
            logger.warn(`MongoDB connection failed, falling back to local MongoDB: ${localUri}`);
            console.warn('⚠️  MongoDB Atlas unreachable. Using local MongoDB:', localUri);
            return await connectWithUri(localUri);
        }
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        console.error('❌ MongoDB connection failed:', error.message);

        if (error.message.includes('authentication failed')) {
            console.error('💡 Tip: Check your database username and password in .env file');
        } else if (error.message.includes('Invalid scheme')) {
            console.error('💡 Tip: Ensure MONGODB_URI starts with mongodb:// or mongodb+srv://');
        } else if (isAtlasSrvDnsError(error)) {
            console.error('💡 Tip: Atlas DNS lookup failed. Set MONGODB_DIRECT_URI or start local MongoDB.');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Tip: Start local MongoDB or verify Atlas network access.');
        }

        throw error;
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
    console.error('❌ MongoDB error:', err.message);
});

module.exports = connectDB;
