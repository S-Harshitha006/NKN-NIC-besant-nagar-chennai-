const ROLE = "ADMIN"; // change to USER for read-only
let rawData = [];
let currentEditIndex = null;
let currentEditGroup = [];
let selectedRowIndex = null;

document.getElementById("roleBadge").innerText = `Role: ${ROLE}`;

// Load data from localStorage if available, otherwise fetch from demo.json
function loadData() {
  const cached = localStorage.getItem("contactsData");
  if (cached) {
    rawData = JSON.parse(cached);
    renderTable();
    applyRoleRules();
    console.log("✓ Data loaded from localStorage");
  } else {
    fetch("demo.json")
      .then(r => r.json())
      .then(data => {
        rawData = data;
        localStorage.setItem("contactsData", JSON.stringify(rawData));
        renderTable();
        applyRoleRules();
        console.log("✓ Data loaded from demo.json and cached");
      });
  }
}

loadData();

// Auto-save to localStorage after any edit
function autoSaveToLocalStorage() {
  localStorage.setItem("contactsData", JSON.stringify(rawData));
  console.log("💾 Auto-saved to localStorage");
}

// Search/filter helper — returns rows matching the search query
function getFilteredData() {
  const el = document.getElementById('search');
  const q = (el && el.value) ? el.value.trim().toLowerCase() : '';
  if (!q) return rawData;

  return rawData.filter(row => {
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(q));
  });
}

// wire search input to re-render on change
const searchInput = document.getElementById('search');
if (searchInput) searchInput.addEventListener('input', renderTable);

function renderTable() {
  const thead = document.getElementById("tableHead");
  const tbody = document.querySelector("#contactTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!rawData || rawData.length === 0) return;

  const cols = Object.keys(rawData[0]);

  // get filtered rows based on search input
  const rows = getFilteredData();

  cols.forEach(c => {
    const th = document.createElement("th");
    th.classList.add('col-header');

    const title = document.createElement('span');
    title.classList.add('col-title');
    title.innerText = c;
    th.appendChild(title);

    // small delete button (hidden by CSS until header hover)
    const del = document.createElement('button');
    del.classList.add('col-delete');
    del.title = `Delete column ${c}`;
    del.innerText = '✖';
    del.onclick = (ev) => { ev.stopPropagation(); deleteColumn(c); };
    th.appendChild(del);

    thead.appendChild(th);
  });

  if (ROLE === "ADMIN") {
    const th = document.createElement("th");
    th.innerText = "Action";
    thead.appendChild(th);
  }

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    if (row["S.No"]) tr.classList.add("group-start");

    // Map the displayed (filtered) row back to the original rawData index
    const actualIndex = rawData.indexOf(row);

    tr.onclick = () => {
      selectedRowIndex = actualIndex;
      // Only open editor when clicking a group-start row (S.No present)
      if (ROLE === "ADMIN" && rawData[actualIndex]["S.No"]) openEdit(actualIndex);
    };

    cols.forEach(c => {
      const td = document.createElement("td");
      td.innerText = row[c] || "";
      tr.appendChild(td);
    });

    if (ROLE === "ADMIN") {
      // show actions only for group-start rows (rows having S.No)
      if (rawData[actualIndex]["S.No"]) {
        const td = document.createElement("td");
        td.classList.add("action-cell");

        td.innerHTML = `
          <button class="edit-btn"
            onclick="event.stopPropagation(); openEdit(${actualIndex})">
            ✏ Edit
          </button>

          <button class="plus-btn"
            onclick="event.stopPropagation(); insertRowBelow(${actualIndex})"
            title="Insert row below">
            ➕
          </button>
        `;

        tr.appendChild(td);
      } else {
        const td = document.createElement("td");
        td.classList.add("action-cell");
        td.innerHTML = ""; // keep table column alignment
        tr.appendChild(td);
      }
    }


    tbody.appendChild(tr);
  });
}

function insertRowBelow(index) {
  const newRow = {};

  Object.keys(rawData[0]).forEach(key => {
    newRow[key] = "";
  });

  rawData.splice(index + 1, 0, newRow);
  autoSaveToLocalStorage();
  renderTable();
}

function openEdit(index) {
  // determine group start: if clicked row doesn't have S.No, find previous group start
  let start = index;
  if (!rawData[start]["S.No"]) {
    while (start > 0 && !rawData[start]["S.No"]) start--;
  }

  // collect contiguous rows belonging to this group (start + following rows until next S.No)
  const group = [start];
  let k = start + 1;
  while (k < rawData.length && !rawData[k]["S.No"]) {
    group.push(k);
    k++;
  }

  currentEditGroup = group;
  currentEditIndex = start;

  const form = document.getElementById("editForm");
  form.innerHTML = "";

  group.forEach((rowIndex, idx) => {
    form.innerHTML += `<div class="row-block" id="row-${rowIndex}"><h4>Row ${idx + 1}</h4>`;
    Object.keys(rawData[0]).forEach(key => {
      const val = rawData[rowIndex][key] || "";
      // input name encodes the actual data index and key so save handler can map back
      const name = `r${rowIndex}__${key}`;
      form.innerHTML += `
        <label>${key}</label>
        <input name="${name}" value="${val}">
      `;
    });
    // per-row actions
    form.innerHTML += `
      <div class="row-actions">
        <button type="button" onclick="saveRow(${rowIndex})">Save Row</button>
        <button type="button" onclick="deleteRowAt(${rowIndex})">Delete Row</button>
      </div>
    `;
    form.innerHTML += `</div>`;
  });

  document.getElementById("modal").style.display = "block";

  // render row tabs at top
  const tabs = document.getElementById('rowTabs');
  tabs.innerHTML = '';
  group.forEach((rIdx, i) => {
    const btn = document.createElement('button');
    btn.className = 'row-tab';
    btn.innerText = `Row ${i+1}`;
    btn.onclick = () => openRowInModal(rIdx);
    tabs.appendChild(btn);
  });
}

// Scroll to a specific row block inside the modal and highlight it
function openRowInModal(rowIndex) {
  const el = document.getElementById(`row-${rowIndex}`);
  if (!el) return;
  // remove active class from others
  document.querySelectorAll('.row-block.active-row').forEach(x => x.classList.remove('active-row'));
  el.classList.add('active-row');
  // ensure modal-body scrolls to the element
  const container = document.querySelector('.modal-body');
  if (container) {
    const top = el.offsetTop - container.offsetTop - 12;
    container.scrollTo({ top, behavior: 'smooth' });
  }
}

// Save only the fields for a single row
function saveRow(rowIndex) {
  const inputs = document.querySelectorAll(`#editForm input[name^="r${rowIndex}__"]`);
  if (!inputs || inputs.length === 0) return;
  inputs.forEach(i => {
    const m = i.name.match(/^r(\d+)__(.+)$/);
    if (m) {
      const idx = parseInt(m[1],10);
      const key = m[2];
      if (rawData[idx]) rawData[idx][key] = i.value;
    }
  });
  autoSaveToLocalStorage();
  alert('Row saved');
  renderTable();
}

// Delete only a single row (within group)
function deleteRowAt(rowIndex) {
  if (!confirm('Delete this row?')) return;
  // find index in rawData
  const idx = rowIndex;
  if (typeof idx === 'number' && rawData[idx]) {
    rawData.splice(idx,1);
    currentEditGroup = currentEditGroup.filter(i => i !== idx).map(i => i > idx ? i-1 : i);
    currentEditIndex = currentEditIndex > idx ? currentEditIndex-1 : currentEditIndex;
    autoSaveToLocalStorage();
    // re-open modal for updated group if group still exists
    closeModal();
    renderTable();
    if (currentEditIndex !== null && rawData[currentEditIndex]) openEdit(currentEditIndex);
  }
}

document.getElementById("addBtn").onclick = () => {
  currentEditIndex = null;
  const form = document.getElementById("editForm");
  form.innerHTML = "";

  Object.keys(rawData[0]).forEach(key => {
    form.innerHTML += `
      <label>${key}</label>
      <input name="${key}" value="">
    `;
  });

  document.getElementById("modal").style.display = "block";
};

// Export current data as CSV file that Excel can open
document.getElementById('exportBtn').onclick = exportToExcel;

function exportToExcel() {
  if (!rawData || rawData.length === 0) return alert('No data to export');

  const cols = Object.keys(rawData[0]);

  // Build CSV rows
  const rows = [cols.join(',')];

  rawData.forEach(r => {
    const vals = cols.map(c => {
      const v = r[c] == null ? '' : String(r[c]);
      // escape quotes and wrap fields containing commas/newlines
      if (v.indexOf(',') >= 0 || v.indexOf('\n') >= 0 || v.indexOf('"') >= 0) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    });
    rows.push(vals.join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\n'); // BOM for Excel utf-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const name = `contacts_export_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.csv`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function saveEdit() {
  const inputs = document.querySelectorAll("#editForm input");

  // If we're creating a new row (no currentEditIndex), behave as before
  if (currentEditIndex === null) {
    let obj = {};
    inputs.forEach(i => obj[i.name] = i.value);

    const pos = document.getElementById("insertPosition").value;
    if (pos === "top") rawData.unshift(obj);
    else if (pos === "after" && selectedRowIndex !== null)
      rawData.splice(selectedRowIndex + 1, 0, obj);
    else rawData.push(obj);
  } else {
    // update any inputs that encode an actual row index
    inputs.forEach(i => {
      const m = i.name.match(/^r(\d+)__(.+)$/);
      if (m) {
        const idx = parseInt(m[1], 10);
        const key = m[2];
        if (rawData[idx]) rawData[idx][key] = i.value;
      }
    });
  }

  autoSaveToLocalStorage();
  closeModal();
  renderTable();
}

function deleteRow() {
  if (currentEditIndex !== null) {
    if (currentEditGroup && currentEditGroup.length > 1) {
      if (!confirm("Delete entire project group? This will remove all rows in the group.")) return;
      // delete from highest index to lowest so splices don't shift remaining indices
      currentEditGroup.sort((a,b)=>b-a).forEach(i => rawData.splice(i,1));
    } else {
      rawData.splice(currentEditIndex, 1);
    }

    currentEditGroup = [];
    currentEditIndex = null;
    autoSaveToLocalStorage();
    closeModal();
    renderTable();
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

document.getElementById("addColBtn").onclick = () => {
  const col = document.getElementById("newColName").value.trim();
  if (!col) return alert("Enter column name");

  rawData.forEach(r => r[col] = "");
  autoSaveToLocalStorage();
  renderTable();
};

document.getElementById("saveBtn").onclick = () => {
  const xml = jsonToXML(rawData);
  console.log(xml);
  
  console.log("📤 Sending data to server...");
  
  // Send to backend to save to demo.json
  fetch("http://localhost:3000/api/save-contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rawData)
  })
  .then(r => {
    console.log("📥 Response status:", r.status);
    return r.json();
  })
  .then(res => {
    console.log("✓ Server response:", res);
    if (res.success) {
      alert("✓ Changes saved to server and demo.json!\n\nRecords: " + res.count);
      console.log("✓ Contacts saved:", res.count, "records");
    } else {
      alert("❌ Server error: " + res.message);
    }
  })
  .catch(err => {
    console.error("❌ Server connection error:", err);
    alert("❌ Failed to connect to server at http://localhost:3000\n\nChanges are saved locally in your browser.\n\nMake sure: node server.js is running");
  });
};

function jsonToXML(data) {
  let xml = `<Contacts>\n`;
  data.forEach(r => {
    xml += `  <Contact>\n`;
    Object.keys(r).forEach(k => {
      xml += `    <${k.replace(/ /g,"_")}>${r[k]}</${k.replace(/ /g,"_")}>\n`;
    });
    xml += `  </Contact>\n`;
  });
  return xml + `</Contacts>`;
}

// Delete a column from all rows and re-render
function deleteColumn(col) {
  if (!confirm(`Delete column "${col}" from all rows? This cannot be undone.`)) return;
  rawData.forEach(r => { delete r[col]; });
  // if the deleted column was the last user-added column, nothing else special required
  autoSaveToLocalStorage();
  renderTable();
}

function applyRoleRules() {
  if (ROLE !== "ADMIN") {
    document.getElementById("addBtn").style.display = "none";
    document.getElementById("saveBtn").style.display = "none";
    document.getElementById("addColBtn").style.display = "none";
    document.getElementById("newColName").style.display = "none";
  }
}
function insertRow(index) {
  const newRow = {};
  columns.forEach(c => newRow[c] = "");
  data.splice(index + 1, 0, newRow);
  renderTable();
}
