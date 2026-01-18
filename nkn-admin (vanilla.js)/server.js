const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// Enable CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API endpoint to save contacts to demo.json
app.post('/api/save-contacts', (req, res) => {
  try {
    const contactsData = req.body;

    // Validate data
    if (!Array.isArray(contactsData) || contactsData.length === 0) {
      return res.json({ success: false, message: "Invalid data format" });
    }

    // Write to demo.json
    const filePath = path.join(__dirname, 'demo.json');
    fs.writeFileSync(filePath, JSON.stringify(contactsData, null, 2), 'utf8');

    console.log('✓ Contacts saved to demo.json');
    res.json({ success: true, message: "Contacts saved successfully", count: contactsData.length });
  } catch (err) {
    console.error('❌ Error saving contacts:', err);
    res.json({ success: false, message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "Server running", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   NKN Contact Directory - Server      ║
║   ✓ Running on http://localhost:${PORT}  ║
║                                        ║
║   Open: http://localhost:${PORT}        ║
╚════════════════════════════════════════╝
  `);
});
