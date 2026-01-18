import React from 'react'

export default function ContactTable({ data = [], search = '', role = 'USER', onEdit }) {
  if (!data || data.length === 0) return <div style={{padding:20}}>No data</div>

  const cols = Object.keys(data[0])
  const queried = search.trim().toLowerCase()
  const rows = queried ? data.filter(r => Object.values(r).some(v => String(v||'').toLowerCase().includes(queried))) : data

  return (
    <table id="contactTable">
      <thead>
        <tr>
          {cols.map(c => (
            <th key={c} className="col-header">
              <span className="col-title">{c}</span>
              <button className="col-delete" title={`Delete column ${c}`} onClick={e => { e.stopPropagation(); if (!confirm('Delete column "' + c + '" from all rows?')) return; deleteColumn(data, c) }}>&times;</button>
            </th>
          ))}
          {role === 'ADMIN' && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const actualIndex = data.indexOf(row)
          return (
            <tr key={idx} className={row['S.No'] ? 'group-start' : ''} onClick={() => { if (role==='ADMIN' && row['S.No']) onEdit(actualIndex) }}>
              {cols.map(c => <td key={c}>{row[c] || ''}</td>)}
              {role==='ADMIN' && (
                <td className="action-cell">
                  {row['S.No'] ? (
                    <>
                      <button className="edit-btn" onClick={e => { e.stopPropagation(); onEdit(actualIndex) }}>✏ Edit</button>
                      <button className="plus-btn" onClick={e => { e.stopPropagation(); insertRowBelow(data, actualIndex) }} title="Insert row below">➕</button>
                    </>
                  ) : <span />}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function insertRowBelow(data, index) {
  const newRow = {}
  Object.keys(data[0]).forEach(k => newRow[k] = '')
  data.splice(index+1, 0, newRow)
  // Persist change
  localStorage.setItem('contactsData', JSON.stringify(data))
  // force reload by dispatching storage event (simple approach)
  window.location.reload()
}

function deleteColumn(data, col) {
  for (let i = 0; i < data.length; i++) {
    if (data[i] && Object.prototype.hasOwnProperty.call(data[i], col)) {
      delete data[i][col]
    }
  }
  localStorage.setItem('contactsData', JSON.stringify(data))
  window.location.reload()
}
