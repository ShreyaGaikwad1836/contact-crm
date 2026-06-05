# 📇 MetroLeads CRM — Contact Manager

A full stack Contact Management CRM web application built with **Node.js**, **Express.js**, and **Vanilla JavaScript**.

## 🚀 Features

- ✅ Add, Edit, Delete Contacts
- ✅ Filter contacts by Status (Lead / Active / Closed)
- ✅ Search contacts by name, email, or company
- ✅ Live stats dashboard (Total, Leads, Active, Closed)
- ✅ REST API backend with JSON file storage
- ✅ Responsive UI with dark theme

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Storage | JSON File (contacts.json) |
| API | RESTful API |

## 📁 Project Structure

```
contact-crm/
├── backend/
│   ├── server.js        # Express REST API
│   ├── contacts.json    # Data storage
│   └── package.json
├── frontend/
│   └── index.html       # Full frontend (single file)
└── README.md
```

## ⚙️ Setup & Run

### Step 1 — Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2 — Start the Backend Server
```bash
node server.js
```
Server runs at: `http://localhost:5000`

### Step 3 — Open Frontend
Open `frontend/index.html` in your browser (double-click or use Live Server in VS Code).

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/contacts | Get all contacts |
| POST | /api/contacts | Add new contact |
| PUT | /api/contacts/:id | Update contact |
| DELETE | /api/contacts/:id | Delete contact |
| GET | /api/stats | Get dashboard stats |

## 📸 Screenshots

> Add screenshots of your running app here after launch.

## 👨‍💻 Author

Built as a Full Stack internship project demonstrating REST API design and frontend development skills.
