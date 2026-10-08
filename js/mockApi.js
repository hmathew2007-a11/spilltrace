/**
 * SpillTrace AI — Database-Backed REST API Layer (Enhanced Stats & Telemetry + v2 Multi-Spill, Forecast & Route)
 */

import { dbManager } from './db.js';

// Response-Capable Marine Bases Data
export const RESPONSE_BASES = [
  {
    id: "base-aberdeen",
    name: "Aberdeen Marine Rescue Sub-Center (MRCC)",
    region: "North Sea / UKCS",
    location: { lat: 57.1497, lng: -2.0943 },
    vessel_assets: "2x Offshore Skimmer Tugs, Emergency Towing Vessel (ETV)",
    readiness: "15-min standby"
  },
  {
    id: "base-lerwick",
    name: "Lerwick Coastguard Emergency Station",
    region: "Shetland / Northern North Sea",
    location: { lat: 60.155, lng: -1.145 },
    vessel_assets: "1x High-Speed Response Craft, Aerial Dispersant Aircraft",
    readiness: "30-min standby"
  },
  {
    id: "base-singapore",
    name: "Singapore Port Marine Safety Depot (MPA)",
    region: "Malacca Strait / Singapore Strait",
    location: { lat: 1.264, lng: 103.820 },
    vessel_assets: "3x Boom Deployment Vessels, Rapid Skimmers",
    readiness: "Immediate (10-min response)"
  },
  {
    id: "base-klang",
    name: "Port Klang Environmental Response Base",
    region: "Strait of Malacca",
    location: { lat: 2.998, lng: 101.390 },
    vessel_assets: "2x Salvage Tugs with Heavy Oil Skimmers",
    readiness: "45-min standby"
  },
  {
    id: "base-nola",
    name: "New Orleans Coast Guard Sector Command",
    region: "Gulf of Mexico / Mississippi Delta",
    location: { lat: 29.951, lng: -90.071 },
    vessel_assets: "2x USCG Cutter Class Response Craft, Boom Barge",
    readiness: "Immediate"
  },
  {
    id: "base-galveston",
    name: "Galveston Spill Response Station",
    region: "Western Gulf of Mexico",
    location: { lat: 29.301, lng: -94.797 },
    vessel_assets: "1x High-Capacity Offshore Skimmer",
    readiness: "30-min standby"
  }
];

// Helper: Haversine distance in km
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const SEED_CASES = [
  {
    case_id: "ST-2026-089",
    name: "North Sea Oil Slick Incident",
    location_name: "North Sea (Block 21/4a - 56.42°N, 2.18°E)",
    detection_time: "2026-09-03T14:30:00Z",
    confidence_tier: "High",
    status: "Active",
    analyst_signoff: false,
    days_open: 2,
    last_updated: "2026-09-03T14:30:00Z",
    top_suspect_name: "Unidentified — Dark Vessel (DV-904)",
    detection_history: [
      {
        observation_id: "obs-089-1",
        confidence: 0.91,
        detection_time: "2026-09-02T14:30:00Z",
        location_label: "North Sea Block 21/4a Initial Satellite Pass",
        source_scene_id: "Sentinel-1A C-Band SAR",
        slick_polygon: {
          id: "slick-089-pass1",
          coordinates: [
            { lat: 56.435, lng: 2.150 },
            { lat: 56.450, lng: 2.180 },
            { lat: 56.425, lng: 2.220 },
            { lat: 56.410, lng: 2.190 }
          ],
          confidence: 0.91,
          detection_time: "2026-09-02T14:30:00Z",
          estimated_volume_m3: 310,
          estimated_thickness_um: 240,
          thickness_category: "Thick Emulsified Layer (>200 µm)",
          sensor_source: "Sentinel-1A C-Band SAR"
        }
      },
      {
        observation_id: "obs-089-2",
        confidence: 0.94,
        detection_time: "2026-09-03T14:30:00Z",
        location_label: "North Sea Block 21/4a Repeat Satellite Pass (De-duplicated)",
        source_scene_id: "Sentinel-1B C-Band SAR (VV Polarization)",
        slick_polygon: {
          id: "slick-089-pass2",
          coordinates: [
            { lat: 56.445, lng: 2.160 },
            { lat: 56.460, lng: 2.195 },
            { lat: 56.435, lng: 2.240 },
            { lat: 56.415, lng: 2.210 },
            { lat: 56.420, lng: 2.170 }
          ],
          confidence: 0.94,
          detection_time: "2026-09-03T14:30:00Z",
          estimated_volume_m3: 420,
          estimated_thickness_um: 280,
          thickness_category: "Thick Emulsified Layer (>200 µm)",
          sensor_source: "Sentinel-1B C-Band SAR (VV Polarization)"
        }
      }
    ],
    slick: {
      id: "slick-089",
      coordinates: [
        { lat: 56.445, lng: 2.160 },
        { lat: 56.460, lng: 2.195 },
        { lat: 56.435, lng: 2.240 },
        { lat: 56.415, lng: 2.210 },
        { lat: 56.420, lng: 2.170 }
      ],
      confidence: 0.94,
      detection_time: "2026-09-03T14:30:00Z",
      estimated_volume_m3: 420,
      estimated_thickness_um: 280,
      thickness_category: "Thick Emulsified Layer (>200 µm)",
      sensor_source: "Sentinel-1B C-Band SAR (VV Polarization)"
    },
    origin_zone: {
      id: "origin-089",
      center_lat: 56.380,
      center_lng: 2.050,
      drift_model: "ECMWF Hydrodynamic Backtrack (Surface Current 1.8 kts @ 235°)",
      time_window: {
        start: "2026-09-03T06:00:00Z",
        end: "2026-09-03T10:30:00Z"
      },
      decay_polygons: [
        [
          { lat: 56.388, lng: 2.040 },
          { lat: 56.395, lng: 2.065 },
          { lat: 56.375, lng: 2.075 },
          { lat: 56.368, lng: 2.045 }
        ],
        [
          { lat: 56.402, lng: 2.020 },
          { lat: 56.410, lng: 2.080 },
          { lat: 56.365, lng: 2.095 },
          { lat: 56.355, lng: 2.030 }
        ],
        [
          { lat: 56.420, lng: 1.990 },
          { lat: 56.428, lng: 2.110 },
          { lat: 56.350, lng: 2.120 },
          { lat: 56.340, lng: 2.010 }
        ]
      ]
    },
    vessels: [
      {
        vessel_id: "IMO-9481902",
        name: "MV Nord Star",
        msi_callsign: "C6XY2",
        flag: "Panama",
        vessel_type: "Chemical Tanker",
        is_dark_vessel: false,
        ais_gaps: [],
        path: [
          { lat: 56.300, lng: 1.900, timestamp: "2026-09-03T05:00:00Z", speed_knots: 13.2, heading_deg: 45 },
          { lat: 56.340, lng: 1.980, timestamp: "2026-09-03T07:00:00Z", speed_knots: 13.1, heading_deg: 46 },
          { lat: 56.370, lng: 2.040, timestamp: "2026-09-03T09:00:00Z", speed_knots: 12.8, heading_deg: 44 },
          { lat: 56.410, lng: 2.120, timestamp: "2026-09-03T11:00:00Z", speed_knots: 13.4, heading_deg: 45 },
          { lat: 56.450, lng: 2.200, timestamp: "2026-09-03T13:00:00Z", speed_knots: 13.0, heading_deg: 45 }
        ]
      },
      {
        vessel_id: "IMO-8921134",
        name: "MT Baltic Breeze",
        msi_callsign: "DF92A",
        flag: "Liberia",
        vessel_type: "Crude Oil Tanker",
        is_dark_vessel: false,
        ais_gaps: [],
        path: [
          { lat: 56.480, lng: 1.950, timestamp: "2026-09-03T05:00:00Z", speed_knots: 11.5, heading_deg: 120 },
          { lat: 56.450, lng: 2.080, timestamp: "2026-09-03T08:00:00Z", speed_knots: 11.8, heading_deg: 122 },
          { lat: 56.420, lng: 2.220, timestamp: "2026-09-03T11:00:00Z", speed_knots: 11.6, heading_deg: 121 },
          { lat: 56.390, lng: 2.350, timestamp: "2026-09-03T14:00:00Z", speed_knots: 11.7, heading_deg: 120 }
        ]
      }
    ],
    dark_vessels: [
      {
        id: "DV-904",
        detected_position: { lat: 56.381, lng: 2.052 },
        detected_time: "2026-09-03T08:15:00Z",
        matched_ais: false,
        estimated_length_m: 245,
        radar_cross_section: "High (Metallic Hull structure ~240m)",
        track_reconstruction: [
          { lat: 56.320, lng: 1.930, timestamp: "2026-09-03T06:00:00Z", speed_knots: 14.0, heading_deg: 50 },
          { lat: 56.381, lng: 2.052, timestamp: "2026-09-03T08:15:00Z", speed_knots: 13.8, heading_deg: 52 },
          { lat: 56.440, lng: 2.180, timestamp: "2026-09-03T10:30:00Z", speed_knots: 14.1, heading_deg: 51 }
        ]
      }
    ],
    suspects: [
      {
        vessel_id: "DV-904",
        name: "Unidentified — Dark Vessel (Radar ID: DV-904)",
        flag: "Unknown (No AIS Transponder)",
        vessel_type: "Tanker Class (245m Radar Echo)",
        is_dark: true,
        scorecard: {
          composite_score: 96,
          confidence_tier: "high",
          route_overlap_pct: 98,
          presence_window: { present: true, duration_minutes: 180 },
          dark_period_flag: true,
          drift_match_pct: 95,
          historical_flag: "Multiple unflagged radar transits in UK Continental Shelf",
          summary_text: "Flagged as PRIMARY SUSPECT due to complete AIS blackout during release window, 98% trajectory overlap with origin epicenter, and matching 245m radar shape."
        }
      },
      {
        vessel_id: "IMO-9481902",
        name: "MV Nord Star",
        flag: "Panama",
        vessel_type: "Chemical Tanker",
        is_dark: false,
        scorecard: {
          composite_score: 42,
          confidence_tier: "medium",
          route_overlap_pct: 54,
          presence_window: { present: true, duration_minutes: 45 },
          dark_period_flag: false,
          drift_match_pct: 48,
          historical_flag: null,
          summary_text: "Moderate suspicion: Transited outer boundary of origin zone with continuous AIS, but trajectory cross-wind angle reduces probability."
        }
      },
      {
        vessel_id: "IMO-8921134",
        name: "MT Baltic Breeze",
        flag: "Liberia",
        vessel_type: "Crude Oil Tanker",
        is_dark: false,
        scorecard: {
          composite_score: 18,
          confidence_tier: "low",
          route_overlap_pct: 12,
          presence_window: { present: false, duration_minutes: 0 },
          dark_period_flag: false,
          drift_match_pct: 15,
          historical_flag: null,
          summary_text: "Low suspicion: Route passed downwind outside release timeframe with full AIS compliance."
        }
      }
    ]
  },

  {
    case_id: "ST-2026-104",
    name: "Malacca Strait Overlapping Traffic Incident",
    location_name: "Strait of Malacca (1.42°N, 103.15°E)",
    detection_time: "2026-09-03T11:15:00Z",
    confidence_tier: "High",
    status: "Active",
    analyst_signoff: false,
    days_open: 1,
    last_updated: "2026-09-03T11:15:00Z",
    top_suspect_name: "MV Pacific Titan",
    detection_history: [
      {
        observation_id: "obs-104-1",
        confidence: 0.91,
        detection_time: "2026-09-03T11:15:00Z",
        location_label: "Strait of Malacca Single Pass Detection",
        source_scene_id: "Radarsat-2 Ultra-Fine SAR",
        slick_polygon: {
          id: "slick-104",
          coordinates: [
            { lat: 1.435, lng: 103.130 },
            { lat: 1.448, lng: 103.165 },
            { lat: 1.420, lng: 103.180 },
            { lat: 1.405, lng: 103.145 }
          ],
          confidence: 0.91,
          detection_time: "2026-09-03T11:15:00Z",
          estimated_volume_m3: 650,
          estimated_thickness_um: 340,
          thickness_category: "Thick Heavy Crude (>200 µm)",
          sensor_source: "Radarsat-2 Ultra-Fine SAR"
        }
      }
    ],
    slick: {
      id: "slick-104",
      coordinates: [
        { lat: 1.435, lng: 103.130 },
        { lat: 1.448, lng: 103.165 },
        { lat: 1.420, lng: 103.180 },
        { lat: 1.405, lng: 103.145 }
      ],
      confidence: 0.91,
      detection_time: "2026-09-03T11:15:00Z",
      estimated_volume_m3: 650,
      estimated_thickness_um: 340,
      thickness_category: "Thick Heavy Crude (>200 µm)",
      sensor_source: "Radarsat-2 Ultra-Fine SAR"
    },
    origin_zone: {
      id: "origin-104",
      center_lat: 1.390,
      center_lng: 103.080,
      drift_model: "Regional Tidal-Current Decay Model (Tide 2.1 kts NW)",
      time_window: {
        start: "2026-09-03T03:30:00Z",
        end: "2026-09-03T08:00:00Z"
      },
      decay_polygons: [
        [
          { lat: 1.398, lng: 103.072 },
          { lat: 1.405, lng: 103.092 },
          { lat: 1.382, lng: 103.088 },
          { lat: 1.378, lng: 103.068 }
        ],
        [
          { lat: 1.412, lng: 103.058 },
          { lat: 1.420, lng: 103.105 },
          { lat: 1.370, lng: 103.100 },
          { lat: 1.365, lng: 103.050 }
        ]
      ]
    },
    vessels: [
      {
        vessel_id: "IMO-9774021",
        name: "MV Pacific Titan",
        msi_callsign: "V3PR8",
        flag: "Singapore",
        vessel_type: "VLCC Crude Tanker",
        is_dark_vessel: false,
        ais_gaps: [{ start: "2026-09-03T04:15:00Z", end: "2026-09-03T07:45:00Z" }],
        path: [
          { lat: 1.350, lng: 103.010, timestamp: "2026-09-03T03:00:00Z", speed_knots: 11.2, heading_deg: 65, ais_active: true },
          { lat: 1.372, lng: 103.045, timestamp: "2026-09-03T04:15:00Z", speed_knots: 11.0, heading_deg: 64, ais_active: true },
          { lat: 1.391, lng: 103.082, timestamp: "2026-09-03T05:30:00Z", speed_knots: 10.8, heading_deg: 65, ais_active: false },
          { lat: 1.410, lng: 103.120, timestamp: "2026-09-03T07:00:00Z", speed_knots: 11.1, heading_deg: 63, ais_active: false },
          { lat: 1.425, lng: 103.150, timestamp: "2026-09-03T07:45:00Z", speed_knots: 11.4, heading_deg: 64, ais_active: true },
          { lat: 1.450, lng: 103.200, timestamp: "2026-09-03T09:30:00Z", speed_knots: 11.5, heading_deg: 65, ais_active: true }
        ]
      },
      {
        vessel_id: "IMO-9653198",
        name: "MT Ocean Voyager",
        msi_callsign: "9V8212",
        flag: "Marshall Islands",
        vessel_type: "Product Tanker",
        is_dark_vessel: false,
        ais_gaps: [],
        path: [
          { lat: 1.330, lng: 103.030, timestamp: "2026-09-03T03:00:00Z", speed_knots: 14.5, heading_deg: 55 },
          { lat: 1.370, lng: 103.090, timestamp: "2026-09-03T05:00:00Z", speed_knots: 14.6, heading_deg: 54 },
          { lat: 1.410, lng: 103.150, timestamp: "2026-09-03T07:00:00Z", speed_knots: 14.4, heading_deg: 56 },
          { lat: 1.450, lng: 103.210, timestamp: "2026-09-03T09:00:00Z", speed_knots: 14.7, heading_deg: 55 }
        ]
      }
    ],
    dark_vessels: [
      {
        id: "DV-318",
        detected_position: { lat: 1.391, lng: 103.082 },
        detected_time: "2026-09-03T05:30:00Z",
        matched_ais: false,
        estimated_length_m: 260,
        radar_cross_section: "High (Metallic Hull Echo ~260m)",
        track_reconstruction: [
          { lat: 1.350, lng: 103.010, timestamp: "2026-09-03T03:00:00Z", speed_knots: 12.0, heading_deg: 65 },
          { lat: 1.391, lng: 103.082, timestamp: "2026-09-03T05:30:00Z", speed_knots: 11.8, heading_deg: 64 },
          { lat: 1.450, lng: 103.200, timestamp: "2026-09-03T09:30:00Z", speed_knots: 12.2, heading_deg: 65 }
        ]
      }
    ],
    suspects: [
      {
        vessel_id: "DV-318",
        name: "Unidentified — Dark Vessel (Radar ID: DV-318)",
        flag: "Unknown (No AIS Transponder)",
        vessel_type: "Tanker Class (260m Radar Echo)",
        is_dark: true,
        scorecard: {
          composite_score: 95,
          confidence_tier: "high",
          route_overlap_pct: 97,
          presence_window: { present: true, duration_minutes: 160 },
          dark_period_flag: true,
          drift_match_pct: 94,
          historical_flag: "Unannounced transit through Malacca TSS corridor",
          summary_text: "Flagged as PRIMARY SUSPECT: Complete transponder blackout inside backtrack origin epicenter."
        }
      },
      {
        vessel_id: "IMO-9774021",
        name: "MV Pacific Titan",
        flag: "Singapore",
        vessel_type: "VLCC Crude Tanker",
        is_dark: false,
        scorecard: {
          composite_score: 92,
          confidence_tier: "high",
          route_overlap_pct: 94,
          presence_window: { present: true, duration_minutes: 210 },
          dark_period_flag: true,
          drift_match_pct: 91,
          historical_flag: "Prior port-state inspection warning for oily water separator bypass",
          summary_text: "Flagged as HIGH SUSPICION due to 3.5-hour AIS blackout precisely during estimated release window and 94% trajectory match with backtracked origin core."
        }
      },
      {
        vessel_id: "IMO-9653198",
        name: "MT Ocean Voyager",
        flag: "Marshall Islands",
        vessel_type: "Product Tanker",
        is_dark: false,
        scorecard: {
          composite_score: 38,
          confidence_tier: "low",
          route_overlap_pct: 42,
          presence_window: { present: true, duration_minutes: 60 },
          dark_period_flag: false,
          drift_match_pct: 35,
          historical_flag: null,
          summary_text: "Low suspicion despite spatial overlap: Vessel maintained continuous broadcast without AIS disruption and higher transit speed indicates non-discharge state."
        }
      }
    ]
  },

  {
    case_id: "ST-2026-112",
    name: "Gulf of Mexico Anomaly (Coastal Threat)",
    location_name: "Gulf of Mexico (Mississippi Canyon Block 538 - 28.52°N, 89.15°W)",
    detection_time: "2026-09-03T09:00:00Z",
    confidence_tier: "Low",
    status: "Under Review",
    analyst_signoff: false,
    days_open: 4,
    last_updated: "2026-09-03T09:00:00Z",
    top_suspect_name: "MT Gulf Pioneer",
    analyst_notes: "Sensor image degraded by 40% cloud cover. High probability of natural sargassum weed bloom or biogenic film look-alike. Requires manual field verification.",
    detection_history: [
      {
        observation_id: "obs-112-1",
        confidence: 0.48,
        detection_time: "2026-09-03T09:00:00Z",
        location_label: "Gulf of Mexico Mississippi Canyon Pass",
        source_scene_id: "Sentinel-1A SAR (Cloud Interference Flagged)",
        slick_polygon: {
          id: "slick-112",
          coordinates: [
            { lat: 28.520, lng: -89.150 },
            { lat: 28.535, lng: -89.120 },
            { lat: 28.510, lng: -89.100 },
            { lat: 28.495, lng: -89.130 }
          ],
          confidence: 0.48,
          detection_time: "2026-09-03T09:00:00Z",
          estimated_volume_m3: 120,
          estimated_thickness_um: 35,
          thickness_category: "Thin Surface Sheen (<50 µm)",
          sensor_source: "Sentinel-1A SAR (Cloud Interference Flagged)"
        }
      }
    ],
    slick: {
      id: "slick-112",
      coordinates: [
        { lat: 28.520, lng: -89.150 },
        { lat: 28.535, lng: -89.120 },
        { lat: 28.510, lng: -89.100 },
        { lat: 28.495, lng: -89.130 }
      ],
      confidence: 0.48,
      detection_time: "2026-09-03T09:00:00Z",
      estimated_volume_m3: 120,
      estimated_thickness_um: 35,
      thickness_category: "Thin Surface Sheen (<50 µm)",
      sensor_source: "Sentinel-1A SAR (Cloud Interference Flagged)"
    },
    origin_zone: {
      id: "origin-112",
      center_lat: 28.480,
      center_lng: -89.190,
      drift_model: "Loop Current Eddy Backtrack (Diffuse Boundary)",
      time_window: {
        start: "2026-09-03T00:00:00Z",
        end: "2026-09-03T05:00:00Z"
      },
      decay_polygons: [
        [
          { lat: 28.495, lng: -89.210 },
          { lat: 28.505, lng: -89.170 },
          { lat: 28.465, lng: -89.175 },
          { lat: 28.455, lng: -89.205 }
        ]
      ]
    },
    vessels: [
      {
        vessel_id: "IMO-9331829",
        name: "MT Gulf Pioneer",
        msi_callsign: "WDF38",
        flag: "USA",
        vessel_type: "OSV / Supply Vessel",
        is_dark_vessel: false,
        ais_gaps: [],
        path: [
          { lat: 28.420, lng: -89.250, timestamp: "2026-09-03T00:00:00Z", speed_knots: 10.0, heading_deg: 35 },
          { lat: 28.480, lng: -89.190, timestamp: "2026-09-03T03:00:00Z", speed_knots: 9.8, heading_deg: 36 },
          { lat: 28.540, lng: -89.130, timestamp: "2026-09-03T06:00:00Z", speed_knots: 10.2, heading_deg: 34 }
        ]
      }
    ],
    dark_vessels: [
      {
        id: "DV-512",
        detected_position: { lat: 28.480, lng: -89.190 },
        detected_time: "2026-09-03T03:00:00Z",
        matched_ais: false,
        estimated_length_m: 210,
        radar_cross_section: "Medium (Metallic Hull Echo ~210m)",
        track_reconstruction: [
          { lat: 28.420, lng: -89.250, timestamp: "2026-09-03T00:00:00Z", speed_knots: 10.5, heading_deg: 35 },
          { lat: 28.480, lng: -89.190, timestamp: "2026-09-03T03:00:00Z", speed_knots: 10.4, heading_deg: 36 },
          { lat: 28.540, lng: -89.130, timestamp: "2026-09-03T06:00:00Z", speed_knots: 10.6, heading_deg: 35 }
        ]
      }
    ],
    suspects: [
      {
        vessel_id: "DV-512",
        name: "Unidentified — Dark Vessel (Radar ID: DV-512)",
        flag: "Unknown (No AIS Transponder)",
        vessel_type: "Supply/Tanker Class (210m)",
        is_dark: true,
        scorecard: {
          composite_score: 88,
          confidence_tier: "high",
          route_overlap_pct: 89,
          presence_window: { present: true, duration_minutes: 120 },
          dark_period_flag: true,
          drift_match_pct: 86,
          historical_flag: "AIS Blackout off Mississippi Canyon sector",
          summary_text: "Unregistered radar target passing origin zone without broadcasting AIS."
        }
      },
      {
        vessel_id: "IMO-9331829",
        name: "MT Gulf Pioneer",
        flag: "USA",
        vessel_type: "OSV / Supply Vessel",
        is_dark: false,
        scorecard: {
          composite_score: 45,
          confidence_tier: "low",
          route_overlap_pct: 48,
          presence_window: { present: true, duration_minutes: 90 },
          dark_period_flag: false,
          drift_match_pct: 42,
          historical_flag: null,
          summary_text: "Needs Analyst Review: Slick detection confidence is low (48%) due to cloud shadow and potential algal bloom false-positive."
        }
      }
    ]
  }
];

// Historical Cases Archive Seed
const SEED_ARCHIVE = [
  {
    case_id: "ST-2026-074",
    name: "English Channel Tanker Discharge",
    location_name: "English Channel (50.12°N, 0.45°W)",
    date: "2026-08-18",
    status: "Closed",
    confidence_tier: "High",
    top_suspect_name: "MT Poseidon Glory",
    vessel_count: 3,
    days_open: null,
    last_updated: "2026-08-20T16:00:00Z",
    outcome: "Confirmed violation — Vessel fined €450,000 by Maritime Authority"
  },
  {
    case_id: "ST-2026-061",
    name: "Gibraltar Strait Bunkering Leak",
    location_name: "Strait of Gibraltar (35.98°N, 5.32°W)",
    date: "2026-08-04",
    status: "Closed",
    confidence_tier: "High",
    top_suspect_name: "MV Gibraltar Star",
    vessel_count: 2,
    days_open: null,
    last_updated: "2026-08-06T10:30:00Z",
    outcome: "Accidental bilge discharge during offshore refuelling"
  },
  {
    case_id: "ST-2026-042",
    name: "Baltic Sea SAR Anomaly",
    location_name: "Baltic Sea East of Bornholm",
    date: "2026-07-22",
    status: "Closed",
    confidence_tier: "Low",
    top_suspect_name: "MT Baltic Pioneer (Cleared)",
    vessel_count: 1,
    days_open: null,
    last_updated: "2026-07-24T18:15:00Z",
    outcome: "Dismissed — Algal bloom (Cyanobacteria) confirmed by optical satellite"
  }
];

// Ensure initial database seeding
async function ensureDbSeeded() {
  const existingCases = await dbManager.getAllCases();
  if (existingCases.length === 0) {
    for (const c of SEED_CASES) {
      await dbManager.saveCase(c);
    }
  } else {
    for (const seedCase of SEED_CASES) {
      const found = existingCases.find(c => c.case_id === seedCase.case_id);
      if (found) {
        let needsSave = false;
        if (!found.dark_vessels || found.dark_vessels.length === 0) {
          found.dark_vessels = seedCase.dark_vessels;
          if (seedCase.suspects) {
            found.suspects = seedCase.suspects;
          }
          needsSave = true;
        }
        if (!found.slick?.estimated_thickness_um || found.slick.estimated_thickness_um !== seedCase.slick.estimated_thickness_um) {
          found.slick = seedCase.slick;
          found.detection_history = seedCase.detection_history;
          needsSave = true;
        }
        if (needsSave) {
          await dbManager.saveCase(found);
        }
      } else {
        await dbManager.saveCase(seedCase);
      }
    }
  }
}

// System Performance & Activity Log Data
const SYSTEM_METRICS = {
  active_cases_count: 3,
  active_trend_30d: "+1 vs last 30d",
  avg_detection_to_report_days: "3.2 days",
  high_confidence_suspects_30d: 5,
  dark_vessel_detections_30d: 4,
  analyst_review_backlog: 2,

  accuracy_ratio: "14 of 17 closed cases",
  accuracy_ratio_pct: 82,
  confidence_distribution: {
    high: 45,
    medium: 35,
    low: 20
  },
  false_positive_notes: [
    {
      case_id: "ST-2026-042",
      vessel_name: "MT Baltic Pioneer",
      reason: "Top suspect cleared: AIS gap explained by verified port authority bunkering record."
    },
    {
      case_id: "ST-2026-031",
      vessel_name: "MV Sargasso Trader",
      reason: "Top suspect cleared: High-contrast optical satellite imagery confirmed natural Sargassum algal bloom look-alike."
    },
    {
      case_id: "ST-2026-019",
      vessel_name: "MV Wave Rider",
      reason: "Top suspect cleared: Transited during severe storm surge; radar backscatter anomaly attributed to sea state clutter."
    }
  ],

  activity_feed: [
    {
      id: "act-1",
      timestamp: "12m ago",
      text: "New dark-vessel radar detection (ID: DV-904) in North Sea Case #ST-2026-089",
      type: "dark_vessel"
    },
    {
      id: "act-2",
      timestamp: "2h ago",
      text: "Analyst sign-off verified for Case #ST-2026-074 by Officer Chen",
      type: "signoff"
    },
    {
      id: "act-3",
      timestamp: "4h ago",
      text: "Confidence tier for Vessel MV Nord Star updated to High in Case #ST-2026-089",
      type: "tier_upgrade"
    },
    {
      id: "act-4",
      timestamp: "1d ago",
      text: "ECMWF Hydrodynamic backtrack model recalibrated for Strait of Malacca corridor",
      type: "model_sync"
    },
    {
      id: "act-5",
      timestamp: "2d ago",
      text: "Radarsat-2 SAR scene ingested for Gulf of Mexico Anomaly #ST-2026-112",
      type: "ingest"
    }
  ]
};

// REST API Service Methods connected to SpillTraceDB
export const mockApi = {
  async getMetrics() {
    await ensureDbSeeded();
    return SYSTEM_METRICS;
  },

  async getCases() {
    await ensureDbSeeded();
    return await dbManager.getAllCases();
  },

  async getCaseById(caseId) {
    await ensureDbSeeded();
    return await dbManager.getCaseById(caseId);
  },

  async getResponseBases() {
    return RESPONSE_BASES;
  },

  async createCase(name, lat, lng, volumeM3 = 350, thicknessUm = 250) {
    await ensureDbSeeded();
    const caseId = `ST-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();
    const thickness = parseInt(thicknessUm, 10) || 250;
    const category = thickness < 50
      ? "Thin Surface Sheen (<50 µm)"
      : thickness <= 200
        ? "Medium True Color (50-200 µm)"
        : "Thick Emulsified Layer (>200 µm)";

    const newCase = {
      case_id: caseId,
      name: name || `Custom Incident ${caseId}`,
      location_name: `Offshore Target Zone (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      detection_time: nowIso,
      confidence_tier: "High",
      status: "Active",
      analyst_signoff: false,
      days_open: 1,
      last_updated: nowIso,
      top_suspect_name: "Unidentified — Dark Vessel Target",
      detection_history: [
        {
          observation_id: `obs-${caseId}-1`,
          confidence: 0.92,
          detection_time: nowIso,
          location_label: `Offshore Target Zone (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          source_scene_id: "Sentinel-1C SAR (Live Custom Target)",
          slick_polygon: {
            id: `slick-${caseId}`,
            coordinates: [
              { lat: lat + 0.02, lng: lng - 0.02 },
              { lat: lat + 0.03, lng: lng + 0.02 },
              { lat: lat - 0.01, lng: lng + 0.04 },
              { lat: lat - 0.02, lng: lng - 0.01 }
            ],
            confidence: 0.92,
            detection_time: nowIso,
            estimated_volume_m3: volumeM3,
            estimated_thickness_um: thickness,
            thickness_category: category,
            sensor_source: "Sentinel-1C SAR (Live Custom Target)"
          }
        }
      ],
      slick: {
        id: `slick-${caseId}`,
        coordinates: [
          { lat: lat + 0.02, lng: lng - 0.02 },
          { lat: lat + 0.03, lng: lng + 0.02 },
          { lat: lat - 0.01, lng: lng + 0.04 },
          { lat: lat - 0.02, lng: lng - 0.01 }
        ],
        confidence: 0.92,
        detection_time: nowIso,
        estimated_volume_m3: volumeM3,
        estimated_thickness_um: thickness,
        thickness_category: category,
        sensor_source: "Sentinel-1C SAR (Live Custom Target)"
      },
      origin_zone: {
        id: `origin-${caseId}`,
        center_lat: lat - 0.04,
        center_lng: lng - 0.05,
        drift_model: "ECMWF Surface Current Hydrodynamic Backtrack",
        time_window: {
          start: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          end: nowIso
        },
        decay_polygons: [
          [
            { lat: lat - 0.03, lng: lng - 0.04 },
            { lat: lat - 0.02, lng: lng - 0.02 },
            { lat: lat - 0.05, lng: lng - 0.03 },
            { lat: lat - 0.06, lng: lng - 0.05 }
          ]
        ]
      },
      vessels: [
        {
          vessel_id: `IMO-${Math.floor(9000000 + Math.random() * 999999)}`,
          name: "MT Poseidon Runner",
          msi_callsign: "V39A2",
          flag: "Panama",
          vessel_type: "Crude Oil Tanker",
          is_dark_vessel: false,
          ais_gaps: [],
          path: [
            { lat: lat - 0.08, lng: lng - 0.09, timestamp: nowIso, speed_knots: 12.5, heading_deg: 45 },
            { lat: lat - 0.04, lng: lng - 0.05, timestamp: nowIso, speed_knots: 12.4, heading_deg: 46 },
            { lat: lat + 0.01, lng: lng - 0.01, timestamp: nowIso, speed_knots: 12.6, heading_deg: 45 }
          ]
        }
      ],
      dark_vessels: [
        {
          id: `DV-${Math.floor(100 + Math.random() * 900)}`,
          detected_position: { lat: lat - 0.041, lng: lng - 0.052 },
          detected_time: nowIso,
          matched_ais: false,
          estimated_length_m: 230,
          radar_cross_section: "High (Radar Hull Echo ~230m)",
          track_reconstruction: [
            { lat: lat - 0.08, lng: lng - 0.09, timestamp: nowIso, speed_knots: 13.0, heading_deg: 50 },
            { lat: lat - 0.041, lng: lng - 0.052, timestamp: nowIso, speed_knots: 13.2, heading_deg: 52 },
            { lat: lat + 0.01, lng: lng - 0.01, timestamp: nowIso, speed_knots: 13.1, heading_deg: 51 }
          ]
        }
      ],
      suspects: [
        {
          vessel_id: `DV-${Math.floor(100 + Math.random() * 900)}`,
          name: "Unidentified — Dark Vessel Target",
          flag: "Unknown (No AIS)",
          vessel_type: "Tanker Class (230m)",
          is_dark: true,
          scorecard: {
            composite_score: 95,
            confidence_tier: "high",
            route_overlap_pct: 96,
            presence_window: { present: true, duration_minutes: 150 },
            dark_period_flag: true,
            drift_match_pct: 94,
            historical_flag: "AIS Blackout during target transit",
            summary_text: "High probability suspect: Complete transponder blackout inside backtrack origin epicenter."
          }
        }
      ]
    };

    await dbManager.saveCase(newCase);
    return newCase;
  },

  async saveReview(caseId, vesselId, reviewed) {
    return await dbManager.saveAnalystReview(caseId, vesselId, reviewed);
  },

  async getReviews(caseId) {
    const list = await dbManager.getAnalystReviews(caseId);
    return list.map(r => r.vessel_id);
  },

  async saveSignoff(caseId, signoffStatus, notes = '') {
    return await dbManager.saveAnalystSignoff(caseId, signoffStatus, notes);
  },

  /**
   * POST /api/detect — Multi-Spill Detection with Spatial/Temporal De-duplication
   */
  async detectSlick(candidateDetection = null) {
    await ensureDbSeeded();
    const cases = await dbManager.getAllCases();

    if (!candidateDetection) {
      // Return list of all active detections
      const detections = [];
      cases.forEach(c => {
        if (c.detection_history && c.detection_history.length > 0) {
          c.detection_history.forEach(obs => {
            detections.push({
              case_id: c.case_id,
              slick_polygon: obs.slick_polygon || c.slick,
              confidence: obs.confidence || c.slick.confidence,
              detection_time: obs.detection_time || c.detection_time,
              location_label: obs.location_label || c.location_name,
              source_scene_id: obs.source_scene_id || c.slick.sensor_source
            });
          });
        } else if (c.slick) {
          detections.push({
            case_id: c.case_id,
            slick_polygon: c.slick,
            confidence: c.slick.confidence,
            detection_time: c.slick.detection_time,
            location_label: c.location_name,
            source_scene_id: c.slick.sensor_source
          });
        }
      });
      return { detections };
    }

    // Spatial & Temporal De-duplication Check
    const candLat = candidateDetection.lat || (candidateDetection.coordinates && candidateDetection.coordinates[0].lat);
    const candLng = candidateDetection.lng || (candidateDetection.coordinates && candidateDetection.coordinates[0].lng);
    const candTime = new Date(candidateDetection.detection_time || Date.now()).getTime();

    let matchingCase = null;
    let matchDistance = 999;
    let matchTimeDiff = 999;

    for (const c of cases) {
      const caseLat = c.slick?.coordinates?.[0]?.lat || c.origin_zone?.center_lat;
      const caseLng = c.slick?.coordinates?.[0]?.lng || c.origin_zone?.center_lng;
      const caseTime = new Date(c.detection_time).getTime();

      const distKm = getHaversineDistanceKm(candLat, candLng, caseLat, caseLng);
      const timeDiffHours = Math.abs(candTime - caseTime) / (3600 * 1000);

      // Overlap rule: within 50km AND within 48 hours
      if (distKm <= 50 && timeDiffHours <= 48) {
        matchingCase = c;
        matchDistance = distKm;
        matchTimeDiff = timeDiffHours;
        break;
      }
    }

    if (matchingCase) {
      // De-duplication match: append observation to existing case
      const obs = {
        observation_id: `obs-${matchingCase.case_id}-${Date.now().toString().slice(-4)}`,
        slick_polygon: candidateDetection.slick || matchingCase.slick,
        confidence: candidateDetection.confidence || 0.95,
        detection_time: candidateDetection.detection_time || new Date().toISOString(),
        location_label: matchingCase.location_name,
        source_scene_id: candidateDetection.sensor_source || "Sentinel-1C Repeat Pass SAR"
      };

      if (!matchingCase.detection_history) {
        matchingCase.detection_history = [
          {
            observation_id: `obs-${matchingCase.case_id}-1`,
            slick_polygon: matchingCase.slick,
            confidence: matchingCase.slick.confidence,
            detection_time: matchingCase.detection_time,
            location_label: matchingCase.location_name,
            source_scene_id: matchingCase.slick.sensor_source
          }
        ];
      }
      matchingCase.detection_history.push(obs);
      matchingCase.last_updated = new Date().toISOString();
      await dbManager.saveCase(matchingCase);

      return {
        action: "merged",
        message: `De-duplication Match: Spatially (${matchDistance.toFixed(1)}km) and temporally (${matchTimeDiff.toFixed(1)}h) overlapping detection merged into existing open case #${matchingCase.case_id}. No duplicate case created.`,
        case_id: matchingCase.case_id,
        detection: obs,
        matching_case: matchingCase
      };
    } else {
      // Create new case
      const newCase = await this.createCase(
        candidateDetection.name || "New Independent Satellite Spill",
        candLat,
        candLng,
        candidateDetection.estimated_volume_m3 || 400
      );
      return {
        action: "created",
        message: `New Spill Discovery: Created independent case #${newCase.case_id}. No overlapping open cases found within 50km / 48h window.`,
        case_id: newCase.case_id,
        matching_case: newCase
      };
    }
  },

  /**
   * Demo Helper: Trigger De-duplication Test Scenario
   */
  async triggerDeDupDemo() {
    // Send a detection that overlaps ST-2026-089 (North Sea at 56.44°N, 2.18°E)
    const testObservation = {
      name: "North Sea Repeat Pass Candidate",
      lat: 56.450,
      lng: 2.175,
      detection_time: new Date().toISOString(),
      confidence: 0.96,
      sensor_source: "Radarsat-2 Ultra-Fine Repeat Pass (De-duplication Verification)",
      slick: {
        id: `slick-dedup-demo-${Date.now().toString().slice(-4)}`,
        coordinates: [
          { lat: 56.450, lng: 2.165 },
          { lat: 56.465, lng: 2.200 },
          { lat: 56.440, lng: 2.245 },
          { lat: 56.422, lng: 2.215 }
        ],
        confidence: 0.96,
        detection_time: new Date().toISOString(),
        estimated_volume_m3: 450,
        estimated_thickness_um: 310,
        thickness_category: "Thick Emulsified Layer (>200 µm)",
        sensor_source: "Radarsat-2 Ultra-Fine Repeat Pass"
      }
    };

    return await this.detectSlick(testObservation);
  },

  /**
   * POST /api/forecast — Weathering & Coastal Impact Spread Forecast (Calibrated by Layer Thickness)
   */
  async getSpreadForecast(caseId, overrideThicknessUm = null) {
    await ensureDbSeeded();
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    const historyCount = targetCase.detection_history ? targetCase.detection_history.length : 1;
    const isMultiPass = historyCount > 1;

    const thicknessUm = overrideThicknessUm !== null
      ? overrideThicknessUm
      : (targetCase.slick?.estimated_thickness_um || 250);

    // Dynamic Spreading & Weathering Physics based on Oil Layer Thickness:
    // 1. Thin Sheens (< 50 µm): Low surface tension & viscosity enable rapid lateral area expansion,
    //    but high evaporative loss (50-70% in 24h) causes high dispersion before shoreline stranding.
    // 2. Thick Slicks (> 200 µm): High dynamic viscosity & water-in-oil emulsification (mousse) resist
    //    lateral spreading, retaining cohesive high-mass drift along ocean currents with severe coastal smothering risk.
    let thicknessCategory = "Medium True Color (50-200 µm)";
    let spreadRateMin = 0.6;
    let spreadRateMax = 1.4;
    let expansionMultiplier = 0.035;
    let evaporativeLossPct = 28;
    let dispersionBehavior = "Standard surface tension and wave-action spreading with moderate evaporative loss.";
    let impactSeverityText = "Moderate Shoreline Oiling (Requires physical containment booms & nearshore skimming)";
    let threatBadgeColor = "text-amber-400 bg-amber-950 border-amber-800";

    if (thicknessUm < 50) {
      thicknessCategory = "Thin Surface Sheen (<50 µm)";
      spreadRateMin = 1.6;
      spreadRateMax = 3.2;
      expansionMultiplier = 0.062; // Fast lateral thinning
      evaporativeLossPct = 65; // Rapid atmospheric loss
      dispersionBehavior = "Rapid lateral surface spreading driven by surface tension and wind shear; 50-70% evaporative loss within 24h. Lower persistent shoreline stranding mass.";
      impactSeverityText = "Surface Sheen Film (High evaporation / light iridescent wash-up with low smothering risk)";
      threatBadgeColor = "text-cyan-400 bg-cyan-950 border-cyan-800";
    } else if (thicknessUm > 200) {
      thicknessCategory = "Thick Emulsified Layer (>200 µm)";
      spreadRateMin = 0.25;
      spreadRateMax = 0.65;
      expansionMultiplier = 0.016; // Cohesive viscous core resists outward area expansion
      evaporativeLossPct = 8; // Dense emulsion mousse blocks evaporation, retains >90% mass
      dispersionBehavior = "Viscous water-in-oil emulsion mousse inhibits lateral spreading; forms cohesive drifting slick core with negligible evaporative loss. Persistent, concentrated high-mass impact.";
      impactSeverityText = "Catastrophic Heavy Emulsion Stranding (Severe intertidal & coastal wetland smothering hazard)";
      threatBadgeColor = "text-red-400 bg-red-950 border-red-800";
    }

    // Age Estimate Honesty Rule:
    const estimated_spill_age = isMultiPass
      ? {
          min_hours: 22,
          max_hours: 26,
          confidence_tier: "high",
          reason: "Tightly bounded by comparing growth between multiple timestamped satellite passes"
        }
      : {
          min_hours: 6,
          max_hours: 48,
          confidence_tier: "low",
          reason: "Wide age range estimated due to single satellite snapshot — cannot determine growth rate without prior pass"
        };

    const spread_rate_km2_per_hour = {
      min: spreadRateMin,
      max: spreadRateMax,
      oil_type_assumption: thicknessUm > 200 ? "viscous_emulsified_heavy_crude" : thicknessUm < 50 ? "light_distillate_surface_sheen" : "generic_medium_crude"
    };

    // Forward-projected slick polygons for +6h, +12h, +24h, +48h
    // Movement drift vector and lateral expansion dynamically calibrated by thickness
    const baseCoords = targetCase.slick.coordinates;
    const cLat = baseCoords.reduce((sum, c) => sum + c.lat, 0) / baseCoords.length;
    const cLng = baseCoords.reduce((sum, c) => sum + c.lng, 0) / baseCoords.length;

    const offsets = [6, 12, 24, 48];
    const projected_polygons = offsets.map(hours => {
      // Cohesive thick oil drifts with full oceanic current & wind momentum; thin sheen shears faster
      const driftVelocityFactor = thicknessUm > 200 ? 1.15 : thicknessUm < 50 ? 0.90 : 1.0;
      const driftLat = hours * 0.006 * driftVelocityFactor;
      const driftLng = hours * 0.010 * driftVelocityFactor;
      const expansion = 1 + (hours * expansionMultiplier);

      const polygon = baseCoords.map(c => {
        const dLat = c.lat - cLat;
        const dLng = c.lng - cLng;
        return {
          lat: cLat + driftLat + (dLat * expansion),
          lng: cLng + driftLng + (dLng * expansion)
        };
      });

      return {
        time_offset_hours: hours,
        polygon: polygon
      };
    });

    // Coastline distance calculation & thickness-weighted threat appraisal
    let nearest_coastlines = [];
    if (targetCase.case_id.includes('089')) {
      const distUk = getHaversineDistanceKm(cLat, cLng, 56.96, -2.19);
      const speedKts = thicknessUm > 200 ? 2.5 : 2.0;
      nearest_coastlines = [
        {
          name: "Scottish East Coast (Stonehaven / Aberdeen Sector)",
          distance_km: distUk,
          estimated_time_to_impact_hours: {
            min: Math.round(distUk / (speedKts * 1.4)),
            max: Math.round(distUk / speedKts)
          },
          confidence_tier: "medium",
          coastal_type: "Rocky Shoreline & Marine Seabird Habitat",
          impact_severity: impactSeverityText,
          threat_badge: threatBadgeColor
        }
      ];
    } else if (targetCase.case_id.includes('104')) {
      const distMal = getHaversineDistanceKm(cLat, cLng, 1.48, 103.38);
      const speedKts = thicknessUm > 200 ? 1.9 : 1.5;
      nearest_coastlines = [
        {
          name: "Pontian Coastal Reserve (Johor, Malaysia)",
          distance_km: distMal,
          estimated_time_to_impact_hours: {
            min: Math.round(distMal / (speedKts * 1.3)),
            max: Math.round(distMal / speedKts)
          },
          confidence_tier: "high",
          coastal_type: "Mangrove Estuary & Aquaculture Fisheries",
          impact_severity: impactSeverityText,
          threat_badge: threatBadgeColor
        }
      ];
    } else {
      // Gulf of Mexico — Coastline impact reaching in 14-22 hours!
      const distGulf = 18.5;
      nearest_coastlines = [
        {
          name: "Mississippi River Delta (Pass a Loutre Wildlife Refuge)",
          distance_km: distGulf,
          estimated_time_to_impact_hours: {
            min: thicknessUm > 200 ? 12 : 15,
            max: thicknessUm > 200 ? 18 : 22
          },
          confidence_tier: "high",
          coastal_type: "Coastal Marshland & Shellfish Habitats",
          impact_severity: impactSeverityText,
          threat_badge: threatBadgeColor
        }
      ];
    }

    return {
      case_id: targetCase.case_id,
      thickness_um: thicknessUm,
      thickness_category: thicknessCategory,
      dispersion_behavior: dispersionBehavior,
      evaporative_loss_pct: evaporativeLossPct,
      estimated_spill_age,
      spread_rate_km2_per_hour,
      projected_polygons,
      nearest_coastlines,
      detection_count: historyCount
    };
  },

  /**
   * POST /api/response-route — Navigable Marine Routing & Hazard Detection
   */
  async getResponseRoute(caseId, baseId = null) {
    await ensureDbSeeded();
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    const cLat = targetCase.slick.coordinates[0].lat;
    const cLng = targetCase.slick.coordinates[0].lng;

    let selectedBase = RESPONSE_BASES.find(b => b.id === baseId);
    if (!selectedBase) {
      if (caseId.includes('089')) selectedBase = RESPONSE_BASES[0];
      else if (caseId.includes('104')) selectedBase = RESPONSE_BASES[2];
      else selectedBase = RESPONSE_BASES[4];
    }

    let waypoints = [];
    let hazard_segments = [];
    let transitHours = 4.2;

    if (selectedBase.id.includes('aberdeen') || caseId.includes('089')) {
      waypoints = [
        { lat: 57.1497, lng: -2.0943 },
        { lat: 56.9500, lng: -1.5000 },
        { lat: 56.7000, lng: 0.5000 },
        { lat: 56.5500, lng: 1.5000 },
        { lat: 56.4450, lng: 2.1600 }
      ];
      transitHours = 8.5;
      hazard_segments = [
        {
          segment: [
            { lat: 56.7000, lng: 0.5000 },
            { lat: 56.5500, lng: 1.5000 }
          ],
          reason: "high swell",
          details: "North Sea Storm Warning: Significant wave height 4.2m & 32kt gusts in Outer Forties Sector"
        }
      ];
    } else if (selectedBase.id.includes('singapore') || caseId.includes('104')) {
      waypoints = [
        { lat: 1.2640, lng: 103.8200 },
        { lat: 1.2400, lng: 103.6500 },
        { lat: 1.3100, lng: 103.4000 },
        { lat: 1.4350, lng: 103.1300 }
      ];
      transitHours = 3.8;
      hazard_segments = [
        {
          segment: [
            { lat: 1.2400, lng: 103.6500 },
            { lat: 1.3100, lng: 103.4000 }
          ],
          reason: "low visibility",
          details: "Malacca Traffic & Monsoon Rain: Heavy squall reducing visibility < 0.5 NM near Raffles Lighthouse"
        }
      ];
    } else {
      waypoints = [
        { lat: 29.9510, lng: -90.0710 },
        { lat: 29.5000, lng: -89.6000 },
        { lat: 28.9800, lng: -89.1000 },
        { lat: 28.5200, lng: -89.1500 }
      ];
      transitHours = 5.4;
      hazard_segments = [
        {
          segment: [
            { lat: 28.9800, lng: -89.1000 },
            { lat: 28.5200, lng: -89.1500 }
          ],
          reason: "storm cell",
          details: "Convective Weather Cell: Heavy thunderstorms & squalls active outside Mississippi River South Pass"
        }
      ];
    }

    const distKm = getHaversineDistanceKm(waypoints[0].lat, waypoints[0].lng, cLat, cLng);

    return {
      case_id: targetCase.case_id,
      starting_base: selectedBase,
      route: waypoints,
      distance_km: distKm,
      estimated_transit_time_hours: transitHours,
      transit_time_range: {
        min_hours: Math.round((transitHours * 0.85) * 10) / 10,
        max_hours: Math.round((transitHours * 1.25) * 10) / 10
      },
      hazard_segments,
      route_confidence: hazard_segments.length > 0 ? "medium" : "high",
      disclaimer: "Advisory routing only. Verify against official maritime weather warnings, navigational charts, and vessel-specific constraints before dispatch."
    };
  },

  async backtrackOrigin(caseId) {
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    return {
      case_id: targetCase.case_id,
      origin_zone: targetCase.origin_zone,
      time_window: targetCase.origin_zone.time_window
    };
  },

  async getVessels(caseId) {
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    return targetCase.vessels;
  },

  async getDarkVessels(caseId) {
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    return targetCase.dark_vessels;
  },

  async scoreVessel(vesselId, caseId) {
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    const suspect = targetCase.suspects.find(s => s.vessel_id === vesselId);
    return suspect ? suspect.scorecard : null;
  },

  async generateReport(caseId, reviewedSuspects, analystSignoff) {
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    
    const reportObj = {
      report_id: `RPT-${targetCase.case_id}-${Date.now().toString().slice(-4)}`,
      generated_at: new Date().toISOString(),
      case_id: targetCase.case_id,
      case_name: targetCase.name,
      location: targetCase.location_name,
      detection_time: targetCase.detection_time,
      confidence_tier: targetCase.confidence_tier,
      estimated_volume_m3: targetCase.slick.estimated_volume_m3 || 400,
      estimated_thickness_um: targetCase.slick.estimated_thickness_um || 250,
      thickness_category: targetCase.slick.thickness_category || 'Medium True Color (50-200 µm)',
      slick_confidence_pct: Math.round(targetCase.slick.confidence * 100),
      origin_time_range: `${targetCase.origin_zone.time_window.start.slice(11, 16)} to ${targetCase.origin_zone.time_window.end.slice(11, 16)} UTC`,
      drift_model: targetCase.origin_zone.drift_model,
      top_suspects: targetCase.suspects.filter(s => reviewedSuspects.includes(s.vessel_id) || s.scorecard.composite_score > 70),
      analyst_signoff: analystSignoff,
      disclaimer: "LEGAL NOTICE: AI-derived evidence scorecards and hydrodynamic backtrack models are probabilistic intelligence products intended solely to support official maritime law enforcement investigations. Final enforcement action requires physical sample verification (GC-MS fingerprinting) by designated port state authorities."
    };

    await dbManager.saveReport(reportObj);
    return reportObj;
  },

  async getArchive() {
    await ensureDbSeeded();
    const activeCases = await dbManager.getAllCases();

    const activeFormatted = activeCases.map(c => ({
      case_id: c.case_id,
      name: c.name,
      location_name: c.location_name,
      date: c.detection_time.slice(0, 10),
      status: c.status || 'Active',
      confidence_tier: c.confidence_tier || 'High',
      top_suspect_name: c.top_suspect_name || (c.suspects && c.suspects[0] ? c.suspects[0].name : 'Unidentified'),
      vessel_count: c.suspects ? c.suspects.length : 1,
      days_open: c.days_open || 2,
      last_updated: c.last_updated || c.detection_time,
      outcome: c.analyst_notes || "Under active investigation by maritime authorities",
      suspects: c.suspects || []
    }));

    return [...activeFormatted, ...SEED_ARCHIVE];
  },

  /**
   * POST /api/estimator — Range-Based Cleanup Cost & Resource Estimator (Calibrated by Layer Thickness)
   */
  async getCleanupEstimate(caseId, overrideThicknessUm = null) {
    await ensureDbSeeded();
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];
    const volumeM3 = targetCase.slick?.estimated_volume_m3 || 400;

    const thicknessUm = overrideThicknessUm !== null
      ? overrideThicknessUm
      : (targetCase.slick?.estimated_thickness_um || 250);

    // Dynamic Cost & Resource Allocation Physics based on Oil Layer Thickness:
    // 1. Thin Sheens (< 50 µm): Mechanical skimming recovery efficiency drops to 15% (skimmers pull 85% water).
    //    Direct mechanical collection is limited; aerial dispersants & sorbent sweeps are applied.
    //    Minimal emulsion expansion (1.1×), so hazardous waste disposal costs are lower ($1,400-$3,200/m³).
    // 2. Thick Slicks (> 200 µm): High mechanical recovery efficiency (85%), but severe emulsification
    //    (water-in-oil mousse) triples total recovered waste volume (3.2×).
    //    Requires heavy deep-draft ocean booms (to stop underflow), high-temperature waste incineration,
    //    and intense manual shoreline decontamination, driving unit costs to $4,800-$9,600/m³.
    let thicknessCategory = "Medium True Color (50-200 µm)";
    let skimmerEfficiency = 65; // %
    let emulsionMultiplier = 1.8; // waste expansion
    let costPerM3Min = 2800;
    let costPerM3Max = 6400;
    let vesselDivisorMin = 160;
    let vesselDivisorMax = 75;
    let boomFactorMin = 1.8;
    let boomFactorMax = 3.4;
    let personnelFactorMin = 0.08;
    let personnelFactorMax = 0.16;
    let recoveryFactorMin = 0.45;
    let recoveryFactorMax = 0.85;
    let breakdown = {
      offshore_skimming: 38,
      containment_booming: 26,
      shoreline_protection: 22,
      waste_disposal: 14
    };
    let assumptions = "Assumes generic medium crude oil (50-200 µm), standard mechanical skimming with 30% dispersant application, and standard 14-day offshore/shoreline response duration.";

    if (thicknessUm < 50) {
      thicknessCategory = "Thin Surface Sheen (<50 µm)";
      skimmerEfficiency = 15; // mechanical skimmers collect ~85% water
      emulsionMultiplier = 1.1; // minimal emulsion formation
      costPerM3Min = 1400; // direct skimming is inefficient/limited; emphasis on aerial surveillance & dispersants
      costPerM3Max = 3200;
      vesselDivisorMin = 220;
      vesselDivisorMax = 120;
      boomFactorMin = 1.0;
      boomFactorMax = 1.8;
      personnelFactorMin = 0.04;
      personnelFactorMax = 0.09;
      recoveryFactorMin = 0.20;
      recoveryFactorMax = 0.40;
      breakdown = {
        offshore_skimming: 18,
        containment_booming: 16,
        shoreline_protection: 44, // monitoring & shoreline protection
        waste_disposal: 22
      };
      assumptions = "Thin sheen (<50 µm): Mechanical skimming efficiency is reduced (15%) due to thin surface layer. Response cost reflects aerial dispersant application, sorbent sweeps, and low hazardous emulsion disposal volumes.";
    } else if (thicknessUm > 200) {
      thicknessCategory = "Thick Emulsified Layer (>200 µm)";
      skimmerEfficiency = 85; // high oil recovery rate per pass
      emulsionMultiplier = 3.2; // water entrainment triples total oily waste volume
      costPerM3Min = 4800; // intensive heavy viscous crude handling, barge storage & hazardous disposal
      costPerM3Max = 9600;
      vesselDivisorMin = 110;
      vesselDivisorMax = 50;
      boomFactorMin = 2.6; // heavy deep-skirt ocean boom needed to stop underflow
      boomFactorMax = 4.8;
      personnelFactorMin = 0.12;
      personnelFactorMax = 0.24;
      recoveryFactorMin = 0.65;
      recoveryFactorMax = 1.25;
      breakdown = {
        offshore_skimming: 42,
        containment_booming: 14,
        shoreline_protection: 20,
        waste_disposal: 24 // waste disposal triples due to emulsion mousse
      };
      assumptions = "Thick layer (>200 µm): High mechanical recovery efficiency (85%), but severe emulsification (mousse formation) increases recovered hazardous waste volume by 3.2×. Requires heavy deep-draft ocean booms and high-temperature waste incineration.";
    }

    const minCost = Math.round(volumeM3 * costPerM3Min);
    const maxCost = Math.round(volumeM3 * costPerM3Max);

    const minVessels = Math.max(2, Math.round(volumeM3 / vesselDivisorMin));
    const maxVessels = Math.max(4, Math.round(volumeM3 / vesselDivisorMax));

    const minBoom = Math.round(volumeM3 * boomFactorMin);
    const maxBoom = Math.round(volumeM3 * boomFactorMax);

    const minPersonnel = Math.round(volumeM3 * personnelFactorMin);
    const maxPersonnel = Math.round(volumeM3 * personnelFactorMax);

    const minRecovery = Math.round(volumeM3 * recoveryFactorMin);
    const maxRecovery = Math.round(volumeM3 * recoveryFactorMax);

    const historyCount = targetCase.detection_history ? targetCase.detection_history.length : 1;
    const confidenceTier = historyCount > 1 ? "medium" : "low";

    return {
      case_id: targetCase.case_id,
      estimated_volume_m3: volumeM3,
      thickness_um: thicknessUm,
      thickness_category: thicknessCategory,
      skimmer_efficiency_pct: skimmerEfficiency,
      emulsion_waste_factor: emulsionMultiplier,
      cost_range_usd: {
        min: minCost,
        max: maxCost,
        confidence_tier: confidenceTier,
        assumptions_text: assumptions
      },
      resource_requirements: {
        vessels: { min: minVessels, max: maxVessels },
        containment_boom_m: { min: minBoom, max: maxBoom },
        personnel: { min: minPersonnel, max: maxPersonnel },
        skimming_capacity_m3_day: { min: minRecovery, max: maxRecovery }
      },
      cost_breakdown_pct: breakdown,
      disclaimer: "Advisory planning estimate calibrated by layer thickness and historical response benchmarks. Actual cleanup costs and equipment needs depend on real-time sea state, emulsion viscosity, and distance from port."
    };
  },

  /**
   * GET /api/environmental-zones — Environmental Sensitivity Overlay Data & Intersections
   */
  async getEnvironmentalZones(caseId) {
    await ensureDbSeeded();
    const targetCase = await dbManager.getCaseById(caseId) || SEED_CASES[0];

    let zones = [];

    if (targetCase.case_id.includes('089')) {
      // North Sea
      zones = [
        {
          id: "env-ns-1",
          name: "Firth of Forth Seabird Sanctuary",
          designation: "UNESCO Biosphere / SPA Sanctuary",
          category: "wildlife",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 56.32, lng: 2.20 },
            { lat: 56.40, lng: 2.30 },
            { lat: 56.30, lng: 2.38 },
            { lat: 56.24, lng: 2.24 }
          ],
          primary_species: "Northern Gannet, Atlantic Puffin & Kittiwake Nesting Colonies",
          intersects_spill: true,
          intersection_details: "Forecasted slick trajectory (+24h) enters outer buffer zone (8.5 km distance)"
        },
        {
          id: "env-ns-2",
          name: "Dogger Bank Marine Protected Area",
          designation: "Special Area of Conservation (SAC)",
          category: "mpa",
          priority_tier: "Tier 2 High",
          coordinates: [
            { lat: 55.45, lng: 2.70 },
            { lat: 55.60, lng: 2.95 },
            { lat: 55.35, lng: 3.10 },
            { lat: 55.25, lng: 2.80 }
          ],
          primary_species: "Sublittoral Sandbank Benthic Habitat & Sand Eel Nursery",
          intersects_spill: false,
          intersection_details: "Clear of current 48h hydrodynamic forecast drift"
        },
        {
          id: "env-ns-3",
          name: "North Sea Cod Spawning & Trawler Grounds",
          designation: "Protected Commercial Fishery Zone",
          category: "fishery",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 56.42, lng: 2.12 },
            { lat: 56.48, lng: 2.22 },
            { lat: 56.38, lng: 2.28 },
            { lat: 56.34, lng: 2.15 }
          ],
          primary_species: "Atlantic Cod Spawning Aggregation & Nephrops Fishery",
          intersects_spill: true,
          intersection_details: "CRITICAL: Confirmed slick polygon directly overlaps active spawning grounds"
        }
      ];
    } else if (targetCase.case_id.includes('104')) {
      // Malacca Strait
      zones = [
        {
          id: "env-ms-1",
          name: "Pulau Kukup Mangrove National Park",
          designation: "Ramsar Wetland of International Importance",
          category: "wildlife",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 1.30, lng: 103.40 },
            { lat: 1.36, lng: 103.48 },
            { lat: 1.28, lng: 103.52 },
            { lat: 1.24, lng: 103.44 }
          ],
          primary_species: "Estuarine Mangrove Forest, Mudskippers & Green Sea Turtles",
          intersects_spill: true,
          intersection_details: "Forecasted slick (+48h) threatens mangrove barrier"
        },
        {
          id: "env-ms-2",
          name: "Pontian Coral Reef & Seagrass Sanctuary",
          designation: "Marine Protected Reserve",
          category: "coral",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 1.38, lng: 103.22 },
            { lat: 1.44, lng: 103.30 },
            { lat: 1.35, lng: 103.34 },
            { lat: 1.32, lng: 103.26 }
          ],
          primary_species: "Hard Coral Reef Patches & Dugong Seagrass Nursery",
          intersects_spill: true,
          intersection_details: "Slick boundary within 14 km coastal buffer"
        },
        {
          id: "env-ms-3",
          name: "Johor Aquaculture & Fish Cage Farming Sector",
          designation: "Designated Fishery Zone",
          category: "fishery",
          priority_tier: "Tier 2 High",
          coordinates: [
            { lat: 1.44, lng: 103.05 },
            { lat: 1.50, lng: 103.14 },
            { lat: 1.41, lng: 103.18 },
            { lat: 1.38, lng: 103.08 }
          ],
          primary_species: "Seabass, Snapper Floating Cage Farms & Cockle Beds",
          intersects_spill: true,
          intersection_details: "Direct trajectory match with current tide drift"
        }
      ];
    } else {
      // Gulf of Mexico
      zones = [
        {
          id: "env-gom-1",
          name: "Pass a Loutre Wildlife Refuge & Pelican Nesting Area",
          designation: "State Wildlife Sanctuary & Coastal Reserve",
          category: "wildlife",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 29.05, lng: -89.15 },
            { lat: 29.18, lng: -89.00 },
            { lat: 29.00, lng: -88.95 },
            { lat: 28.92, lng: -89.10 }
          ],
          primary_species: "Brown Pelican Nesting Colonies, Roseate Spoonbill & Coastal Wetlands",
          intersects_spill: true,
          intersection_details: "IMPACT FORECAST IN 14-22 HOURS: Forward slick trajectory intersects refuge delta"
        },
        {
          id: "env-gom-2",
          name: "Mississippi Canyon Deepwater Lophelia Coral Zone",
          designation: "Habitat Area of Particular Concern (HAPC)",
          category: "coral",
          priority_tier: "Tier 1 Critical",
          coordinates: [
            { lat: 28.42, lng: -89.24 },
            { lat: 28.56, lng: -89.12 },
            { lat: 28.48, lng: -89.05 },
            { lat: 28.38, lng: -89.18 }
          ],
          primary_species: "Deepwater Lophelia Pertusa Cold-Water Coral Reef Systems",
          intersects_spill: true,
          intersection_details: "Direct spatial overlap with backtracked origin zone"
        },
        {
          id: "env-gom-3",
          name: "Louisiana Commercial Shrimping & Blue Crab Harvest Zone",
          designation: "Commercial Marine Fishery",
          category: "fishery",
          priority_tier: "Tier 2 High",
          coordinates: [
            { lat: 28.58, lng: -89.12 },
            { lat: 28.70, lng: -88.98 },
            { lat: 28.50, lng: -88.92 },
            { lat: 28.44, lng: -89.06 }
          ],
          primary_species: "Penaeid Brown Shrimp Nursery & Blue Crab Harvesting Grounds",
          intersects_spill: true,
          intersection_details: "Confirmed slick overlaps commercial trawling grid"
        }
      ];
    }

    return {
      case_id: targetCase.case_id,
      zones: zones,
      intersecting_count: zones.filter(z => z.intersects_spill).length
    };
  }
};

