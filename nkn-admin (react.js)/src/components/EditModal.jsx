import React, { useState, useEffect, useRef } from 'react'

export default function EditModal({ data = [], index = null, onClose, onSave, onUpdate }) {
  const isNew = index === null
  const makeBase = () => (data[0] ? Object.keys(data[0]).reduce((acc,k)=>{acc[k]='';return acc},{}) : {})
  const [rows, setRows] = useState(isNew ? [makeBase()] : collectGroup(data, index))
  const [visible, setVisible] = useState((isNew ? [makeBase()] : collectGroup(data, index)).map(()=>true))
  const [activeRow, setActiveRow] = useState(null)
  const modalBodyRef = useRef(null)

  useEffect(() => {
    const newRows = isNew ? [makeBase()] : collectGroup(data, index)
    setRows(newRows)
    setVisible(newRows.map(()=>true))
    setActiveRow(null)
  }, [data, index, isNew])

  function updateField(rowIdx, key, value) {
    const copy = [...rows]
    copy[rowIdx] = { ...copy[rowIdx], [key]: value }
    setRows(copy)
  }

  function save() {
    const newData = [...data]
    if (isNew) {
      rows.forEach(r => newData.push(r))
    } else {
      // replace group's rows starting at index
      let start = index
      if (!newData[start]['S.No']) { while (start>0 && !newData[start]['S.No']) start-- }
      // remove existing group rows
      const group = collectGroupIndexes(newData, start)
      // splice: remove existing group and insert new rows
      group.sort((a,b)=>b-a).forEach(i=>newData.splice(i,1))
      newData.splice(start,0,...rows)
    }
    localStorage.setItem('contactsData', JSON.stringify(newData))
    onSave(newData)
  }

  function saveRow(rowIdx) {
    const newData = [...data]
    if (isNew) {
      newData.push(rows[rowIdx])
    } else {
      let start = index
      if (!newData[start]['S.No']) { while (start>0 && !newData[start]['S.No']) start-- }
      const group = collectGroupIndexes(newData, start)
      const target = group[rowIdx]
      if (typeof target !== 'undefined') {
        newData[target] = rows[rowIdx]
      }
    }
    localStorage.setItem('contactsData', JSON.stringify(newData))
    if (typeof onUpdate === 'function') onUpdate(newData)
    else onSave(newData)
  }

  function deleteRow(rowIdx) {
    if (isNew) {
      const copy = [...rows]
      copy.splice(rowIdx,1)
      setRows(copy)
      setVisible(copy.map(()=>true))
      return
    }
    if (!confirm('Delete this row?')) return
    const newData = [...data]
    let start = index
    if (!newData[start]['S.No']) { while (start>0 && !newData[start]['S.No']) start-- }
    const group = collectGroupIndexes(newData, start)
    const target = group[rowIdx]
    if (typeof target !== 'undefined') {
      newData.splice(target,1)
      localStorage.setItem('contactsData', JSON.stringify(newData))
      if (typeof onUpdate === 'function') onUpdate(newData)
      else onSave(newData)
    }
  }

  function showRow(rowIdx) {
    const copy = [...visible]
    copy[rowIdx] = true
    setVisible(copy)
    setActiveRow(rowIdx)
    // scroll into view inside modal body
    setTimeout(() => {
      const el = document.getElementById(`row-${rowIdx}`)
      if (el) {
        if (modalBodyRef && modalBodyRef.current && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // ensure the modal-body container scrolls to align top
          try {
            const parent = modalBodyRef.current
            parent.scrollTop = el.offsetTop - parent.offsetTop
          } catch (e) {}
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 40)
  }

  return (
    <div className="modal" style={{display:'block'}}>
      <div className="modal-content">
        <h3>{isNew ? 'Add Contact' : 'Edit Contact'}</h3>
        <div className="modal-body" ref={modalBodyRef}>
          <div className="row-toolbar" style={{marginBottom:10}}>
            {rows.map((_,ri) => (
              <button key={ri} type="button" onClick={() => showRow(ri)} style={{marginRight:6}}>
                Row {ri+1}
              </button>
            ))}
          </div>
          <form id="editForm">
            {rows.map((r,ri) => (
              <div className={`row-block ${activeRow===ri?'active-row':''}`} key={ri} id={`row-${ri}`} style={{display: visible[ri] ? 'block' : 'none', border:'1px solid #eee', padding:8, marginBottom:8}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h4 style={{margin:0}}>Row {ri+1}</h4>
                  <div>
                    <button type="button" onClick={() => saveRow(ri)} style={{marginRight:6}}>Save Row</button>
                    <button type="button" onClick={() => deleteRow(ri)}>Delete Row</button>
                  </div>
                </div>
                {Object.keys(r).map(k => (
                  <div key={k} style={{marginBottom:8}}>
                    <label>{k}</label>
                    <input value={r[k]||''} onChange={e => updateField(ri,k,e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
          </form>
        </div>
        <div className="modal-actions">
          <button onClick={save}>Save</button>
          <button onClick={() => { if (!isNew) { if (!confirm('Delete group?')) return; const newData = deleteGroupAt(data, index); localStorage.setItem('contactsData', JSON.stringify(newData)); onSave(newData); } else onClose() }}>Delete</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function collectGroup(data, index) {
  if (index === null) return [Object.keys(data[0]||{}).reduce((a,k)=>{a[k]='';return a},{})]
  let start = index
  if (!data[start]['S.No']) { while (start>0 && !data[start]['S.No']) start-- }
  const group = [start]
  let k = start+1
  while (k<data.length && !data[k]['S.No']) { group.push(k); k++ }
  return group.map(i => ({ ...data[i] }))
}

function collectGroupIndexes(data, start) {
  const idxs = [start]
  let k = start+1
  while (k<data.length && !data[k]['S.No']) { idxs.push(k); k++ }
  return idxs
}

function deleteGroupAt(data, idx) {
  let start = idx
  if (!data[start]['S.No']) { while (start>0 && !data[start]['S.No']) start-- }
  const group = collectGroupIndexes(data, start)
  const copy = [...data]
  group.sort((a,b)=>b-a).forEach(i=>copy.splice(i,1))
  return copy
}
