/* ==========================================================================
   AI-Powered Smart Port & Logistics Management System - Mock Data Repository
   Realistic Enterprise Logistics Demo Data
   ========================================================================== */

const PORT_DEMO_DATA = {
  // Operational Summary Metrics
  summary: {
    activeVessels: 18,
    activeVesselsTrend: "+2 from yesterday",
    cargoProcessedMT: 42500,
    cargoProcessedTEU: 3200,
    cargoTrend: "+8.4% vs last week",
    trucksProcessedToday: 342,
    trucksTrend: "+15 in queue",
    delayedShipments: 4,
    delayedTrend: "-2 resolved today",
    berthOccupancyRate: 75, // percentage
    yardOccupancyRate: 82, // percentage
  },

  // Vessels Repository
  vessels: [
    {
      id: "VSL-8091",
      name: "Oceanic Titan",
      imo: "9412384",
      type: "Container Ship",
      flag: "Panama 🇵🇦",
      capacityTEU: 14500,
      arrival: "2026-08-16 04:30",
      departure: "2026-08-17 18:00",
      berth: "Berth B-01",
      status: "Docked",
      statusBadge: "badge-occupied",
      cargoType: "Containerized",
      draft: "14.2m",
      craneAssigned: "Crane-01 & Crane-02",
      completionRate: 65
    },
    {
      id: "VSL-8092",
      name: "Pacific Voyager",
      imo: "9781123",
      type: "Bulk Carrier",
      flag: "Liberia 🇱🇷",
      capacityTEU: 8200,
      arrival: "2026-08-15 14:15",
      departure: "2026-08-16 22:00",
      berth: "Berth B-02",
      status: "Docked",
      statusBadge: "badge-occupied",
      cargoType: "Dry Bulk (Grain)",
      draft: "12.8m",
      craneAssigned: "Crane-03",
      completionRate: 88
    },
    {
      id: "VSL-8093",
      name: "Nordic Wave",
      imo: "9654432",
      type: "Tanker",
      flag: "Marshall Islands 🇲🇭",
      capacityTEU: 9500,
      arrival: "2026-08-16 09:00",
      departure: "2026-08-18 06:00",
      berth: "Berth B-04",
      status: "Docked",
      statusBadge: "badge-occupied",
      cargoType: "Liquid Bulk (LNG)",
      draft: "13.5m",
      craneAssigned: "Pipeline Arm 2",
      completionRate: 35
    },
    {
      id: "VSL-8094",
      name: "Ever Horizon",
      imo: "9823119",
      type: "Ultra Large Container",
      flag: "Singapore 🇸🇬",
      capacityTEU: 20000,
      arrival: "2026-08-16 16:30",
      departure: "2026-08-19 12:00",
      berth: "Berth B-05",
      status: "Docked",
      statusBadge: "badge-occupied",
      cargoType: "Containerized",
      draft: "15.8m",
      craneAssigned: "Crane-05 & Crane-06",
      completionRate: 15
    },
    {
      id: "VSL-8095",
      name: "Atlantic Breeze",
      imo: "9334581",
      type: "General Cargo",
      flag: "Netherlands 🇳🇱",
      capacityTEU: 4500,
      arrival: "2026-08-16 20:00 (EST)",
      departure: "2026-08-17 14:00",
      berth: "Berth B-03",
      status: "In Transit",
      statusBadge: "badge-in-transit",
      cargoType: "Breakbulk Heavy Equipment",
      draft: "9.6m",
      craneAssigned: "Pending",
      completionRate: 0
    },
    {
      id: "VSL-8096",
      name: "Maersk Conqueror",
      imo: "9556782",
      type: "Container Ship",
      flag: "Denmark 🇩🇰",
      capacityTEU: 18000,
      arrival: "2026-08-17 02:00",
      departure: "2026-08-18 20:00",
      berth: "Anchorage Area A",
      status: "Anchored",
      statusBadge: "badge-available",
      cargoType: "Containerized",
      draft: "14.9m",
      craneAssigned: "Unassigned",
      completionRate: 0
    },
    {
      id: "VSL-8097",
      name: "Starlight Pioneer",
      imo: "9223341",
      type: "Ro-Ro Vehicle Carrier",
      flag: "Japan 🇯🇵",
      capacityTEU: 6000,
      arrival: "2026-08-15 08:00",
      departure: "2026-08-16 11:30",
      berth: "Berth B-06",
      status: "Departed",
      statusBadge: "badge-available",
      cargoType: "Automotive Units",
      draft: "10.2m",
      craneAssigned: "Ramp 1",
      completionRate: 100
    },
    {
      id: "VSL-8098",
      name: "CMA CGM Zephyr",
      imo: "9887712",
      type: "Container Ship",
      flag: "France 🇫🇷",
      capacityTEU: 15500,
      arrival: "2026-08-16 18:45",
      departure: "2026-08-18 15:00",
      berth: "Berth B-07",
      status: "Docked",
      statusBadge: "badge-occupied",
      cargoType: "Containerized (Reefer)",
      draft: "14.1m",
      craneAssigned: "Crane-07",
      completionRate: 20
    }
  ],

  // Berths Master Setup
  berths: [
    {
      id: "B-01",
      name: "Berth 01 - Deepwater Container",
      status: "Occupied",
      statusCode: "occupied",
      statusClass: "status-occupied",
      vessel: "Oceanic Titan (VSL-8091)",
      length: "380m",
      depth: "16.5m",
      cranes: 2,
      progress: 65,
      eta: "Docked",
      etd: "Aug 17, 18:00"
    },
    {
      id: "B-02",
      name: "Berth 02 - Dry Bulk Pier",
      status: "Occupied",
      statusCode: "occupied",
      statusClass: "status-occupied",
      vessel: "Pacific Voyager (VSL-8092)",
      length: "320m",
      depth: "14.0m",
      cranes: 1,
      progress: 88,
      eta: "Docked",
      etd: "Aug 16, 22:00"
    },
    {
      id: "B-03",
      name: "Berth 03 - General Cargo Pier",
      status: "Maintenance",
      statusCode: "maintenance",
      statusClass: "status-maintenance",
      vessel: "Dredging Crane Maintenance",
      length: "250m",
      depth: "12.0m",
      cranes: 0,
      progress: 0,
      eta: "N/A",
      etd: "Scheduled reopening Aug 17 06:00"
    },
    {
      id: "B-04",
      name: "Berth 04 - Liquid Energy Terminal",
      status: "Occupied",
      statusCode: "occupied",
      statusClass: "status-occupied",
      vessel: "Nordic Wave (VSL-8093)",
      length: "300m",
      depth: "15.0m",
      cranes: 1,
      progress: 35,
      eta: "Docked",
      etd: "Aug 18, 06:00"
    },
    {
      id: "B-05",
      name: "Berth 05 - Mega Vessel Pier",
      status: "Occupied",
      statusCode: "occupied",
      statusClass: "status-occupied",
      vessel: "Ever Horizon (VSL-8094)",
      length: "420m",
      depth: "17.5m",
      cranes: 3,
      progress: 15,
      eta: "Docked",
      etd: "Aug 19, 12:00"
    },
    {
      id: "B-06",
      name: "Berth 06 - Ro-Ro & Multi-purpose",
      status: "Available",
      statusCode: "available",
      statusClass: "status-available",
      vessel: "None (Ready for Arrival)",
      length: "280m",
      depth: "13.0m",
      cranes: 1,
      progress: 0,
      eta: "Reserved for VSL-8095 (20:00)",
      etd: "-"
    },
    {
      id: "B-07",
      name: "Berth 07 - Container West",
      status: "Occupied",
      statusCode: "occupied",
      statusClass: "status-occupied",
      vessel: "CMA CGM Zephyr (VSL-8098)",
      length: "360m",
      depth: "15.5m",
      cranes: 2,
      progress: 20,
      eta: "Docked",
      etd: "Aug 18, 15:00"
    },
    {
      id: "B-08",
      name: "Berth 08 - Feeder & Coastal Pier",
      status: "Available",
      statusCode: "available",
      statusClass: "status-available",
      vessel: "None",
      length: "220m",
      depth: "11.5m",
      cranes: 1,
      progress: 0,
      eta: "Open for allocation",
      etd: "-"
    }
  ],

  // Cargo Management Dataset
  cargo: [
    {
      id: "CRG-9021",
      type: "40ft High Cube Container",
      category: "Containerized",
      weightMT: 28.5,
      source: "Shanghai, CN",
      destination: "Rotterdam, NL",
      vessel: "Oceanic Titan",
      yardSlot: "Yard Block A-14",
      status: "In Yard",
      statusBadge: "badge-available",
      customsStatus: "Cleared"
    },
    {
      id: "CRG-9022",
      type: "20ft Standard Refrigerated",
      category: "Containerized (Reefer)",
      weightMT: 18.2,
      source: "Santos, BR",
      destination: "Hamburg, DE",
      vessel: "CMA CGM Zephyr",
      yardSlot: "Reefer Zone R-03",
      status: "In Yard",
      statusBadge: "badge-available",
      customsStatus: "Cleared"
    },
    {
      id: "CRG-9023",
      type: "Grain Bulk (Wheat)",
      category: "Dry Bulk",
      weightMT: 4500.0,
      source: "Odessa, UA",
      destination: "Antwerp, BE",
      vessel: "Pacific Voyager",
      yardSlot: "Silo Complex 2",
      status: "Unloading",
      statusBadge: "badge-in-transit",
      customsStatus: "Inspection Pending"
    },
    {
      id: "CRG-9024",
      type: "Hazardous Chemical Tank",
      category: "Liquid Bulk",
      weightMT: 1250.0,
      source: "Houston, US",
      destination: "Rotterdam, NL",
      vessel: "Nordic Wave",
      yardSlot: "Hazmat Zone H-01",
      status: "Customs Hold",
      statusBadge: "badge-occupied",
      customsStatus: "Customs Hold - Doc Clearance"
    },
    {
      id: "CRG-9025",
      type: "Mining Machinery Parts",
      category: "Breakbulk",
      weightMT: 142.0,
      source: "Yokohama, JP",
      destination: "Duisburg, DE",
      vessel: "Atlantic Breeze",
      yardSlot: "Heavy Lift Yard H-09",
      status: "In Transit",
      statusBadge: "badge-in-transit",
      customsStatus: "Pre-cleared"
    },
    {
      id: "CRG-9026",
      type: "Electronics & Tech Components",
      category: "Containerized",
      weightMT: 22.0,
      source: "Busan, KR",
      destination: "Amsterdam, NL",
      vessel: "Ever Horizon",
      yardSlot: "Yard Block C-08",
      status: "Delayed",
      statusBadge: "badge-maintenance",
      customsStatus: "Documentation Error"
    },
    {
      id: "CRG-9027",
      type: "Pharmaceutical Supplies",
      category: "Reefer",
      weightMT: 12.4,
      source: "Basel, CH",
      destination: "New York, US",
      vessel: "Oceanic Titan",
      yardSlot: "Reefer Zone R-01",
      status: "Loaded",
      statusBadge: "badge-available",
      customsStatus: "Cleared"
    }
  ],

  // Truck Gate Operations Dataset
  trucks: [
    {
      plateNumber: "TRK-8891-NL",
      driverName: "Jan Van Der Berg",
      company: "TransPort Logistics B.V.",
      cargoId: "CRG-9021",
      entryTime: "2026-08-16 14:15",
      exitTime: "2026-08-16 14:48",
      gate: "Gate North-02",
      status: "Completed Exit",
      statusBadge: "badge-available",
      queuePosition: "Cleared"
    },
    {
      plateNumber: "TRK-4420-DE",
      driverName: "Markus Weber",
      company: "DHL Freight Express",
      cargoId: "CRG-9022",
      entryTime: "2026-08-16 14:50",
      exitTime: "Est. 15:30",
      gate: "Gate North-01",
      status: "In Yard Unloading",
      statusBadge: "badge-in-transit",
      queuePosition: "In Yard (Slot 12)"
    },
    {
      plateNumber: "TRK-7712-BE",
      driverName: "Luc Peeters",
      company: "Benelux Haulage",
      cargoId: "CRG-9024",
      entryTime: "2026-08-16 15:10",
      exitTime: "-",
      gate: "Gate Hazmat-01",
      status: "Customs Hold Gate",
      statusBadge: "badge-occupied",
      queuePosition: "Inspection Bay 3"
    },
    {
      plateNumber: "TRK-1092-NL",
      driverName: "Klaas De Jong",
      company: "Rotterdam Trucking Co.",
      cargoId: "CRG-9026",
      entryTime: "2026-08-16 15:25",
      exitTime: "-",
      gate: "Gate East-04",
      status: "Queued at Gate",
      statusBadge: "badge-maintenance",
      queuePosition: "#2 in Queue"
    },
    {
      plateNumber: "TRK-5531-FR",
      driverName: "Pierre Dubois",
      company: "Geodis Logistics",
      cargoId: "CRG-9027",
      entryTime: "2026-08-16 15:32",
      exitTime: "-",
      gate: "Gate East-04",
      status: "Queued at Gate",
      statusBadge: "badge-maintenance",
      queuePosition: "#3 in Queue"
    }
  ],

  // Pre-configured Reports Database
  reports: [
    {
      id: "REP-2026-081",
      title: "Daily Port Operational Activity Log",
      type: "Daily Activity",
      dateGenerated: "2026-08-16",
      period: "Today (Aug 16, 2026)",
      author: "Port Ops Operations",
      totalVessels: 18,
      totalCargoMT: "42,500 MT",
      efficiencyScore: "94.2%",
      summary: "High volume handled today. 342 trucks cleared gate with average 14 min gate dwell time. Berth 3 under maintenance."
    },
    {
      id: "REP-2026-080",
      title: "Vessel Turnaround & Berth Utilization Audit",
      type: "Vessel Report",
      dateGenerated: "2026-08-15",
      period: "Aug 01 - Aug 15, 2026",
      author: "Harbor Master Office",
      totalVessels: 142,
      totalCargoMT: "580,000 MT",
      efficiencyScore: "91.8%",
      summary: "Average berth turnaround time reduced to 22.4 hours per vessel. Berth 05 achieved highest crane productivity."
    },
    {
      id: "REP-2026-079",
      title: "Cargo Customs Hold & Inspection Summary",
      type: "Cargo Report",
      dateGenerated: "2026-08-14",
      period: "Aug 01 - Aug 14, 2026",
      author: "Customs Compliance",
      totalVessels: 98,
      totalCargoMT: "310,000 MT",
      efficiencyScore: "88.5%",
      summary: "4 shipments currently flagged under customs hold. Resolved documentation errors for 12 shipments this week."
    },
    {
      id: "REP-2026-078",
      title: "Gate Congestion & Truck Movement Audit",
      type: "Truck Report",
      dateGenerated: "2026-08-13",
      period: "Aug 01 - Aug 13, 2026",
      author: "Gate Operations",
      totalVessels: "-",
      totalCargoMT: "12,400 Trucks",
      efficiencyScore: "96.0%",
      summary: "Peak gate congestion observed between 14:00 - 16:00. Gate East-04 expanded automated license plate recognition."
    }
  ],

  // AI Assistant Query Response Simulations
  aiKnowledgeBase: {
    "delayed": {
      title: "Delayed Cargo Shipments Analysis",
      text: "Currently, there are **4 delayed cargo shipments** flagged across Terminal Alpha.",
      details: [
        { code: "CRG-9026", item: "Electronics & Tech Components", vessel: "Ever Horizon", reason: "Customs Documentation Discrepancy", impact: "High" },
        { code: "CRG-8812", item: "Textile Freight", vessel: "Maersk Conqueror", reason: "Anchorage Delay (Weather)", impact: "Medium" },
        { code: "CRG-8734", item: "Industrial Polymers", vessel: "Nordic Wave", reason: "Hazmat Inspection Hold", impact: "High" },
        { code: "CRG-8690", item: "Automotive Spare Parts", vessel: "Atlantic Breeze", reason: "Yard Crane Technical Maintenance", impact: "Low" }
      ],
      recommendation: "Recommendation: Dispatch Port Customs Liaison for CRG-9026 to clear invoice discrepancies by 17:00."
    },
    "summary": {
      title: "Today's Operations Executive Summary",
      text: "Port Operational Status for **Sunday, Aug 16, 2026**:",
      metrics: [
        "⚓ **Active Vessels in Port**: 18 Vessels (6 Docked, 2 Anchored, 10 In-Transit)",
        "📦 **Cargo Handled Today**: 42,500 MT / 3,200 TEUs (+8.4% above target)",
        "🚛 **Truck Gate Throughput**: 342 Trucks (Avg dwell time: 14.2 mins)",
        "🏗️ **Berth Occupancy**: 75% (Berth B-03 in maintenance until Aug 17 06:00)",
        "⚡ **System Health**: All 6 Quay Cranes operational with 98.4% uptime."
      ],
      recommendation: "Priority Action: Prepare Berth B-06 for incoming vessel *Atlantic Breeze* (ETA 20:00)."
    },
    "highest": {
      title: "Highest Cargo Volume Vessel Analysis",
      text: "The vessel handling the highest cargo volume today is **Ever Horizon (IMO 9823119)** docked at **Berth B-05**.",
      details: [
        { metric: "Vessel Name", value: "Ever Horizon (Ultra Large Container Vessel)" },
        { metric: "Total Capacity", value: "20,000 TEUs" },
        { metric: "Current Discharging Volume", value: "4,850 TEUs / 62,000 Metric Tons" },
        { metric: "Crane Allocation", value: "3 Super-Post-Panamax Cranes (Crane 04, 05, 06)" },
        { metric: "Discharge Speed", value: "145 Moves / Hour (Peak Port Efficiency)" }
      ],
      recommendation: "Insight: Ever Horizon accounts for 38% of today's container throughput."
    },
    "weekly": {
      title: "Weekly Logistics Performance Report (Aug 10 - Aug 16)",
      text: "Weekly Operational Highlights:",
      metrics: [
        "📊 **Total Cargo Processed**: 294,500 Metric Tons (103% of weekly quota)",
        "🚢 **Vessel Calls Handled**: 44 Vessels docked & processed",
        "⏱️ **Average Vessel Dwell Time**: 21.8 Hours (Reduced by 2.4 hrs vs last week)",
        "🚚 **Total Gate Movements**: 2,380 Trucks processed",
        "🎯 **Berth Utilization Rate**: 78.4% Average",
        "🟢 **Safety & Environmental Incidents**: Zero reported."
      ],
      recommendation: "Strategic Note: Berth 05 modernization completed, yielding a 12% increase in turnaround velocity."
    }
  }
};
