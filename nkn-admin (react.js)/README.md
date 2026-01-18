# NKN Contact Directory - Hybrid Persistence Setup ✓

## Overview
This project now has **hybrid persistence** - data is automatically saved locally AND synced to the server.

---

## How It Works

### 1️⃣ **Client-Side (Browser) - localStorage**
- **Auto-Save**: Every edit (add, modify, delete, add column) automatically saves to browser's localStorage
- **Persistent**: Data survives closing the window/tab
- **Fast**: No server needed for everyday edits
- **Offline Ready**: Works even without server connection

### 2️⃣ **Server-Side - Node.js Express**
- **Save Button**: Clicking "💾 Save XML" sends data to backend
- **Permanent Storage**: Backend writes changes to `demo.json`
- **Sync**: Keeps file system in sync with browser edits
- **Backup**: Saves XML to physical file for export/archive

---

## Setup & Installation

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Start the Server**
```bash
npm start
# or
node server.js
```

You'll see:
```
╔════════════════════════════════════╗
║   NKN Contact Directory - Server      ║
║   ✓ Running on http://localhost:3000  ║
║                                        ║
║   Open: http://localhost:3000         ║
╚════════════════════════════════════╝
```

### **Step 3: Open in Browser**
Navigate to: **http://localhost:3000**

---

## Data Flow

```
┌─────────────────────────────────────────┐
│         Browser (index.html)            │
│                                         │
│  1. Load data from demo.json           │
│  2. Cache in localStorage              │
│                                         │
│  ▼ User makes edits                    │
│                                         │
│  3. Auto-save to localStorage          │
│     (instant, no server needed)        │
│                                         │
│  ▼ User clicks "Save XML"              │
│                                         │
│  4. Send data to backend API           │
│     /api/save-contacts (POST)          │
└─────────────────────────────────────────┘
         ▼ Network Call ▼
┌─────────────────────────────────────────┐
│    Backend Server (Node.js/Express)    │
│                                         │
│  5. Validate incoming JSON data        │
│                                         │
│  6. Write to demo.json                 │
│     (permanent storage)                │
│                                         │
│  7. Return success response            │
└─────────────────────────────────────────┘
```

---

## Key Features Implemented

✅ **Auto-Save to localStorage**
- Happens automatically on every edit
- No clicks needed
- Persists across browser sessions

✅ **Server Sync**
- Click "Save XML" to sync to demo.json
- Server validates data
- Success/error feedback in browser

✅ **Offline Support**
- Works without server (localStorage only)
- Server optional for permanent file updates

✅ **Backward Compatible**
- Original functionality unchanged
- All edit/delete/add features still work
- XML generation still available in console

---

## Files Modified/Created

| File | Purpose |
|------|---------|
| `archive/app.js` | 🗄️ Legacy plain-JS frontend (archived, now removed) |
| `server.js` | 🆕 Express backend for saving to demo.json |
| `package.json` | 🆕 Node.js dependencies |
| `README.md` | 🆕 This file |

---

## API Endpoints

### **POST /api/save-contacts**
Saves contacts to demo.json

**Request:**
```json
[
  {
    "S.No": 1,
    "Institute Name": "...",
    "Name": "...",
    ...
  }
]
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contacts saved successfully",
  "count": 45
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid data format"
}
```

### **GET /api/health**
Check server status

**Response:**
```json
{
  "status": "Server running",
  "timestamp": "2025-12-29T10:30:45.123Z"
}
```

---

## Troubleshooting

### ❌ "Failed to connect to server"
- Check if `node server.js` is running
- Verify http://localhost:3000 is accessible
- Changes are still saved to localStorage (no data loss)

### ❌ demo.json not updating
- Verify server is running
- Check browser console for errors
- Ensure you clicked "Save XML" button

### ❌ localStorage not working
- Check browser's localStorage is enabled
- Try in a different browser
- Clear cache if you see stale data

---

## Local Development Workflow

```
1. Start server:        npm start
2. Open browser:        http://localhost:3000
3. Make edits:          They auto-save to localStorage
4. Save permanently:    Click "Save XML" button
5. Verify:              Check demo.json was updated
6. Close window:        Data persists on reload
```

---

## Production Notes

For production, consider:
- ✅ Use a real database instead of JSON file
- ✅ Add authentication/authorization
- ✅ Add input validation & sanitization
- ✅ Use HTTPS instead of HTTP
- ✅ Add error logging & monitoring
- ✅ Implement backup strategy

---

## Testing the Hybrid Persistence

1. **Edit a contact** → Auto-saves to localStorage
2. **Close browser tab** → Reopen, data still there ✓
3. **Click "Save XML"** → Writes to demo.json on server
4. **Restart server** → Data loads from demo.json
5. **Make more edits** → Auto-saved to localStorage again

---

**Status: ✓ Ready to use!**
