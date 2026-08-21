# 📇 MetroLeads CRM — Contact Manager

A full stack Contact Management CRM web application built with **Node.js**, **Express.js**, and **Vanilla JavaScript**, enhanced with AI-assisted features.

## 🚀 Features

- ✅ Add, Edit, Delete Contacts
- ✅ Filter contacts by Status (Lead / Active / Closed)
- ✅ Search contacts by name, email, or company
- ✅ Live stats dashboard (Total, Leads, Active, Closed)
- ✅ REST API backend with JSON file storage
- ✅ Responsive UI with dark theme
- ✨ **AI-assisted lead scoring** — rule-based engine scores each contact 0–100 (Hot / Warm / Cold) based on status, recency, and interaction history
- ✨ **AI-generated contact summaries** — calls the OpenAI API to summarize a contact's interaction history into 2 sentences (falls back to a rule-based extractive summary if no API key is configured, so the app always works)
- ✨ **Natural-language smart search** — type queries like *"leads from this week"* or *"closed contacts at TechCorp"* instead of using dropdown filters

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| AI Integration | OpenAI API (gpt-4o-mini) with rule-based fallback |
| Storage | JSON File (contacts.json) |
| API | RESTful API |

## 📁 Project Structure

```
contact-crm/
├── backend/
│   ├── server.js        # Express REST API + AI endpoints
│   ├── contacts.json    # Data storage (includes interaction notes)
│   ├── .env.example     # Copy to .env and add your OpenAI key (optional)
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

### Step 2 (Optional) — Enable real AI summaries
```bash
cp .env.example .env
# then edit .env and add: OPENAI_API_KEY=your_key_here
```
Without this step, the app still works — AI Summary falls back to a rule-based summary generated from the contact's logged notes.

### Step 3 — Start the Backend Server
```bash
node server.js
```
Server runs at: `http://localhost:5000`

### Step 4 — Open Frontend
Open `frontend/index.html` in your browser (double-click or use Live Server in VS Code).

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/contacts | Get all contacts |
| POST | /api/contacts | Add new contact |
| PUT | /api/contacts/:id | Update contact |
| DELETE | /api/contacts/:id | Delete contact |
| GET | /api/stats | Get dashboard stats |
| GET | /api/contacts/scored | Get contacts with computed lead score (0–100) and label (Hot/Warm/Cold) |
| POST | /api/contacts/:id/summary | Generate an AI (or rule-based fallback) summary of a contact's interaction history |
| POST | /api/search/smart | Parse a natural-language query and return matching contacts |

## 🧠 How the AI features work

**Lead Scoring** — a transparent, rule-based scoring function (`computeLeadScore` in `server.js`) that weights status, recency, and number of logged interactions. It's a common first step teams take before investing in a trained ML scoring model, and is easy to explain end-to-end.

**AI Contact Summary** — sends the contact's logged interaction notes to OpenAI's Chat Completions API (`gpt-4o-mini`) with a prompt asking for a 2-sentence summary. If no API key is set, or the API call fails, it falls back to an extractive summary built from the most recent note — so the feature is always demoable.

**Smart Search** — a lightweight rule-based NLP layer (`parseSmartQuery` in `server.js`) that detects status keywords, time windows ("today", "this week", "this month"), and company names in a free-text query, then converts them into structured filters.

## 👨‍💻 Author

Built as a Full Stack project demonstrating REST API design, frontend development, and AI-assisted feature integration.
