/* ==========================================================================
   AI-Powered Smart Port & Logistics Management System - Berth & Terminal Layout
   Interactive Graphical Terminal Map & Inspection Component
   ========================================================================== */

let selectedBerthId = null;

function renderBerthLayout() {
  const container = document.getElementById('berthsGridContainer');
  if (!container) return;

  const berths = PORT_DEMO_DATA.berths;
  container.innerHTML = '';

  berths.forEach(berth => {
    const card = document.createElement('div');
    card.className = `berth-card ${berth.statusClass} ${selectedBerthId === berth.id ? 'selected' : ''}`;
    card.dataset.id = berth.id;

    const statusBadgeClass = 
      berth.statusCode === 'available' ? 'badge-available' :
      berth.statusCode === 'occupied' ? 'badge-occupied' : 'badge-maintenance';

    card.innerHTML = `
      <div class="berth-card-header">
        <span class="berth-code"><i class="fa-solid fa-anchor text-cyan me-1"></i> ${berth.id}</span>
        <span class="badge-status ${statusBadgeClass}">${berth.status}</span>
      </div>
      <div class="berth-vessel-info">
        <div class="berth-vessel-name">${berth.vessel}</div>
        <div class="berth-meta"><i class="fa-solid fa-ruler-horizontal me-1"></i> Length: ${berth.length} | Draft: ${berth.depth}</div>
      </div>
      <div>
        <div class="crane-indicator">
          <i class="fa-solid fa-crane"></i> ${berth.cranes} Quay Crane(s) Assigned
        </div>
        ${berth.statusCode === 'occupied' ? `
          <div class="progress mt-2" style="height: 5px; background: rgba(255,255,255,0.1);">
            <div class="progress-bar bg-cyan" role="progressbar" style="width: ${berth.progress}%;"></div>
          </div>
          <div class="d-flex justify-content-between mt-1" style="font-size: 0.7rem; color: #94a3b8;">
            <span>Discharge Progress</span>
            <span>${berth.progress}%</span>
          </div>
        ` : ''}
      </div>
    `;

    card.addEventListener('click', () => selectBerth(berth.id));
    container.appendChild(card);
  });

  // Render quick status ribbon in dashboard as well if container exists
  renderBerthRibbon();
}

function selectBerth(id) {
  selectedBerthId = id;
  const berth = PORT_DEMO_DATA.berths.find(b => b.id === id);
  if (!berth) return;

  // Re-render grid to update selected state UI
  renderBerthLayout();

  // Populate inspection panel
  const panel = document.getElementById('berthInspectorPanel');
  if (panel) {
    const statusBadgeClass = 
      berth.statusCode === 'available' ? 'badge-available' :
      berth.statusCode === 'occupied' ? 'badge-occupied' : 'badge-maintenance';

    panel.innerHTML = `
      <div class="card-custom">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 class="text-white mb-0">${berth.name}</h4>
            <span class="text-muted" style="font-size: 0.85rem;">Terminal Zone Alpha - Berth Code ${berth.id}</span>
          </div>
          <span class="badge-status ${statusBadgeClass} fs-6 px-3 py-2">${berth.status}</span>
        </div>

        <hr style="border-color: var(--border-color);">

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label-custom">Currently Docked Vessel</label>
            <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
              <div class="fw-bold text-white fs-5"><i class="fa-solid fa-ship text-cyan me-2"></i>${berth.vessel}</div>
              <div class="text-muted small mt-1">ETA: ${berth.eta} | ETD: ${berth.etd}</div>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label-custom">Berth Technical Specifications</label>
            <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
              <div class="row text-center">
                <div class="col-6 border-end" style="border-color: var(--border-color) !important;">
                  <div class="text-muted small">Max Quay Length</div>
                  <div class="fw-bold text-white fs-5">${berth.length}</div>
                </div>
                <div class="col-6">
                  <div class="text-muted small">Water Depth (Draft)</div>
                  <div class="fw-bold text-cyan fs-5">${berth.depth}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-12">
            <label class="form-label-custom">Quay Crane & Equipment Allocation</label>
            <div class="p-3 rounded-3" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="text-white"><i class="fa-solid fa-dharmachakra text-amber me-2"></i>Active Cranes Assigned: <strong>${berth.cranes} Unit(s)</strong></span>
                <span class="badge bg-primary-subtle text-primary">${berth.progress}% Complete</span>
              </div>
              <div class="progress" style="height: 8px; background: rgba(255,255,255,0.08);">
                <div class="progress-bar bg-cyan progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${berth.progress}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 d-flex gap-2 justify-content-end">
          <button class="btn-secondary-custom" onclick="toggleBerthMaintenance('${berth.id}')">
            <i class="fa-solid fa-wrench me-1"></i> Toggle Maintenance Status
          </button>
          <button class="btn-primary-custom" onclick="openAssignVesselModal('${berth.id}')">
            <i class="fa-solid fa-file-signature me-1"></i> Reassign Vessel / Schedule
          </button>
        </div>
      </div>
    `;
  }
}

function toggleBerthMaintenance(berthId) {
  const berth = PORT_DEMO_DATA.berths.find(b => b.id === berthId);
  if (!berth) return;

  if (berth.statusCode === 'maintenance') {
    berth.status = 'Available';
    berth.statusCode = 'available';
    berth.statusClass = 'status-available';
    berth.vessel = 'None (Available)';
  } else {
    berth.status = 'Maintenance';
    berth.statusCode = 'maintenance';
    berth.statusClass = 'status-maintenance';
    berth.vessel = 'Maintenance Scheduled';
  }

  selectBerth(berthId);
}

function openAssignVesselModal(berthId) {
  const modalBody = document.getElementById('globalModalBody');
  const modalTitle = document.getElementById('globalModalTitle');
  if (!modalBody || !modalTitle) return;

  const berth = PORT_DEMO_DATA.berths.find(b => b.id === berthId) || PORT_DEMO_DATA.berths[0];
  const vesselOptions = PORT_DEMO_DATA.vessels.length
    ? PORT_DEMO_DATA.vessels.map(v => `
        <option value="${v.id}" ${v.id === (berth && berth.vessel && berth.vessel.includes('(') ? PORT_DEMO_DATA.vessels.find(item => item.name === berth.vessel.split(' (')[0])?.id || '' : '') ? 'selected' : ''}>${v.name} (${v.id})</option>
      `).join('')
    : '<option value="">No vessels available</option>';

  const berthOptions = PORT_DEMO_DATA.berths.map(b => `
      <option value="${b.id}" ${b.id === berthId ? 'selected' : ''}>${b.id} - ${b.name}</option>
    `).join('');

  modalTitle.innerHTML = `<i class="fa-solid fa-file-signature text-cyan me-2"></i> Reassign Vessel / Schedule`;
  modalBody.innerHTML = `
    <form id="assignVesselForm" onsubmit="handleAssignVesselSchedule(event)">
      <div id="assignVesselAlert" class="alert alert-danger d-none mb-3 py-2 small"></div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label-custom">Select Vessel *</label>
          <select class="form-control-custom" id="assignVesselSelect" required>
            ${vesselOptions}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Berth *</label>
          <select class="form-control-custom" id="assignBerthSelect" required>
            ${berthOptions}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Arrival / ETA *</label>
          <input type="datetime-local" class="form-control-custom" id="assignArrivalDate" required value="${berth && berth.eta && berth.eta !== 'Docked' && berth.eta !== 'N/A' ? berth.eta.replace(' ', 'T').replace('Aug ', '2026-08-') : ''}">
        </div>
        <div class="col-md-6">
          <label class="form-label-custom">Departure / ETD *</label>
          <input type="datetime-local" class="form-control-custom" id="assignDepartureDate" required value="${berth && berth.etd && berth.etd !== '-' && berth.etd !== 'Scheduled reopening Aug 17 06:00' ? berth.etd.replace(' ', 'T').replace('Aug ', '2026-08-') : ''}">
        </div>
      </div>
      <div class="mt-4 text-end d-flex justify-content-end gap-2">
        <button type="button" class="btn-secondary-custom" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn-primary-custom" id="submitAssignBerthBtn">
          <i class="fa-solid fa-check me-1"></i> Save Schedule
        </button>
      </div>
    </form>
  `;

  const bsModal = new bootstrap.Modal(document.getElementById('globalModal'));
  bsModal.show();
}

async function handleAssignVesselSchedule(e) {
  e.preventDefault();

  const alertEl = document.getElementById('assignVesselAlert');
  if (alertEl) alertEl.classList.add('d-none');

  const vesselId = document.getElementById('assignVesselSelect')?.value;
  const berthId = document.getElementById('assignBerthSelect')?.value;
  const arrival = document.getElementById('assignArrivalDate')?.value;
  const departure = document.getElementById('assignDepartureDate')?.value;

  if (!vesselId || !berthId || !arrival || !departure) {
    if (alertEl) {
      alertEl.textContent = 'Please select a vessel, berth, and both schedule times.';
      alertEl.classList.remove('d-none');
    }
    return;
  }

  const submitBtn = document.getElementById('submitAssignBerthBtn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(`/api/berths/${berthId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vessel_id: vesselId,
        berth_id: berthId,
        arrival_date: arrival.replace('T', ' '),
        departure_date: departure.replace('T', ' ')
      })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      const modalEl = document.getElementById('globalModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      const berth = PORT_DEMO_DATA.berths.find(b => b.id === berthId);
      const vessel = PORT_DEMO_DATA.vessels.find(v => v.id === vesselId);
      if (berth) {
        berth.status = 'Occupied';
        berth.statusCode = 'occupied';
        berth.statusClass = 'status-occupied';
        berth.vessel = vessel ? `${vessel.name} (${vessel.id})` : berthId;
        berth.eta = arrival.replace('T', ' ');
        berth.etd = departure.replace('T', ' ');
        berth.progress = 0;
      }
      if (vessel) {
        vessel.berth = berthId;
        vessel.arrival = arrival.replace('T', ' ');
        vessel.departure = departure.replace('T', ' ');
        vessel.status = 'Docked';
        vessel.statusBadge = 'badge-occupied';
      }

      selectBerth(berthId);
      renderVesselsTable();
      setTimeout(() => {
        alert(`Success: ${data.message || 'Berth schedule updated.'}`);
      }, 250);
    } else {
      if (alertEl) {
        alertEl.textContent = data.message || 'Failed to update berth schedule.';
        alertEl.classList.remove('d-none');
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = 'Network or server error while updating berth schedule.';
      alertEl.classList.remove('d-none');
    }
    console.error('Berth reassignment failed:', err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function renderBerthRibbon() {
  const container = document.getElementById('berthQuickRibbon');
  if (!container) return;

  container.innerHTML = '';
  PORT_DEMO_DATA.berths.forEach(berth => {
    const badgeClass = 
      berth.statusCode === 'available' ? 'badge-available' :
      berth.statusCode === 'occupied' ? 'badge-occupied' : 'badge-maintenance';

    const item = document.createElement('div');
    item.className = 'berth-ribbon-item';
    item.onclick = () => {
      showPage('berth-view');
      selectBerth(berth.id);
    };

    item.innerHTML = `
      <div class="berth-ribbon-name">${berth.id}</div>
      <span class="badge-status ${badgeClass}" style="font-size: 0.65rem;">${berth.status}</span>
    `;
    container.appendChild(item);
  });
}
