require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'contacts.json');

// Set this in a .env file to enable real AI-generated summaries.
// Without it, the app still works — it falls back to a rule-based summary.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

app.use(cors());
app.use(express.json());

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Helper: Read contacts
const readContacts = () => {
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

// Helper: Write contacts
const writeContacts = (contacts) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(contacts, null, 2));
};

// ============================================================
// EXISTING CRUD ENDPOINTS (unchanged)
// ============================================================

app.get('/api/contacts', (req, res) => {
  const contacts = readContacts();
  res.json(contacts);
});

app.post('/api/contacts', (req, res) => {
  const { name, email, phone, company, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }
  const contacts = readContacts();
  const newContact = {
    id: Date.now().toString(),
    name,
    email,
    phone: phone || '',
    company: company || '',
    status: status || 'Lead',
    createdAt: new Date().toISOString(),
    notes: []
  };
  contacts.push(newContact);
  writeContacts(contacts);
  res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contact not found' });
  contacts[index] = { ...contacts[index], ...req.body };
  writeContacts(contacts);
  res.json(contacts[index]);
});

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  let contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contact not found' });
  contacts = contacts.filter(c => c.id !== id);
  writeContacts(contacts);
  res.json({ message: 'Contact deleted' });
});

app.get('/api/stats', (req, res) => {
  const contacts = readContacts();
  const stats = {
    total: contacts.length,
    leads: contacts.filter(c => c.status === 'Lead').length,
    active: contacts.filter(c => c.status === 'Active').length,
    closed: contacts.filter(c => c.status === 'Closed').length,
  };
  res.json(stats);
});

// ============================================================
// FEATURE 1: RULE-BASED LEAD SCORING
// Scores each contact 0-100 based on status, recency, and
// interaction history. This is a transparent, rule-based engine —
// a common first step before a company invests in a trained ML
// scoring model, and easy to explain in an interview.
// ============================================================

function computeLeadScore(contact) {
  let score = 0;

  // Status weight — how far along the funnel
  if (contact.status === 'Lead') score += 30;
  else if (contact.status === 'Active') score += 60;
  else if (contact.status === 'Closed') score += 90;

  // Recency weight — how recently was this contact created/updated
  const daysSinceCreated = (Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 7) score += 15;
  else if (daysSinceCreated <= 30) score += 8;

  // Engagement weight — number of logged interactions
  const noteCount = (contact.notes || []).length;
  score += Math.min(noteCount * 5, 15);

  return Math.min(Math.round(score), 100);
}

function scoreLabel(score) {
  if (score >= 75) return 'Hot';
  if (score >= 45) return 'Warm';
  return 'Cold';
}

app.get('/api/contacts/scored', (req, res) => {
  const contacts = readContacts();
  const scored = contacts.map(c => {
    const leadScore = computeLeadScore(c);
    return { ...c, leadScore, scoreLabel: scoreLabel(leadScore) };
  });
  res.json(scored);
});

// ============================================================
// FEATURE 2: AI-POWERED CONTACT SUMMARY
// Calls the OpenAI API to generate a short summary of a contact's
// interaction history. If no API key is configured, falls back to
// a simple extractive summary so the app still runs end-to-end.
// ============================================================

async function callOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a sales assistant. Summarize CRM contact notes in 2 short sentences, focused on deal status and next steps.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 120
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
}

// Fallback used when no API key is set, or if the API call fails.
// Purely rule-based extractive summary — no external dependency.
function fallbackSummary(contact) {
  const notes = contact.notes || [];
  if (notes.length === 0) {
    return `No interaction history yet for ${contact.name}. Status: ${contact.status}.`;
  }
  const latest = notes[notes.length - 1];
  return `${contact.name} (${contact.company || 'no company listed'}) is currently marked as "${contact.status}". ` +
         `${notes.length} interaction(s) logged — most recent on ${latest.date}: "${latest.text}"`;
}

app.post('/api/contacts/:id/summary', async (req, res) => {
  const { id } = req.params;
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contact not found' });

  const contact = contacts[index];
  const notesText = (contact.notes || []).map(n => `- ${n.date}: ${n.text}`).join('\n') || 'No notes logged yet.';
  const prompt = `Contact: ${contact.name}, Company: ${contact.company}, Status: ${contact.status}\nInteraction history:\n${notesText}`;

  let summary;
  let source;

  if (OPENAI_API_KEY) {
    try {
      summary = await callOpenAI(prompt);
      source = 'openai';
    } catch (err) {
      console.error('OpenAI call failed, using fallback:', err.message);
      summary = fallbackSummary(contact);
      source = 'fallback';
    }
  } else {
    summary = fallbackSummary(contact);
    source = 'fallback';
  }

  // Cache the summary on the contact record
  contacts[index].aiSummary = summary;
  writeContacts(contacts);

  res.json({ summary, source });
});

// ============================================================
// FEATURE 3: NATURAL-LANGUAGE SMART SEARCH
// Parses simple natural-language queries like:
//   "leads from this week"
//   "closed contacts at TechCorp"
//   "active contacts added last month"
// and translates them into structured filters — a lightweight
// rule-based NLP layer over the existing contact data.
// ============================================================

function parseSmartQuery(query) {
  const q = query.toLowerCase();
  const filters = { status: null, company: null, daysBack: null };

  // Status detection
  if (q.includes('lead')) filters.status = 'Lead';
  else if (q.includes('active')) filters.status = 'Active';
  else if (q.includes('closed')) filters.status = 'Closed';

  // Time window detection
  if (q.includes('today')) filters.daysBack = 1;
  else if (q.includes('this week') || q.includes('last week')) filters.daysBack = 7;
  else if (q.includes('this month') || q.includes('last month')) filters.daysBack = 30;

  // Company detection — match against known company names in the query
  const contacts = readContacts();
  const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))];
  for (const company of companies) {
    if (q.includes(company.toLowerCase())) {
      filters.company = company;
      break;
    }
  }

  return filters;
}

app.post('/api/search/smart', (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.json({ results: readContacts(), filters: {} });
  }

  const filters = parseSmartQuery(query);
  let contacts = readContacts();

  if (filters.status) {
    contacts = contacts.filter(c => c.status === filters.status);
  }
  if (filters.company) {
    contacts = contacts.filter(c => c.company === filters.company);
  }
  if (filters.daysBack) {
    const cutoff = Date.now() - filters.daysBack * 24 * 60 * 60 * 1000;
    contacts = contacts.filter(c => new Date(c.createdAt).getTime() >= cutoff);
  }

  // If nothing structured was detected, fall back to plain text search
  const nothingParsed = !filters.status && !filters.company && !filters.daysBack;
  if (nothingParsed) {
    const q = query.toLowerCase();
    contacts = contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }

  res.json({ results: contacts, filters });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(OPENAI_API_KEY ? 'OpenAI API key detected — AI summaries enabled.' : 'No OpenAI API key set — AI summaries will use rule-based fallback.');
});
