/* ==========================================================================
   AI-Powered Smart Port & Logistics Management System - Charts Engine
   Chart.js Configurations & Rendering Logic
   ========================================================================== */

let chartInstances = {};

// Common Chart Colors & Themes
const CHART_COLORS = {
  cyan: '#06b6d4',
  cyanGlow: 'rgba(6, 182, 212, 0.25)',
  blue: '#3b82f6',
  blueGlow: 'rgba(59, 130, 246, 0.25)',
  emerald: '#10b981',
  emeraldGlow: 'rgba(16, 185, 129, 0.25)',
  amber: '#f59e0b',
  amberGlow: 'rgba(245, 158, 11, 0.25)',
  rose: '#ef4444',
  roseGlow: 'rgba(239, 68, 68, 0.25)',
  purple: '#8b5cf6',
  textMuted: '#94a3b8',
  gridColor: 'rgba(255, 255, 255, 0.06)'
};

// Default Chart Options
const getBaseChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: CHART_COLORS.textMuted,
        font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' },
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: '#111c38',
      titleColor: '#fff',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true
    }
  },
  scales: {
    x: {
      ticks: { color: CHART_COLORS.textMuted, font: { family: 'Plus Jakarta Sans', size: 11 } },
      grid: { color: CHART_COLORS.gridColor, drawBorder: false }
    },
    y: {
      ticks: { color: CHART_COLORS.textMuted, font: { family: 'Plus Jakarta Sans', size: 11 } },
      grid: { color: CHART_COLORS.gridColor, drawBorder: false }
    }
  }
});

// Initialize Dashboard Charts
function initDashboardCharts() {
  // 1. Cargo Volume Chart (Dashboard)
  const ctxCargo = document.getElementById('dashCargoChart')?.getContext('2d');
  if (ctxCargo) {
    if (chartInstances.dashCargo) chartInstances.dashCargo.destroy();
    
    chartInstances.dashCargo = new Chart(ctxCargo, {
      type: 'bar',
      data: {
        labels: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
        datasets: [
          {
            label: 'Processed (MT)',
            data: [4200, 6800, 8500, 9200, 7100, 6700, 5200],
            backgroundColor: CHART_COLORS.cyan,
            borderRadius: 6
          },
          {
            label: 'Target Quota (MT)',
            data: [5000, 5000, 7500, 7500, 7500, 6000, 5000],
            type: 'line',
            borderColor: CHART_COLORS.purple,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: getBaseChartOptions()
    });
  }

  // 2. Vessel Movements Chart (Dashboard)
  const ctxVessel = document.getElementById('dashVesselChart')?.getContext('2d');
  if (ctxVessel) {
    if (chartInstances.dashVessel) chartInstances.dashVessel.destroy();

    const gradientArrivals = ctxVessel.createLinearGradient(0, 0, 0, 300);
    gradientArrivals.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradientArrivals.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    chartInstances.dashVessel = new Chart(ctxVessel, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Arrivals',
            data: [8, 12, 10, 15, 14, 11, 18],
            borderColor: CHART_COLORS.emerald,
            backgroundColor: gradientArrivals,
            fill: true,
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Departures',
            data: [6, 10, 9, 13, 12, 14, 15],
            borderColor: CHART_COLORS.blue,
            fill: false,
            tension: 0.4,
            borderWidth: 3
          }
        ]
      },
      options: getBaseChartOptions()
    });
  }

  // 3. Cargo Status Distribution Chart (Dashboard)
  const ctxStatus = document.getElementById('dashStatusChart')?.getContext('2d');
  if (ctxStatus) {
    if (chartInstances.dashStatus) chartInstances.dashStatus.destroy();

    chartInstances.dashStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Cleared & Released', 'In Yard Storage', 'Customs Hold', 'Delayed'],
        datasets: [{
          data: [58, 26, 11, 5],
          backgroundColor: [
            CHART_COLORS.emerald,
            CHART_COLORS.blue,
            CHART_COLORS.amber,
            CHART_COLORS.rose
          ],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: CHART_COLORS.textMuted,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              padding: 12,
              usePointStyle: true
            }
          }
        }
      }
    });
  }
}

function applyAnalyticsToCharts(snapshot) {
  if (!snapshot) return;

  const cargoLabels = Array.isArray(snapshot.labels) && snapshot.labels.length ? snapshot.labels : ['No data'];
  const cargoData = Array.isArray(snapshot.cargoVolume) && snapshot.cargoVolume.length ? snapshot.cargoVolume : [0];

  const ctxVolTrend = document.getElementById('analyticsVolChart')?.getContext('2d');
  if (ctxVolTrend) {
    if (chartInstances.analyticsVol) chartInstances.analyticsVol.destroy();

    chartInstances.analyticsVol = new Chart(ctxVolTrend, {
      type: 'line',
      data: {
        labels: cargoLabels,
        datasets: [
          {
            label: 'Cargo Volume / Capacity',
            data: cargoData,
            borderColor: CHART_COLORS.cyan,
            backgroundColor: CHART_COLORS.cyanGlow,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: getBaseChartOptions()
    });
  }

  const vesselMovement = snapshot.vesselMovement || { labels: ['No data'], data: [0] };
  const ctxVesselDyn = document.getElementById('analyticsVesselChart')?.getContext('2d');
  if (ctxVesselDyn) {
    if (chartInstances.analyticsVessel) chartInstances.analyticsVessel.destroy();

    chartInstances.analyticsVessel = new Chart(ctxVesselDyn, {
      type: 'bar',
      data: {
        labels: vesselMovement.labels || ['No data'],
        datasets: [{
          label: 'Vessel Movement Count',
          data: vesselMovement.data || [0],
          backgroundColor: [CHART_COLORS.cyan, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.emerald],
          borderRadius: 4
        }]
      },
      options: getBaseChartOptions()
    });
  }

  const berthUtilization = snapshot.berthUtilization || { labels: ['No data'], data: [0] };
  const ctxBerthUtil = document.getElementById('analyticsBerthChart')?.getContext('2d');
  if (ctxBerthUtil) {
    if (chartInstances.analyticsBerth) chartInstances.analyticsBerth.destroy();

    chartInstances.analyticsBerth = new Chart(ctxBerthUtil, {
      type: 'radar',
      data: {
        labels: berthUtilization.labels || ['No data'],
        datasets: [{
          label: 'Berth Status Counts',
          data: berthUtilization.data || [0],
          borderColor: CHART_COLORS.emerald,
          backgroundColor: CHART_COLORS.emeraldGlow,
          pointBackgroundColor: CHART_COLORS.emerald
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: CHART_COLORS.gridColor },
            grid: { color: CHART_COLORS.gridColor },
            pointLabels: { color: CHART_COLORS.textMuted, font: { size: 11 } },
            ticks: { color: CHART_COLORS.textMuted, backdropColor: 'transparent' }
          }
        },
        plugins: {
          legend: { labels: { color: CHART_COLORS.textMuted } }
        }
      }
    });
  }

  const yardCapacity = snapshot.yardCapacity || { labels: ['No data'], data: [0] };
  const ctxYard = document.getElementById('analyticsYardChart')?.getContext('2d');
  if (ctxYard) {
    if (chartInstances.analyticsYard) chartInstances.analyticsYard.destroy();

    chartInstances.analyticsYard = new Chart(ctxYard, {
      type: 'bar',
      data: {
        labels: yardCapacity.labels || ['No data'],
        datasets: [{
          label: 'Yard Capacity Count',
          data: yardCapacity.data || [0],
          backgroundColor: [CHART_COLORS.rose, CHART_COLORS.amber, CHART_COLORS.rose, CHART_COLORS.blue, CHART_COLORS.emerald, CHART_COLORS.cyan],
          borderRadius: 6
        }]
      },
      options: getBaseChartOptions()
    });
  }
}

async function loadAnalyticsSnapshot(rangeKey = 'last_30_days') {
  try {
    const res = await fetch(`/api/analytics?range=${encodeURIComponent(rangeKey)}`);
    const data = await res.json();

    if (res.ok && data.status === 'success' && data.analytics) {
      applyAnalyticsToCharts(data.analytics);
      return data.analytics;
    }

    console.error('Analytics API failed:', data.message || 'Unknown error');
    return null;
  } catch (err) {
    console.error('Failed to load analytics data:', err);
    return null;
  }
}

function bindAnalyticsRangeControls() {
  const select = document.getElementById('analyticsPeriod');
  if (!select) return;

  select.onchange = async () => {
    const selected = select.value || 'last_30_days';
    await loadAnalyticsSnapshot(selected);
  };
}

// Initialize Analytics Module Charts
async function initAnalyticsCharts() {
  bindAnalyticsRangeControls();
  const select = document.getElementById('analyticsPeriod');
  const selectedRange = select?.value || 'last_30_days';
  await loadAnalyticsSnapshot(selectedRange);
}
