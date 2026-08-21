const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'contacts.json');

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

// GET all contacts
app.get('/api/contacts', (req, res) => {
  const contacts = readContacts();
  res.json(contacts);
});

// POST add contact
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
    createdAt: new Date().toISOString()
  };
  contacts.push(newContact);
  writeContacts(contacts);
  res.status(201).json(newContact);
});

// PUT update contact
app.put('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contact not found' });
  contacts[index] = { ...contacts[index], ...req.body };
  writeContacts(contacts);
  res.json(contacts[index]);
});

// DELETE contact
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  let contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contact not found' });
  contacts = contacts.filter(c => c.id !== id);
  writeContacts(contacts);
  res.json({ message: 'Contact deleted' });
});

// GET stats
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
