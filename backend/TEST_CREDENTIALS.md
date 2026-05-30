# Test Login Credentials

## Admin Users

Use the following credentials to log in to the HRM system for testing:

### Admin 1

- **Email:** `<kumarsasi9081@gmail.com>`
- **Password:** `Admin@123`
- **Role:** Admin

### Admin 2

- **Email:** `<admin_test_1@gmail.com>`
- **Password:** `Admin@123`
- **Role:** Admin

### Admin 3

- **Email:** `<testadmin@hrm.com>`
- **Password:** `Admin@123`
- **Role:** Admin

### Admin 4

- **Email:** `<admin@test.com>`
- **Password:** `Admin@123`
- **Role:** Admin

---

## Employee Users

### Employee 1

- **Email:** `<ssathiskumar641@gmail.com>`
- **Password:** `Emp@123`
- **Name:** Surya Prakash S
- **Employee ID:** EMP0001
- **Role:** Employee

### Employee 2

- **Email:** `<suryakumar@gmail.com>`
- **Password:** `Emp@123`
- **Name:** surya kumar
- **Employee ID:** EMP0002
- **Role:** Employee

### Employee 3

- **Email:** `<surya641@gmail.com>`
- **Password:** `Emp@123`
- **Name:** surya s
- **Employee ID:** EMP0003
- **Role:** Employee

### Employee 4

- **Email:** `<kumarsasi9081@gmail.com>`
- **Password:** `Emp@123`
- **Name:** Sasikumar RS
- **Employee ID:** EMP0004
- **Role:** Employee

### Employee 5

- **Email:** `<vimal641@gmail.com>`
- **Password:** `Emp@123`
- **Name:** vimal R
- **Employee ID:** EMP0005
- **Role:** Employee

---

## How to Set Credentials

### Setup Admin Credentials

```bash
cd backend
node setup-admin-credentials.js
```

### Setup Employee Credentials

```bash
cd backend
node setup-employee-credentials.js
```

Both scripts will:

1. Hash the passwords using bcrypt
2. Update/create user records in MongoDB
3. Display confirmation for each user processed

You can run either or both scripts depending on your testing needs.

---

**⚠️ Security Note:** These are test credentials only. Do NOT use in production. Always use strong, unique passwords in production environments and store them securely.
