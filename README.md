# CityCare Hospital Management System (CSC702 project)

A full-stack Hospital Management System: **React (Vite) + Tailwind CSS** frontend, **Node.js + Express** REST API, **MySQL** database, JWT login stored in an HTTP-only cookie, and role-based access for five roles (Admin, Doctor, Receptionist, Billing Staff, Patient).

```
React frontend (localhost:5173)  ->  Express API (localhost:5000)  ->  MySQL (hospital_management)
```

## 1. What you need installed

- Node.js 18 or newer (`node -v`)
- MySQL 8 (5.7 also works) and a MySQL user that can create databases (for example `root`)

## 2. Extract the ZIP

Right-click `hospital-management-system.zip` and choose Extract All, or run:

```bash
unzip hospital-management-system.zip
cd hospital-management-system
```

## 3. Create the database

The schema file **drops and recreates** a database named `hospital_management`, so run it only on a database you are happy to reset.

```bash
cd backend
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

On Windows PowerShell the `<` operator does not work. Use either of these instead:

- MySQL Workbench: open `schema.sql`, run it, then open `seed.sql` and run it.
- MySQL command line: `mysql -u root -p`, then `source C:/path/to/backend/database/schema.sql;` followed by `source C:/path/to/backend/database/seed.sql;`

## 4. Start the backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Open `backend/.env` and set `DB_PASSWORD` to your MySQL password and `JWT_SECRET` to any long random text. Then:

```bash
npm install
npm run dev                 # or: npm start
```

You should see `Connected to MySQL` and `HMS API running on http://localhost:5000`.

## 5. Start the frontend (second terminal)

```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

If you change the backend port, update `VITE_API_URL` in `frontend/.env` and `CLIENT_URL` in `backend/.env` so they match. Keep using `localhost` (not `127.0.0.1`) in the browser so the login cookie is sent.

## 6. Demo accounts

Every demo account uses the password **`Password@123`** (only bcrypt hashes are stored in the database).

| Role | Email |
|---|---|
| Admin | admin@hospital.com |
| Doctor | dr.sharma@hospital.com (also dr.mehta@, dr.roy@, dr.khan@hospital.com) |
| Receptionist | reception@hospital.com |
| Billing staff | billing@hospital.com |
| Patient | patient@hospital.com (also sneha.patel@example.com, amit.ghosh@example.com, meera.nair@example.com) |

The login page has one-click buttons that fill in these accounts.

## 7. What each role can do

| Role | Features |
|---|---|
| Admin | Dashboard statistics, add/edit/activate/deactivate doctors with department and weekly availability, manage departments, view/edit patients, view and manage all appointments, create staff accounts, view invoices, reports page |
| Doctor | Own appointments with status updates, patient list and patient detail (history, previous prescriptions), add/edit medical records, create prescriptions with several medicines |
| Receptionist | Register/search/edit patients, view doctors and availability, book, reschedule and cancel appointments |
| Billing staff | Completed appointments waiting for an invoice, generate invoices (consultation + other charges), record Cash/Card/UPI payments, paid and pending invoices, payment history |
| Patient | Register and log in, edit profile, search doctors, book/reschedule/cancel appointments, view own prescriptions, records, invoices and payment status |

All roles get in-app notifications (booking, confirmation, cancellation, rescheduling, prescriptions, invoices, payments).

## 8. Behaviour worth knowing for the demo

- **Booking rules:** the appointment must be in the future, inside the doctor's weekly availability, and the doctor must not already have a non-cancelled appointment at the same date and time. Patient bookings start as `Requested`; receptionist/admin bookings are `Confirmed`.
- **Billing flow:** a doctor marks an appointment `Completed` (the "Mark appointment completed" button on the consult page, or the status dropdown), then it appears under *Appointments to bill* for billing staff. One active invoice is allowed per appointment.
- **Payments:** payments cannot exceed the balance. The invoice becomes `Partially Paid` and then `Paid` automatically. No real payment gateway is used.
- **Receptionist-registered patients** get the password `Patient@123` unless the receptionist types another one.
- **Deactivating** a doctor or staff account also blocks that person from logging in.
- Patient registration always creates a patient account. Staff accounts can only be created by an admin.
- Seed appointment dates are relative to the day you import the seed (past, today and upcoming), so the demo always has fresh-looking data. Re-import the seed if you want to reset it.

## 9. REST API summary

All routes are under `/api` and need the login cookie unless noted. Role checks are enforced on the backend.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Patients | `GET /patients`, `GET /patients/:id`, `POST /patients`, `PUT /patients/:id` |
| Doctors | `GET /doctors`, `GET /doctors/:id`, `POST /doctors`, `PUT /doctors/:id`, `PUT /doctors/:id/status` |
| Departments | `GET /departments`, `POST /departments`, `PUT /departments/:id`, `DELETE /departments/:id` |
| Appointments | `GET /appointments`, `GET /appointments/:id`, `POST /appointments`, `PUT /appointments/:id` (reschedule), `PUT /appointments/:id/status`, `PUT /appointments/:id/cancel` |
| Prescriptions | `GET /prescriptions`, `GET /prescriptions/:id`, `POST /prescriptions` |
| Medical records | `GET /medical-records`, `GET /medical-records/:id`, `POST /medical-records`, `PUT /medical-records/:id` |
| Billing | `GET /invoices`, `GET /invoices/:id`, `POST /invoices`, `POST /invoices/:id/payments`, `GET /invoices/:id/payments` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` |
| Reports | `GET /reports/dashboard` (admin) |

Extra endpoints added because the screens need them: `GET/POST /staff`, `PUT /staff/:id/status`, `GET /invoices/billable-appointments`, `PUT /invoices/:id/cancel`, `PUT /notifications/read-all`, `GET /reports/my-stats`, `GET /health`.

## 10. Project structure

```
hospital-management-system/
├── backend/
│   ├── database/          schema.sql, seed.sql
│   └── src/
│       ├── config/        db.js (MySQL pool + transaction helper)
│       ├── middleware/    auth.js (JWT + roles), errorHandler.js
│       ├── controllers/   one file per module
│       ├── routes/        one file per module
│       ├── services/      notifications, patient creation, validators
│       ├── app.js         Express app
│       └── server.js      starts the server
└── frontend/
    └── src/
        ├── api/           axios instance, useFetch hook
        ├── context/       AuthContext, ToastContext
        ├── routes/        ProtectedRoute
        ├── layouts/       DashboardLayout + sidebar menus per role
        ├── components/    shared tables, forms and modals
        └── pages/         admin/ doctor/ receptionist/ billing/ patient/
```

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| `Could not connect to MySQL` | Check `DB_USER`, `DB_PASSWORD`, `DB_HOST` in `backend/.env` and that MySQL is running |
| `Missing JWT_SECRET` | You have not created `backend/.env` from `.env.example` |
| `Unknown database hospital_management` | Import `schema.sql` first |
| Login works but the next page says "Please log in" | Open the app at `http://localhost:5173`, not `127.0.0.1`, and make sure `CLIENT_URL` in `backend/.env` is exactly `http://localhost:5173` |
| `npm install` fails on `bcrypt` | Use Node 18 or 20 LTS; the package downloads a prebuilt binary for these versions |
| CORS error in the browser console | Backend `CLIENT_URL` must match the frontend address and port |
