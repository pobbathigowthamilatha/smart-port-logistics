/* ==========================================================================
   AI-Powered Smart Port & Logistics Management System - Main App Router & UI Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI Navigation
  initNavigation();

  // 2. Start Live Clock
  startLiveClock();

  // 3. Render Initial Data & Views
  renderAllViews();

  // 4. Default View initialization
  showPage('dashboard-view');
});

// View Switcher (SPA Navigation)
function showPage(viewId) {
  // Hide all page views
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));

  // Show target page view
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  // Update Nav items active state
  document.querySelectorAll('.nav-link-item').forEach(link => {
    if (link.getAttribute('href') === `#${viewId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Re-trigger chart layouts or layout specific renders
  if (viewId === 'dashboard-view') {
    setTimeout(initDashboardCharts, 100);
    renderBerthRibbon();
  } else if (viewId === 'berth-view') {
    renderBerthLayout();
    if (!selectedBerthId) selectBerth('B-01');
  } else if (viewId === 'analytics-view') {
    setTimeout(initAnalyticsCharts, 100);
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      showPage(targetId);

      // Close mobile sidebar if open
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.remove('show');
    });
  });

  // Mobile Toggle Button
  const toggleBtn = document.getElementById('mobileToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.toggle('show');
    });
  }
}

async function logoutFromApp() {
  try {
    const response = await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.redirect) {
      window.location.href = data.redirect;
      return;
    }
    window.location.href = '/logout';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/logout';
  }
}

function startLiveClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
      ' | ' + now.toLocaleTimeString('en-GB');
  }
  update();
  setInterval(update, 1000);
}

// Master Render Method
// Master Render Method
async function renderAllViews() {
  await fetchVesselsFromDatabase();
  await fetchCargoFromDatabase();
  await fetchReportsFromDatabase();
  renderTrucksTable();
  renderRecentActivityTables();
}

function mapCargoStatusBadge(status = '') {
  const normalized = String(status).trim().toLowerCase();

  if (normalized.includes('customs') || normalized.includes('hold')) return 'badge-occupied';
  if (normalized.includes('delay') || normalized.includes('pending') || normalized.includes('inspection')) return 'badge-maintenance';
  if (normalized.includes('unload') || normalized.includes('in transit') || normalized.includes('loading')) return 'badge-in-transit';
  return 'badge-available';
}

async function fetchCargoFromDatabase() {
  try {
    const res = await fetch('/api/cargo');
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.cargo)) {
      PORT_DEMO_DATA.cargo = data.cargo.map(item => ({
        id: item.cargo_id,
        type: item.cargo_type,
        category: item.cargo_type,
        weightMT: Number(item.weight) || 0,
        source: item.source,
        destination: item.destination,
        vessel: item.assigned_vessel,
        yardSlot: item.assigned_yard,
        status: item.current_status,
        statusBadge: mapCargoStatusBadge(item.current_status),
        customsStatus: item.current_status || 'Cleared'
      }));
    }
  } catch (err) {
    console.error('Failed to fetch cargo from SQLite API:', err);
  }

  renderCargoTable();
}

// --------------------------------------------------------------------------
// Vessel Management Logic (Connected to SQLite API)
// --------------------------------------------------------------------------
async function fetchVesselsFromDatabase() {
  try {
    const res = await fetch('/api/vessels');
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.vessels)) {
      PORT_DEMO_DATA.vessels = data.vessels.map(v => ({
        id: v.vessel_id,
        name: v.vessel_name,
        imo: v.imo_number,
        arrival: v.arrival_date,
        departure: v.departure_date,
        capacityTEU: v.cargo_capacity,
        berth: v.assigned_berth,
        status: v.current_status,
        statusBadge: v.current_status.toLowerCase() === 'docked' ? 'badge-occupied' : 
                     v.current_status.toLowerCase() === 'anchored' ? 'badge-in-transit' : 'badge-available',
        flag: "Panama 🇵🇦",
        type: "Container Carrier",
        completionRate: 75,
        craneAssigned: 2
      }));
    }
  } catch (err) {
    console.error('Failed to fetch vessels from SQLite API:', err);
  }
  renderVesselsTable();
}

function renderVesselsTable(filteredData = null) {
  const tbody = document.getElementById('vesselsTableBody');
  if (!tbody) return;

  const data = filteredData || PORT_DEMO_DATA.vessels;
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No vessel records match search criteria.</td></tr>`;
    return;
  }

  data.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="fw-bold text-cyan">${v.id}</span></td>
      <td>
        <div class="fw-bold text-white">${v.name}</div>
        <div class="small text-muted">${v.flag || 'International'}</div>
      </td>
      <td><code>${v.imo}</code></td>
      <td>${v.arrival}</td>
      <td>${v.departure}</td>
      <td>${(v.capacityTEU || 0).toLocaleString()} TEUs</td>
      <td><span class="badge bg-secondary-subtle text-white">${v.berth}</span></td>
      <td><span class="badge-status ${v.statusBadge || 'badge-occupied'}">${v.status}</span></td>
      <td>
        <button class="btn-icon-only" title="View Manifest Details" onclick="viewVesselDetails('${v.id}')">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterVessels() {
  const query = document.getElementById('vesselSearchInput')?.value.toLowerCase() || '';
  const status = document.getElementById('vesselStatusFilter')?.value || 'all';

  const filtered = PORT_DEMO_DATA.vessels.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(query) || v.id.toLowerCase().includes(query) || v.imo.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || v.status.toLowerCase() === status.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  renderVesselsTable(filtered);
}

function openRegisterVesselModal() {
  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-ship text-cyan me-2"></i> Register New Vessel`;
  modalBody.innerHTML = `
    <form id="vesselRegisterForm" onsubmit="handleVesselRegister(event)">
      <div id="vesselRegAlert" class="alert alert-danger d-none mb-3 py-2 small"></div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label-custom">Vessel Name *</label>
          <input type="text" class="form-control-custom" id="regVesselName" placeholder="e.g. Ocean Pioneer" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">IMO Number *</label>
          <input type="text" class="form-control-custom" id="regImoNumber" placeholder="e.g. IMO 9823411" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Arrival Date & Time *</label>
          <input type="datetime-local" class="form-control-custom" id="regArrivalDate" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Departure Date & Time *</label>
          <input type="datetime-local" class="form-control-custom" id="regDepartureDate" required>
        </div>
        <div class="col-md-4">
          <label class="form-label-custom">Cargo Capacity (TEUs) *</label>
          <input type="number" class="form-control-custom" id="regCargoCapacity" placeholder="e.g. 18500" min="100" required>
        </div>
        <div class="col-md-4">
          <label class="form-label-custom">Assigned Berth *</label>
          <select class="form-control-custom" id="regAssignedBerth" required>
            <option value="">Select Berth...</option>
            <option value="Berth B-01">Berth B-01</option>
            <option value="Berth B-02">Berth B-02</option>
            <option value="Berth B-03">Berth B-03</option>
            <option value="Berth B-04">Berth B-04</option>
            <option value="Berth B-05">Berth B-05</option>
            <option value="Berth B-06">Berth B-06</option>
            <option value="Berth B-07">Berth B-07</option>
            <option value="Berth B-08">Berth B-08</option>
            <option value="Anchorage Area">Anchorage Area</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label-custom">Current Status *</label>
          <select class="form-control-custom" id="regCurrentStatus" required>
            <option value="Docked">Docked</option>
            <option value="Anchored">Anchored</option>
            <option value="In Transit">In Transit</option>
          </select>
        </div>
      </div>
      <div class="mt-4 text-end d-flex justify-content-end gap-2">
        <button type="button" class="btn-secondary-custom" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn-primary-custom" id="submitVesselBtn">
          <i class="fa-solid fa-check me-1"></i> Register Vessel
        </button>
      </div>
    </form>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

async function handleVesselRegister(e) {
  e.preventDefault();
  const alertEl = document.getElementById('vesselRegAlert');
  if (alertEl) alertEl.classList.add('d-none');

  const vessel_name = document.getElementById('regVesselName').value.trim();
  const imo_number = document.getElementById('regImoNumber').value.trim();
  const rawArrival = document.getElementById('regArrivalDate').value;
  const rawDeparture = document.getElementById('regDepartureDate').value;
  const cargo_capacity = parseInt(document.getElementById('regCargoCapacity').value);
  const assigned_berth = document.getElementById('regAssignedBerth').value;
  const current_status = document.getElementById('regCurrentStatus').value;

  const arrival_date = rawArrival ? rawArrival.replace('T', ' ') : '';
  const departure_date = rawDeparture ? rawDeparture.replace('T', ' ') : '';

  if (!vessel_name || !imo_number || !arrival_date || !departure_date || !cargo_capacity || !assigned_berth || !current_status) {
    if (alertEl) {
      alertEl.textContent = 'Please complete all required fields.';
      alertEl.classList.remove('d-none');
    }
    return;
  }

  const submitBtn = document.getElementById('submitVesselBtn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch('/api/vessels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vessel_name,
        imo_number,
        arrival_date,
        departure_date,
        cargo_capacity,
        assigned_berth,
        current_status
      })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      const modalEl = document.getElementById('globalModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      // Refresh vessel table immediately from SQLite API
      await fetchVesselsFromDatabase();

      // Show toast or alert notification
      setTimeout(() => {
        alert(`Success: ${data.message}`);
      }, 300);
    } else {
      if (alertEl) {
        alertEl.textContent = data.message || 'Error registering vessel.';
        alertEl.classList.remove('d-none');
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = 'Network or server error while connecting to Flask API.';
      alertEl.classList.remove('d-none');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function viewVesselDetails(vesselId) {
  const vessel = PORT_DEMO_DATA.vessels.find(v => v.id === vesselId);
  if (!vessel) return;

  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-ship text-cyan me-2"></i> Vessel Manifest: ${vessel.name}`;
  modalBody.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label-custom">Vessel Identification</label>
        <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div><strong>Vessel ID:</strong> ${vessel.id}</div>
          <div><strong>IMO Number:</strong> ${vessel.imo}</div>
          <div><strong>Flag State:</strong> ${vessel.flag}</div>
          <div><strong>Vessel Type:</strong> ${vessel.type}</div>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label-custom">Berth & Capacity Schedule</label>
        <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div><strong>Assigned Berth:</strong> ${vessel.berth}</div>
          <div><strong>Cargo Capacity:</strong> ${vessel.capacityTEU.toLocaleString()} TEUs</div>
          <div><strong>Arrival Time:</strong> ${vessel.arrival}</div>
          <div><strong>Estimated Departure:</strong> ${vessel.departure}</div>
        </div>
      </div>
      <div class="col-md-12">
        <label class="form-label-custom">Discharge & Equipment Allocation</label>
        <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div class="d-flex justify-content-between mb-2">
            <span><strong>Cranes Assigned:</strong> ${vessel.craneAssigned}</span>
            <span class="text-cyan fw-bold">${vessel.completionRate}% Unloaded</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar bg-cyan" style="width: ${vessel.completionRate}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

// --------------------------------------------------------------------------
// Cargo Management Logic
// --------------------------------------------------------------------------
function openCargoRegisterModal() {
  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-box-archive text-cyan me-2"></i> Register New Cargo Manifest`;
  modalBody.innerHTML = `
    <form id="cargoRegisterForm" onsubmit="handleCargoRegister(event)">
      <div id="cargoRegAlert" class="alert alert-danger d-none mb-3 py-2 small"></div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label-custom">Cargo ID *</label>
          <input type="text" class="form-control-custom" id="regCargoId" placeholder="e.g. CRG-1006" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Cargo Type *</label>
          <input type="text" class="form-control-custom" id="regCargoType" placeholder="e.g. Containerized" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Weight (MT) *</label>
          <input type="number" step="0.01" min="0.01" class="form-control-custom" id="regCargoWeight" placeholder="e.g. 18.25" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Source *</label>
          <input type="text" class="form-control-custom" id="regCargoSource" placeholder="e.g. Shanghai, CN" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Destination *</label>
          <input type="text" class="form-control-custom" id="regCargoDestination" placeholder="e.g. Rotterdam, NL" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Assigned Vessel *</label>
          <input type="text" class="form-control-custom" id="regCargoAssignedVessel" placeholder="e.g. MSC Oscar" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Assigned Yard *</label>
          <input type="text" class="form-control-custom" id="regCargoAssignedYard" placeholder="e.g. Yard Block A-14" required>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Current Status *</label>
          <select class="form-control-custom" id="regCargoCurrentStatus" required>
            <option value="">Select status...</option>
            <option value="In Yard">In Yard</option>
            <option value="Unloading">Unloading</option>
            <option value="Customs Hold">Customs Hold</option>
            <option value="In Transit">In Transit</option>
            <option value="Loaded">Loaded</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>
      <div class="mt-4 text-end d-flex justify-content-end gap-2">
        <button type="button" class="btn-secondary-custom" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn-primary-custom" id="submitCargoBtn">
          <i class="fa-solid fa-check me-1"></i> Register Cargo
        </button>
      </div>
    </form>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

async function handleCargoRegister(e) {
  e.preventDefault();

  const alertEl = document.getElementById('cargoRegAlert');
  if (alertEl) alertEl.classList.add('d-none');

  const cargo_id = document.getElementById('regCargoId').value.trim();
  const cargo_type = document.getElementById('regCargoType').value.trim();
  const weight = document.getElementById('regCargoWeight').value;
  const source = document.getElementById('regCargoSource').value.trim();
  const destination = document.getElementById('regCargoDestination').value.trim();
  const assigned_vessel = document.getElementById('regCargoAssignedVessel').value.trim();
  const assigned_yard = document.getElementById('regCargoAssignedYard').value.trim();
  const current_status = document.getElementById('regCargoCurrentStatus').value.trim();

  if (!cargo_id || !cargo_type || !weight || !source || !destination || !assigned_vessel || !assigned_yard || !current_status) {
    if (alertEl) {
      alertEl.textContent = 'Please complete all required cargo fields.';
      alertEl.classList.remove('d-none');
    }
    return;
  }

  const submitBtn = document.getElementById('submitCargoBtn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch('/api/cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cargo_id,
        cargo_type,
        weight: Number(weight),
        source,
        destination,
        assigned_vessel,
        assigned_yard,
        current_status
      })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      const modalEl = document.getElementById('globalModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      await fetchCargoFromDatabase();
      setTimeout(() => {
        alert(`Success: ${data.message || 'Cargo registered successfully.'}`);
      }, 300);
    } else {
      if (alertEl) {
        alertEl.textContent = data.message || 'Error registering cargo.';
        alertEl.classList.remove('d-none');
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = 'Network or server error while connecting to the Cargo API.';
      alertEl.classList.remove('d-none');
    }
    console.error('Cargo registration failed:', err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function renderCargoTable(filteredData = null) {
  const tbody = document.getElementById('cargoTableBody');
  if (!tbody) return;

  const data = filteredData || PORT_DEMO_DATA.cargo;
  tbody.innerHTML = '';

  data.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="fw-bold text-cyan">${c.id}</span></td>
      <td>${c.type}</td>
      <td>${c.weightMT.toLocaleString()} MT</td>
      <td>${c.source}</td>
      <td>${c.destination}</td>
      <td><span class="text-white fw-semibold">${c.vessel}</span></td>
      <td><code>${c.yardSlot}</code></td>
      <td><span class="badge-status ${c.statusBadge}">${c.status}</span></td>
      <td>
        <button class="btn-icon-only" title="Inspect Customs Status" onclick="viewCargoDetails('${c.id}')">
          <i class="fa-solid fa-box-open"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterCargo() {
  const query = document.getElementById('cargoSearchInput')?.value.toLowerCase() || '';
  const category = document.getElementById('cargoTypeFilter')?.value || 'all';

  const filtered = PORT_DEMO_DATA.cargo.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(query) || c.vessel.toLowerCase().includes(query) || c.type.toLowerCase().includes(query);
    const matchesCat = category === 'all' || c.category.toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCat;
  });

  renderCargoTable(filtered);
}

function viewCargoDetails(cargoId) {
  const item = PORT_DEMO_DATA.cargo.find(c => c.id === cargoId);
  if (!item) return;

  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-boxes-stacked text-cyan me-2"></i> Cargo Specification: ${item.id}`;
  modalBody.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label-custom">Cargo Details</label>
        <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div><strong>Category:</strong> ${item.category}</div>
          <div><strong>Weight:</strong> ${item.weightMT} Metric Tons</div>
          <div><strong>Port of Origin:</strong> ${item.source}</div>
          <div><strong>Destination Port:</strong> ${item.destination}</div>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label-custom">Yard & Customs Telemetry</label>
        <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div><strong>Assigned Yard:</strong> ${item.yardSlot}</div>
          <div><strong>Carrying Vessel:</strong> ${item.vessel}</div>
          <div><strong>Customs Status:</strong> <span class="badge bg-info">${item.customsStatus}</span></div>
          <div><strong>Handling Priority:</strong> Standard Green Lane</div>
        </div>
      </div>
    </div>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

// --------------------------------------------------------------------------
// Truck Management Logic
// --------------------------------------------------------------------------
function renderTrucksTable() {
  const tbody = document.getElementById('trucksTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  PORT_DEMO_DATA.trucks.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="fw-bold text-white">${t.plateNumber}</span></td>
      <td>${t.driverName} <div class="small text-muted">${t.company}</div></td>
      <td><code>${t.cargoId}</code></td>
      <td>${t.entryTime}</td>
      <td>${t.exitTime}</td>
      <td><span class="badge bg-secondary">${t.gate}</span></td>
      <td><span class="badge-status ${t.statusBadge}">${t.status}</span></td>
      <td><span class="fw-semibold text-cyan">${t.queuePosition}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function openGateRegisterModal() {
  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-truck-front text-cyan me-2"></i> Register New Gate Entry`;
  modalBody.innerHTML = `
    <form id="gateRegisterForm" onsubmit="handleGateRegister(event)">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label-custom">Truck Plate Number</label>
          <input type="text" class="form-control-custom" placeholder="e.g. TRK-9988-NL" required id="regPlate">
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Driver Name</label>
          <input type="text" class="form-control-custom" placeholder="e.g. Johan Cruyff" required id="regDriver">
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Cargo Reference ID</label>
          <input type="text" class="form-control-custom" placeholder="e.g. CRG-9021" required id="regCargo">
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Target Gate Lane</label>
          <select class="form-control-custom" id="regGate">
            <option>Gate North-01</option>
            <option>Gate North-02</option>
            <option>Gate East-04</option>
            <option>Gate Hazmat-01</option>
          </select>
        </div>
      </div>
      <div class="mt-4 text-end">
        <button type="submit" class="btn-primary-custom">
          <i class="fa-solid fa-check me-1"></i> Register Entry & Generate Ticket
        </button>
      </div>
    </form>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

function handleGateRegister(e) {
  e.preventDefault();
  const plate = document.getElementById('regPlate').value;
  const driver = document.getElementById('regDriver').value;
  const cargo = document.getElementById('regCargo').value;
  const gate = document.getElementById('regGate').value;

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  PORT_DEMO_DATA.trucks.unshift({
    plateNumber: plate,
    driverName: driver,
    company: "Standard Logistics Haulage",
    cargoId: cargo,
    entryTime: nowStr,
    exitTime: "-",
    gate: gate,
    status: "Processing Gate Clearance",
    statusBadge: "badge-in-transit",
    queuePosition: "At Gate Counter"
  });

  renderTrucksTable();
  const bsModal = bootstrap.Modal.getInstance(document.getElementById('globalModal'));
  if (bsModal) bsModal.hide();
}

// --------------------------------------------------------------------------
// Reports Logic
// --------------------------------------------------------------------------
async function fetchReportsFromDatabase() {
  try {
    const res = await fetch('/api/reports');
    const data = await res.json();
    if (res.ok && data.status === 'success' && Array.isArray(data.reports)) {
      PORT_DEMO_DATA.reports = data.reports.map(item => ({
        id: item.id,
        title: item.title || 'Operational Report',
        type: item.type || 'Customer Report',
        dateGenerated: item.dateGenerated || item.period || new Date().toISOString().slice(0, 10),
        period: item.period || item.dateGenerated || new Date().toISOString().slice(0, 10),
        author: item.author || 'Port Ops Operations',
        totalCargoMT: item.totalCargoMT || '0 MT',
        efficiencyScore: item.efficiencyScore || 'N/A',
        summary: item.summary || 'No summary available.'
      }));
    }
  } catch (err) {
    console.error('Failed to load reports from SQLite API:', err);
  }
  renderReportsView();
}

function renderReportsView() {
  const container = document.getElementById('reportsListContainer');
  if (!container) return;

  container.innerHTML = '';
  const reports = Array.isArray(PORT_DEMO_DATA.reports) ? PORT_DEMO_DATA.reports : [];

  if (!reports.length) {
    container.innerHTML = '<div class="col-12"><div class="card-custom"><p class="text-muted mb-0">No reports have been generated yet.</p></div></div>';
    return;
  }

  reports.forEach(r => {
    const card = document.createElement('div');
    card.className = 'col-md-6';
    card.innerHTML = `
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1" style="font-size: 0.75rem;">${r.type}</span>
          <span class="text-subtle small"><i class="fa-regular fa-calendar me-1"></i>Date: ${r.dateGenerated}</span>
        </div>
        <h5 class="text-white mb-2 fs-5 font-bold">${r.title}</h5>
        <p class="report-card-summary mb-3">${r.summary}</p>

        <div class="row text-center mb-3 p-2.5 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
          <div class="col-4 border-end" style="border-color: var(--border-color) !important;">
            <div class="report-stat-label">Cargo Total</div>
            <div class="report-stat-value small">${r.totalCargoMT}</div>
          </div>
          <div class="col-4 border-end" style="border-color: var(--border-color) !important;">
            <div class="report-stat-label">Efficiency Score</div>
            <div class="fw-bold text-emerald small">${r.efficiencyScore}</div>
          </div>
          <div class="col-4">
            <div class="report-stat-label">Report ID</div>
            <div class="fw-bold text-cyan small">${r.id}</div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center pt-1">
          <span class="text-subtle small"><i class="fa-solid fa-user me-1"></i>${r.author}</span>
          <button class="btn-secondary-custom btn-sm" onclick="previewReport('${r.id}')">
            <i class="fa-solid fa-file-pdf text-danger me-1"></i> Preview & Export
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function generateCustomerReport() {
  try {
    const res = await fetch('/api/reports', { method: 'POST' });
    const data = await res.json();

    if (!res.ok || data.status !== 'success' || !data.report) {
      throw new Error(data.message || 'Report generation failed.');
    }

    await fetchReportsFromDatabase();
    const newReport = data.report;
    if (newReport && newReport.report_id) {
      previewReport(newReport.report_id);
    }
  } catch (err) {
    console.error('Failed to generate customer report:', err);
    alert(err.message || 'Unable to generate the customer report.');
  }
}

function previewReport(reportId) {
  const report = PORT_DEMO_DATA.reports.find(r => r.id === reportId);
  if (!report) return;

  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-file-contract text-cyan me-2"></i> ${report.title}`;
  modalBody.innerHTML = `
    <div class="p-4 rounded-3 text-start report-modal-paper">
      <div class="d-flex justify-content-between border-bottom pb-3 mb-3" style="border-color: #cbd5e1 !important;">
        <div>
          <h3 class="fw-bold mb-0" style="color: #0f172a;">PORT LOGISTICS REPORT</h3>
          <div class="text-secondary small fw-semibold">SMART PORT & TERMINAL AUDIT SYSTEM</div>
        </div>
        <div class="text-end">
          <div class="fw-bold text-primary" style="font-size: 1.1rem;">${report.id}</div>
          <div class="text-secondary small">Generated: ${report.dateGenerated}</div>
        </div>
      </div>

      <div class="mb-4">
        <h5 class="fw-bold" style="color: #0f172a;">1. Executive Overview</h5>
        <p style="color: #1e293b; font-size: 0.95rem; line-height: 1.6;">${report.summary}</p>
      </div>

      <div class="mb-4">
        <h5 class="fw-bold" style="color: #0f172a;">2. Key Performance Indicators</h5>
        <table class="table table-bordered table-sm" style="color: #0f172a; border-color: #cbd5e1;">
          <tbody>
            <tr><th style="background: #f8fafc; color: #0f172a; width: 40%;">Audit Period</th><td style="color: #0f172a;">${report.period}</td></tr>
            <tr><th style="background: #f8fafc; color: #0f172a;">Total Cargo Handled</th><td style="color: #0f172a;">${report.totalCargoMT}</td></tr>
            <tr><th style="background: #f8fafc; color: #0f172a;">Terminal Efficiency Index</th><td style="color: #0f172a;"><strong class="text-success">${report.efficiencyScore}</strong></td></tr>
            <tr><th style="background: #f8fafc; color: #0f172a;">Authoring Department</th><td style="color: #0f172a;">${report.author}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="text-center text-secondary small mt-4 border-top pt-2" style="border-color: #cbd5e1 !important;">
        *** Operational Report Verified - Smart Port Logistics ***
      </div>
    </div>

    <div class="mt-3 text-end d-flex justify-content-end gap-2">
      <button class="btn-secondary-custom" onclick="downloadReportPdf('${report.id}')">
        <i class="fa-solid fa-download me-1"></i> Download PDF
      </button>
      <button class="btn-primary-custom" onclick="window.print()">
        <i class="fa-solid fa-print me-1"></i> Print Report
      </button>
    </div>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

async function downloadReportPdf(reportId) {
  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'PDF generation failed.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download report PDF:', err);
    alert(err.message || 'Unable to download the report PDF.');
  }
}

// --------------------------------------------------------------------------
// Dashboard Recent Activity Renders
// --------------------------------------------------------------------------
function renderRecentActivityTables() {
  const vesselContainer = document.getElementById('dashRecentVessels');
  if (vesselContainer) {
    vesselContainer.innerHTML = '';
    PORT_DEMO_DATA.vessels.slice(0, 4).forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="fw-bold text-white">${v.name}</span></td>
        <td>${v.berth}</td>
        <td><span class="badge-status ${v.statusBadge}">${v.status}</span></td>
        <td>${v.departure}</td>
      `;
      vesselContainer.appendChild(tr);
    });
  }

  const cargoContainer = document.getElementById('dashRecentCargo');
  if (cargoContainer) {
    cargoContainer.innerHTML = '';
    PORT_DEMO_DATA.cargo.slice(0, 4).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="fw-bold text-cyan">${c.id}</span></td>
        <td>${c.type}</td>
        <td>${c.yardSlot}</td>
        <td><span class="badge-status ${c.statusBadge}">${c.status}</span></td>
      `;
      cargoContainer.appendChild(tr);
    });
  }
}
