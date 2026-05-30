# Troubleshooting Login 401 Error

## Root Causes (in order of likelihood)

### 1️⃣ Backend Server Not Running
- Check if backend is running on port 5000
- In terminal, run:
```bash
cd backend
npm run dev
# Should see: 🚀 Server running on http://localhost:5000
```

### 2️⃣ Incorrect API URL (Port 5900 in error)
- The error shows `:5900/api/auth/login` 
- Check your frontend `.env` file or `VITE_API_URL`:
```bash
cd frontend/frontend
# Check .env or .env.local for VITE_API_URL
# If it's set to port 5900, change it to 5000:
# VITE_API_URL=http://localhost:5000
```

### 3️⃣ Verify Password is Correct
- Run verification script:
```bash
cd backend
node verify-password.js
# Should show: ✅ Login would succeed!
```

### 4️⃣ CORS Issues
- If backend is running but still getting 401:
- Check backend console for CORS errors
- Verify `CLIENT_URL` in `.env` matches your frontend URL

---

## Quick Fix Checklist

- [ ] Backend running? (`npm run dev` from `backend/`)
- [ ] Frontend using correct API URL? (should be `:5000` not `:5900`)
- [ ] Password verified? (run `verify-password.js`)
- [ ] `.env` in backend has `MONGODB_URI` set?

## Test Login Command

Once backend is running, test with:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ssathiskumar641@gmail.com","password":"Emp@123"}'
```

Should return `200` with user token (not `401`).
