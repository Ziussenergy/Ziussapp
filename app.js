let currentTab = 'inventory';
document.getElementById('inventoryTab').classList.add('active');
document.getElementById('inventory').classList.add('active');

function showTab(tab) {
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(tab + 'Tab').classList.add('active');
  document.getElementById(tab).classList.add('active');
  currentTab = tab;
}

const inventoryData = JSON.parse(localStorage.getItem('inventoryData')) || [];
const jobData = JSON.parse(localStorage.getItem('jobData')) || [];
const customerData = JSON.parse(localStorage.getItem('customerData')) || [];

function renderTable(data, tableId, fields, type) {
  const table = document.getElementById(tableId);
  table.innerHTML = `<tr>${fields.map(f => `<th>${f}</th>`).join('')}<th>Actions</th></tr>`;
  data.forEach((entry, i) => {
    const row = `<tr>${fields.map(f => `<td>${entry[f]}</td>`).join('')}
      <td>
        <button class="edit" onclick="editEntry('${type}', ${i})">Edit</button>
        <button class="delete" onclick="deleteEntry('${type}', ${i})">Delete</button>
      </td></tr>`;
    table.innerHTML += row;
  });
}

function saveData(type, data) {
  localStorage.setItem(type + 'Data', JSON.stringify(data));
}

function clearFormInputs(formId) {
  document.querySelectorAll(`#${formId} input`).forEach(input => input.value = '');
}

function addEntry(type, fields, formId, tableId) {
  const data = type === 'inventory' ? inventoryData : type === 'jobs' ? jobData : customerData;
  const entry = {};
  let valid = true;
  fields.forEach(f => {
    const val = document.getElementById(`${type}_${f}`).value.trim();
    if (!val) valid = false;
    entry[f] = val;
  });
  if (!valid) return alert('Fill all fields');
  data.push(entry);
  saveData(type, data);
  renderTable(data, tableId, fields, type);
  clearFormInputs(formId);
}

function deleteEntry(type, index) {
  const data = type === 'inventory' ? inventoryData : type === 'jobs' ? jobData : customerData;
  data.splice(index, 1);
  saveData(type, data);
  const fields = type === 'inventory' ? ['name', 'quantity', 'location'] :
                 type === 'jobs' ? ['customer', 'description', 'date'] :
                 ['name', 'address', 'rating', 'location'];
  renderTable(data, type + 'Table', fields, type);
}

function editEntry(type, index) {
  const data = type === 'inventory' ? inventoryData : type === 'jobs' ? jobData : customerData;
  const fields = type === 'inventory' ? ['name', 'quantity', 'location'] :
                 type === 'jobs' ? ['customer', 'description', 'date'] :
                 ['name', 'address', 'rating', 'location'];
  const newValues = {};
  fields.forEach(f => {
    const newVal = prompt(`Edit ${f}`, data[index][f]);
    if (newVal !== null) newValues[f] = newVal.trim();
    else newValues[f] = data[index][f];
  });
  data[index] = newValues;
  saveData(type, data);
  renderTable(data, type + 'Table', fields, type);
}

// Monthly report logic
function generateReport() {
  const reportDiv = document.getElementById('reportContent');
  const month = new Date().toLocaleString('default', { month: 'long' });
  const totalStock = inventoryData.reduce((acc, item) => acc + parseInt(item.quantity || 0), 0);
  const totalJobs = jobData.length;

  reportDiv.innerHTML = `
    <h3>${month} Report</h3>
    <p><strong>Total Inventory Stock:</strong> ${totalStock}</p>
    <p><strong>Total Jobs Completed:</strong> ${totalJobs}</p>
  `;

  renderChart(totalStock, totalJobs);
}

// Chart display
function renderChart(inventoryCount, jobCount) {
  const ctx = document.getElementById('reportChart').getContext('2d');
  if (window.reportChartInstance) {
    window.reportChartInstance.destroy();
  }
  window.reportChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Inventory Stock', 'Jobs Completed'],
      datasets: [{
        label: 'Monthly Summary',
        data: [inventoryCount, jobCount],
        backgroundColor: ['#007bff', '#28a745']
      }]
    },
    options: {
      responsive: true
    }
  });
}

// PDF Export
function exportPDF() {
  const element = document.getElementById('reportContent');
  html2pdf().from(element).save('Ziuss_Report.pdf');
}

// Backup & Restore
function backupData() {
  const data = {
    inventory: inventoryData,
    jobs: jobData,
    customers: customerData
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ziuss-backup.json';
  a.click();
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    localStorage.setItem('inventoryData', JSON.stringify(data.inventory || []));
    localStorage.setItem('jobData', JSON.stringify(data.jobs || []));
    localStorage.setItem('customerData', JSON.stringify(data.customers || []));
    location.reload();
  };
  reader.readAsText(file);
}

// Load all tables on start
renderTable(inventoryData, 'inventoryTable', ['name', 'quantity', 'location'], 'inventory');
renderTable(jobData, 'jobsTable', ['customer', 'description', 'date'], 'jobs');
renderTable(customerData, 'customersTable', ['name', 'address', 'rating', 'location'], 'customers');
generateReport();
