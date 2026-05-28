import React, { useState } from "react";
import { FaLaptop, FaPlus, FaBoxOpen, FaUserCheck, FaTools } from "react-icons/fa";

const glass = {
    background: "#ffffff",
    borderRadius: 24,
    border: "1px solid #E6C7E6",
    padding: 24,
    boxShadow: "0 10px 30px -10px rgba(102, 51, 153, 0.1)",
};

const badgeStyle = (status) => {
    switch (status) {
        case 'In Use': return { bg: '#f0fdf4', color: '#16a34a' };
        case 'Maintenance': return { bg: '#fefce8', color: '#ca8a04' };
        case 'Available': return { bg: '#fef2f2', color: '#dc2626' };
        default: return { bg: '#f1f5f9', color: '#64748b' };
    }
};

export default function AssetDeployment() {
    const [assets, setAssets] = useState([
        { id: "A001", name: "MacBook Pro M2", type: "Hardware", serial: "MBP-2024-X99", assignedTo: "Sarah Jenkins", status: "In Use" },
        { id: "A002", name: "Dell XPS 15", type: "Hardware", serial: "DXP-15-550", assignedTo: "Mike Ross", status: "In Use" },
        { id: "A003", name: "Adobe Creative Cloud", type: "License", serial: "ACC-ENT-888", assignedTo: "Design Team", status: "In Use" },
        { id: "A004", name: "ErgoChair Pro", type: "Hardware", serial: "ECP-004-99", assignedTo: "Unassigned", status: "Available" },
        { id: "A005", name: "Server Unit X1", type: "Hardware", serial: "SRV-X1-001", assignedTo: "IT Dep", status: "Maintenance" },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [newAsset, setNewAsset] = useState({ name: "", type: "Hardware", serial: "", assignedTo: "", status: "Available" });

    const handleRegister = () => {
        setAssets([...assets, { ...newAsset, id: `A00${assets.length + 1}` }]);
        setShowModal(false);
        setNewAsset({ name: "", type: "Hardware", serial: "", assignedTo: "", status: "Available" });
    };

    return (
        <div style={glass} className="shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#E6C7E6', color: '#663399' }}>
                        <FaBoxOpen size={20} />
                    </div>
                    <div>
                        <h5 className="fw-bold m-0" style={{ color: '#2E1A47' }}>Asset Deployment Registry</h5>
                        <p className="m-0 small text-muted">Manage physical and digital assets across the organization</p>
                    </div>
                </div>
                <button
                    className="btn shadow-sm d-flex align-items-center gap-2"
                    style={{ backgroundColor: '#663399', color: '#ffffff', borderRadius: '12px', fontWeight: 600, padding: '10px 20px' }}
                    onClick={() => setShowModal(true)}
                >
                    <FaPlus /> Register Asset
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                            <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px 0 0 12px' }}>Asset ID</th>
                            <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Asset Name</th>
                            <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Type</th>
                            <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Serial Number</th>
                            <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Assigned User</th>
                            <th className="px-4 py-3 border-0 text-end" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0 12px 12px 0' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ height: '12px' }}></tr>
                        {assets.map((asset) => (
                            <tr key={asset.id} className="border-bottom-hover">
                                <td className="px-4 py-3 fw-bold" style={{ color: '#A3779D' }}>#{asset.id}</td>
                                <td className="px-4 py-3 fw-bold" style={{ color: '#2E1A47' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        {asset.type === 'Hardware' ? <FaLaptop className="text-muted" /> : <FaTools className="text-muted" />}
                                        {asset.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3" style={{ color: '#64748b' }}>{asset.type}</td>
                                <td className="px-4 py-3 font-monospace" style={{ color: '#663399', fontSize: '0.9em' }}>{asset.serial}</td>
                                <td className="px-4 py-3">
                                    {asset.assignedTo !== "Unassigned" ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="d-flex justify-content-center align-items-center rounded-circle" style={{ width: 24, height: 24, background: '#E6C7E6', color: '#663399', fontSize: '10px' }}>
                                                <FaUserCheck />
                                            </div>
                                            <span style={{ color: '#1e293b' }}>{asset.assignedTo}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted fst-italic">-- Unassigned --</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-end">
                                    <span className="badge px-3 py-1 rounded-pill"
                                        style={{ backgroundColor: badgeStyle(asset.status).bg, color: badgeStyle(asset.status).color, fontSize: '11px', fontWeight: 700 }}
                                    >
                                        {asset.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: '400px', border: '1px solid #E6C7E6' }}>
                        <h5 className="mb-4 fw-bold" style={{ color: '#2E1A47' }}>Register New Asset</h5>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Asset Name</label>
                            <input type="text" className="form-control" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Type</label>
                            <select className="form-select" value={newAsset.type} onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}>
                                <option>Hardware</option>
                                <option>Software</option>
                                <option>License</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Serial Number</label>
                            <input type="text" className="form-control" value={newAsset.serial} onChange={e => setNewAsset({ ...newAsset, serial: e.target.value })} />
                        </div>
                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <button className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn" style={{ backgroundColor: '#663399', color: '#fff' }} onClick={handleRegister}>Register Asset</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .border-bottom-hover:hover { background-color: #fdfbff !important; transition: all 0.2s ease; }
      `}</style>
        </div>
    );
}
