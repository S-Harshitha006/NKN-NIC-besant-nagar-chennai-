import React, { useEffect, useState } from 'react'
import ContactTable from './components/ContactTable'
import EditModal from './components/EditModal'

const ROLE = 'ADMIN'

export default function App() {
  const [rawData, setRawData] = useState([])
  const [search, setSearch] = useState('')
  const [modalState, setModalState] = useState({ open: false, index: null })

  useEffect(() => {
    const cached = localStorage.getItem('contactsData')
    let parsed = null
    try { parsed = cached ? JSON.parse(cached) : null } catch(e) { parsed = null }
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      setRawData(parsed)
      console.log('Loaded from localStorage')
    } else {
      fetch('/demo.json')
        .then(r => r.json())
        .then(data => {
          setRawData(data)
          try { localStorage.setItem('contactsData', JSON.stringify(data)) } catch(e) {}
          console.log('Loaded demo.json')
        })
        .catch(err => console.error('Failed loading demo.json', err))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('contactsData', JSON.stringify(rawData))
  }, [rawData])

  function exportCSV() {
    if (!rawData || rawData.length === 0) return alert('No data to export')
    const cols = Object.keys(rawData[0])
    const rows = [cols.join(',')]
    rawData.forEach(r => {
      const vals = cols.map(c => {
        const v = r[c] == null ? '' : String(r[c])
        if (v.indexOf(',') >= 0 || v.indexOf('\n') >= 0 || v.indexOf('"') >= 0) {
          return '"' + v.replace(/"/g, '""') + '"'
        }
        return v
      })
      rows.push(vals.join(','))
    })
    const csvContent = '\uFEFF' + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_export.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function saveToServer() {
    fetch('/api/save-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawData)
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) alert('Saved to server: ' + res.count)
        else alert('Server error: ' + res.message)
      })
      .catch(err => alert('Failed to connect to server. Saved locally.'))
  }

  function addColumn(name) {
    if (!name) return
    const updated = rawData.map(r => ({ ...r, [name]: '' }))
    setRawData(updated)
  }

  return (
    <div>
      <h1>NKN Contact Directory – NIC</h1>

      <div className="toolbar">
        <input placeholder="Search Institute / Name / Email" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{fontWeight:600}}>Role: {ROLE}</span>
        <button onClick={() => setModalState({ open: true, index: null })}>+ Add</button>
        <button onClick={saveToServer}>💾 Save XML</button>
        <button onClick={exportCSV}>📥 Export Excel</button>
        <AddColumn onAdd={addColumn} />
      </div>

      <ContactTable data={rawData} search={search} role={ROLE} onEdit={i => setModalState({ open: true, index: i })} />

      {modalState.open && (
        <EditModal
          data={rawData}
          index={modalState.index}
          onClose={() => setModalState({ open: false, index: null })}
          onSave={d => { setRawData(d); setModalState({ open: false, index: null }) }}
          onUpdate={d => { setRawData(d) }}
        />
      )}
    </div>
  )
}

function AddColumn({ onAdd }) {
  const [val, setVal] = useState('')
  return (
    <div style={{display:'flex', gap:8}}>
      <input placeholder="New Column Name" value={val} onChange={e => setVal(e.target.value)} />
      <button onClick={() => { onAdd(val.trim()); setVal('') }}>Add Column</button>
    </div>
  )
}
