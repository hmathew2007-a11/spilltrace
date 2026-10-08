/**
 * SpillTrace AI Data Types & Documentation
 *
 * @typedef {Object} GeoPoint
 * @property {number} lat
 * @property {number} lng
 *
 * @typedef {Object} SlickPolygon
 * @property {string} id
 * @property {GeoPoint[]} coordinates
 * @property {number} confidence - 0 to 1
 * @property {string} detection_time - ISO8601 string
 * @property {number} estimated_volume_m3
 * @property {number} [estimated_thickness_um] - Oil layer thickness in micrometers (µm)
 * @property {string} [thickness_category] - e.g. 'Thin Sheen (<50 µm)', 'Medium True Color (50-200 µm)', 'Thick Emulsified (>200 µm)'
 * @property {string} sensor_source - e.g. Sentinel-1 SAR
 *
 * @typedef {Object} OriginProbabilityZone
 * @property {string} id
 * @property {GeoPoint[][]} decay_polygons - List of concentric heat polygons from high to low probability
 * @property {Object} time_window
 * @property {string} time_window.start - ISO8601
 * @property {string} time_window.end - ISO8601
 * @property {number} center_lat
 * @property {number} center_lng
 * @property {string} drift_model - e.g. ECMWF/HYCOM Reverse Hydrodynamic Model
 *
 * @typedef {Object} TrackPoint
 * @property {number} lat
 * @property {number} lng
 * @property {string} timestamp
 * @property {number} speed_knots
 * @property {number} heading_deg
 * @property {boolean} [ais_active]
 *
 * @typedef {Object} VesselTrack
 * @property {string} vessel_id
 * @property {string} name
 * @property {string} msi_callsign
 * @property {string} flag
 * @property {string} vessel_type - e.g. Crude Oil Tanker, Bulk Carrier
 * @property {TrackPoint[]} path
 * @property {Array<{start: string, end: string}>} ais_gaps
 * @property {boolean} is_dark_vessel
 *
 * @typedef {Object} DarkVesselMarker
 * @property {string} id
 * @property {GeoPoint} detected_position
 * @property {string} detected_time
 * @property {boolean} matched_ais - false for dark vessels
 * @property {number} estimated_length_m
 * @property {string} radar_cross_section
 *
 * @typedef {Object} EvidenceScorecard
 * @property {number} route_overlap_pct - 0 to 100
 * @property {Object} presence_window
 * @property {boolean} presence_window.present
 * @property {number} presence_window.duration_minutes
 * @property {boolean} dark_period_flag - AIS went silent in window
 * @property {number} drift_match_pct - 0 to 100
 * @property {string|null} historical_flag - Prior incidents or violations
 * @property {string} confidence_tier - 'low' | 'medium' | 'high'
 * @property {number} composite_score - 0 to 100
 * @property {string} summary_text - Plain-language one-line explanation
 *
 * @typedef {Object} DetectionObservation
 * @property {string} observation_id
 * @property {SlickPolygon} slick_polygon
 * @property {number} confidence
 * @property {string} detection_time
 * @property {string} location_label
 * @property {string} source_scene_id
 *
 * @typedef {Object} SpreadForecast
 * @property {Object} estimated_spill_age
 * @property {number} estimated_spill_age.min_hours
 * @property {number} estimated_spill_age.max_hours
 * @property {string} estimated_spill_age.confidence_tier - 'low' | 'medium' | 'high'
 * @property {number} thickness_um - Layer thickness in micrometers (µm) governing spreading and weathering
 * @property {string} thickness_category - 'Thin Sheen (<50 µm)' | 'Medium True Color (50-200 µm)' | 'Thick Emulsified (>200 µm)'
 * @property {string} dispersion_behavior - Spreading physics description based on thickness
 * @property {number} evaporative_loss_pct - Estimated 24h evaporation loss percentage
 * @property {Object} spread_rate_km2_per_hour
 * @property {number} spread_rate_km2_per_hour.min
 * @property {number} spread_rate_km2_per_hour.max
 * @property {string} spread_rate_km2_per_hour.oil_type_assumption - e.g. 'generic_medium_crude'
 * @property {Array<{time_offset_hours: number, polygon: GeoPoint[]}>} projected_polygons
 * @property {Array<{name: string, distance_km: number, estimated_time_to_impact_hours: {min: number, max: number}, confidence_tier: string, impact_severity: string}>} nearest_coastlines
 *
 * @typedef {Object} ResponseBase
 * @property {string} id
 * @property {string} name
 * @property {string} region
 * @property {GeoPoint} location
 * @property {string} vessel_assets
 *
 * @typedef {Object} HazardSegment
 * @property {GeoPoint[]} segment
 * @property {string} reason - 'high swell' | 'storm cell' | 'low visibility'
 * @property {string} details
 *
 * @typedef {Object} ResponseRoute
 * @property {GeoPoint[]} route
 * @property {number} estimated_transit_time_hours
 * @property {HazardSegment[]} hazard_segments
 * @property {string} route_confidence - 'low' | 'medium' | 'high'
 * @property {ResponseBase} starting_base
 *
 * @typedef {Object} CleanupEstimate
 * @property {number} thickness_um - Layer thickness in µm governing skimming efficiency & emulsion expansion
 * @property {string} thickness_category - Layer category
 * @property {number} skimmer_efficiency_pct - Mechanical skimmer efficiency (drops sharply under 50 µm)
 * @property {number} emulsion_waste_factor - Multiplier for total oily waste volume generated
 * @property {Object} cost_range_usd
 * @property {number} cost_range_usd.min
 * @property {number} cost_range_usd.max
 * @property {string} confidence_tier - 'low' | 'medium' | 'high'
 * @property {string} assumptions_text
 * @property {Object} resource_requirements
 * @property {Object} resource_requirements.vessels - { min: number, max: number }
 * @property {Object} resource_requirements.containment_boom_m - { min: number, max: number }
 * @property {Object} resource_requirements.personnel - { min: number, max: number }
 * @property {Object} resource_requirements.skimming_capacity_m3_day - { min: number, max: number }
 * @property {Object} cost_breakdown_pct
 * @property {number} cost_breakdown_pct.offshore_skimming
 * @property {number} cost_breakdown_pct.containment_booming
 * @property {number} cost_breakdown_pct.shoreline_protection
 * @property {number} cost_breakdown_pct.waste_disposal
 *
 * @typedef {Object} EnvironmentalZone
 * @property {string} id
 * @property {string} name
 * @property {string} designation - e.g. 'UNESCO Biosphere / Ramsar Site'
 * @property {string} category - 'mpa' | 'coral' | 'fishery' | 'wildlife'
 * @property {GeoPoint[]} coordinates
 * @property {string} primary_species
 * @property {string} priority_tier - 'Tier 1 Critical' | 'Tier 2 High'
 * @property {boolean} intersects_spill
 * @property {string} [intersection_details]
 *
 * @typedef {Object} SuspectVessel
 * @property {string} vessel_id
 * @property {string} name
 * @property {string} flag
 * @property {string} vessel_type
 * @property {boolean} is_dark
 * @property {EvidenceScorecard} scorecard
 * @property {boolean} reviewed
 *
 * @typedef {Object} SpillCase
 * @property {string} case_id
 * @property {string} name
 * @property {string} location_name
 * @property {string} detection_time
 * @property {string} confidence_tier - 'Low' | 'Medium' | 'High'
 * @property {string} status - 'Active' | 'Under Review' | 'Closed'
 * @property {SlickPolygon} slick
 * @property {DetectionObservation[]} [detection_history]
 * @property {SpreadForecast} [forecast]
 * @property {OriginProbabilityZone} origin_zone
 * @property {VesselTrack[]} vessels
 * @property {DarkVesselMarker[]} dark_vessels
 * @property {SuspectVessel[]} suspects
 * @property {boolean} analyst_signoff
 * @property {string} [analyst_notes]
 * @property {string} [outcome]
 */
