/**
 * SpillTrace AI — Photorealistic 3D Map Component (MapLibre GL JS Engine)
 * Features: High-Res Esri Satellite, 3D Pitch/Bearing, 3D Extruded Oil Slick Volume, 3D Vessels & HUD
 */

window.MapView = function MapView({
  activeCase,
  allCases = [],
  onSelectCase,
  selectedVesselId,
  onSelectVessel,
  timelineProgress, // 0 to 1
  isPlaying,
  mapMode = 'single',
  setMapMode,
  forecast = null,
  forwardOffset = 0,
  setForwardOffset,
  routeData = null,
  isRouteActive = false,
  setIsRouteActive,
  environmentalData = null
}) {
  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const popupRef = React.useRef(null);
  const prevCaseIdRef = React.useRef(null);
  const prevMapModeRef = React.useRef(null);

  // 3D Map Control State
  const [pitch, setPitch] = React.useState(55);
  const [bearing, setBearing] = React.useState(-15);
  const [is3D, setIs3D] = React.useState(true);
  const [mapStyle, setMapStyle] = React.useState('satellite'); // 'satellite' | 'dark-satellite' | 'ocean-topo'
  const [projection, setProjection] = React.useState('globe'); // 'globe' | 'mercator'
  const [isOrbitMode, setIsOrbitMode] = React.useState(false); // Left-click drag rotates
  const [isAutoRotating, setIsAutoRotating] = React.useState(false); // Planet auto-rotation
  const [spinSpeed, setSpinSpeed] = React.useState(1); // 1x auto-rotation speed
  const [isGlobeElevated, setIsGlobeElevated] = React.useState(true); // Elevates globe higher up on screen
  const [zoomLevel, setZoomLevel] = React.useState(11.5);
  const [showGestureTip, setShowGestureTip] = React.useState(false); // Disabled by default so it does not cover the map
  const [showGlobalBanner, setShowGlobalBanner] = React.useState(true);
  const [isCleanMapMode, setIsCleanMapMode] = React.useState(false); // Clean view mode to hide HUD elements
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(false); // Collapsible navigation controls HUD

  // Layer toggles state
  const [layersConfig, setLayersConfig] = React.useState({
    slick: true,
    originZone: true,
    vesselTracks: true,
    darkVessels: true,
    forwardForecast: true,
    responseRoute: true,
    environmentalZones: true
  });

  const [showLayerWidget, setShowLayerWidget] = React.useState(false);
  const [showStyleWidget, setShowStyleWidget] = React.useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = React.useState(false);
  const [highlightedLegendKey, setHighlightedLegendKey] = React.useState(null);

  // Helper: calculate opacity based on legend highlight state
  const getLayerOpacity = (key, defaultOpacity) => {
    if (!highlightedLegendKey) return defaultOpacity;
    return highlightedLegendKey === key ? Math.min(1.0, defaultOpacity * 1.5) : defaultOpacity * 0.15;
  };

  // Handler: Select legend item to focus camera & highlight layer
  const handleSelectLegendKey = (key) => {
    const nextKey = highlightedLegendKey === key ? null : key;
    setHighlightedLegendKey(nextKey);

    const map = mapInstanceRef.current;
    if (!map) return;

    if (!nextKey) {
      drawAllLayers({ forceFitBounds: true });
      return;
    }

    // Auto-enable required layer toggles & offsets if user clicks legend item
    if (nextKey === 'forecast') {
      if (!layersConfig.forwardForecast) {
        setLayersConfig(prev => ({ ...prev, forwardForecast: true }));
      }
      if (forwardOffset === 0 && setForwardOffset) {
        setForwardOffset(6);
      }
    } else if (nextKey === 'responseRoute') {
      if (!layersConfig.responseRoute) {
        setLayersConfig(prev => ({ ...prev, responseRoute: true }));
      }
      if (!isRouteActive && setIsRouteActive) {
        setIsRouteActive(true);
      }
    } else if (nextKey === 'slick' && !layersConfig.slick) {
      setLayersConfig(prev => ({ ...prev, slick: true }));
    } else if (nextKey === 'origin' && !layersConfig.originZone) {
      setLayersConfig(prev => ({ ...prev, originZone: true }));
    } else if (nextKey === 'darkVessels' && !layersConfig.darkVessels) {
      setLayersConfig(prev => ({ ...prev, darkVessels: true }));
    } else if (nextKey === 'suspectVessels' && !layersConfig.vesselTracks) {
      setLayersConfig(prev => ({ ...prev, vesselTracks: true }));
    } else if (nextKey === 'ecoZones' && !layersConfig.environmentalZones) {
      setLayersConfig(prev => ({ ...prev, environmentalZones: true }));
    }

    const targetBounds = new maplibregl.LngLatBounds();

    if (nextKey === 'slick' && activeCase?.slick?.coordinates) {
      activeCase.slick.coordinates.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
    } else if (nextKey === 'forecast' && forecast?.projected_polygons) {
      const matchProj = forecast.projected_polygons.find(p => p.time_offset_hours === (forwardOffset || 6)) || forecast.projected_polygons[0];
      if (matchProj?.polygon) {
        matchProj.polygon.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
      }
    } else if (nextKey === 'origin' && activeCase?.origin_zone?.decay_polygons) {
      activeCase.origin_zone.decay_polygons.forEach(poly => {
        poly.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
      });
    } else if (nextKey === 'darkVessels' && activeCase?.dark_vessels) {
      activeCase.dark_vessels.forEach(dv => {
        const dvPos = dv.detected_position;
        if (dvPos) targetBounds.extend([dvPos.lng, dvPos.lat]);
        if (dv.track_reconstruction) {
          dv.track_reconstruction.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
        }
      });
    } else if (nextKey === 'suspectVessels' && activeCase?.vessels) {
      activeCase.vessels.forEach(v => {
        v.path?.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
      });
    } else if (nextKey === 'responseRoute' && routeData?.route) {
      routeData.route.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
      if (routeData.starting_base?.location) {
        targetBounds.extend([routeData.starting_base.location.lng, routeData.starting_base.location.lat]);
      }
    } else if (nextKey === 'ecoZones' && environmentalData?.zones) {
      environmentalData.zones.forEach(z => {
        z.coordinates?.forEach(pt => targetBounds.extend([pt.lng, pt.lat]));
      });
    }

    if (!targetBounds.isEmpty()) {
      map.fitBounds(targetBounds, {
        padding: { top: 120, bottom: 120, left: 120, right: 380 },
        pitch: is3D ? 55 : 0,
        bearing: bearing,
        maxZoom: 14,
        duration: 1000
      });
    }
  };

  // Map Tile Style Specifications
  const getStyleSpec = (styleKey, projType = projection) => {
    const projSpec = { type: projType };
    const skySpec = projType === 'globe' ? {
      'sky-color': '#030712',
      'sky-horizon-blend': 0.8,
      'horizon-color': '#0d1d3a',
      'horizon-fog-blend': 0.85,
      'fog-color': '#001a33',
      'fog-ground-blend': 0.9
    } : undefined;

    if (styleKey === 'satellite') {
      return {
        version: 8,
        projection: projSpec,
        sky: skySpec,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#030712' }
          },
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            paint: {
              'raster-contrast': 0.1,
              'raster-brightness-max': 0.95
            }
          }
        ]
      };
    } else if (styleKey === 'dark-satellite') {
      return {
        version: 8,
        projection: projSpec,
        sky: skySpec,
        sources: {
          'dark-basemap': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            attribution: 'CartoDB'
          },
          'esri-satellite-overlay': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19
          }
        },
        layers: [
          { id: 'dark-bg', type: 'raster', source: 'dark-basemap' },
          {
            id: 'sat-overlay',
            type: 'raster',
            source: 'esri-satellite-overlay',
            paint: { 'raster-opacity': 0.45, 'raster-contrast': 0.25 }
          }
        ]
      };
    } else {
      // Ocean Topography
      return {
        version: 8,
        projection: projSpec,
        sky: skySpec,
        sources: {
          'ocean-basemap': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 13,
            attribution: 'Esri, Garmin, GEBCO'
          }
        },
        layers: [
          { id: 'ocean-layer', type: 'raster', source: 'ocean-basemap' }
        ]
      };
    }
  };

  // Helper: Clear past markers & popups
  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  };

  // 1. Initialize Map Instance Once
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = activeCase?.slick?.coordinates?.length > 0
      ? [activeCase.slick.coordinates[0].lng, activeCase.slick.coordinates[0].lat]
      : [2.100, 56.400]; // Default North Sea

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleSpec('satellite', 'globe'),
      center: initialCenter,
      zoom: 11.5,
      pitch: 55,
      bearing: -15,
      antialias: true,
      attributionControl: false,
      maxPitch: 85,
      dragRotate: true,
      touchPitch: true,
      pitchWithRotate: true,
      dragPan: true,
      renderWorldCopies: true
    });

    const applyProjectionAndSky = () => {
      if (typeof map.setProjection === 'function') {
        map.setProjection({ type: projection });
      }
      if (typeof map.setSky === 'function') {
        if (projection === 'globe') {
          map.setSky({
            'sky-color': '#030712',
            'sky-horizon-blend': 0.8,
            'horizon-color': '#0c1b38',
            'horizon-fog-blend': 0.85,
            'fog-color': '#001428',
            'fog-ground-blend': 0.9,
            'atmosphere-blend': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.95,
              3, 0.85,
              6, 0.3,
              9, 0.0
            ]
          });
        } else {
          map.setSky(undefined);
        }
      }
    };

    map.on('style.load', applyProjectionAndSky);

    // Event listener for pitch, bearing, and zoom sync
    map.on('pitch', () => {
      setPitch(Math.round(map.getPitch()));
      setIs3D(map.getPitch() > 10);
    });

    map.on('rotate', () => {
      setBearing(Math.round(map.getBearing()));
    });

    map.on('zoom', () => {
      setZoomLevel(Math.round(map.getZoom() * 10) / 10);
    });

    mapInstanceRef.current = map;

    return () => {
      clearMarkers();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Map Style Switch
  const prevMapStyleRef = React.useRef(mapStyle);
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (prevMapStyleRef.current === mapStyle) return;
    prevMapStyleRef.current = mapStyle;

    map.setStyle(getStyleSpec(mapStyle, projection));

    // Re-trigger layer draw once style loads
    const onStyleLoad = () => {
      try {
        if (typeof map.setProjection === 'function') {
          map.setProjection({ type: projection });
        }
        if (typeof map.setSky === 'function' && projection === 'globe') {
          map.setSky({
            'sky-color': '#030712',
            'sky-horizon-blend': 0.8,
            'horizon-color': '#0c1b38',
            'horizon-fog-blend': 0.85,
            'fog-color': '#001428',
            'fog-ground-blend': 0.9,
            'atmosphere-blend': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.95,
              3, 0.85,
              6, 0.3,
              9, 0.0
            ]
          });
        }
      } catch (err) {
        console.warn('onStyleLoad projection:', err);
      }
      drawAllLayers();
    };

    map.once('style.load', onStyleLoad);
  }, [mapStyle]);

  // Helper: Interpolate vessel position
  const getInterpolatedPosition = (path, progress) => {
    if (!path || path.length === 0) return null;
    if (path.length === 1 || progress <= 0) return path[0];
    if (progress >= 1) return path[path.length - 1];

    const indexFloat = progress * (path.length - 1);
    const idx1 = Math.floor(indexFloat);
    const idx2 = Math.min(idx1 + 1, path.length - 1);
    const factor = indexFloat - idx1;

    const p1 = path[idx1];
    const p2 = path[idx2];

    return {
      lat: p1.lat + (p2.lat - p1.lat) * factor,
      lng: p1.lng + (p2.lng - p1.lng) * factor,
      heading_deg: p1.heading_deg || 0,
      speed_knots: p1.speed_knots || 0,
      ais_active: p1.ais_active !== undefined ? p1.ais_active : true
    };
  };

  // 3. Draw All 3D Vector & Telemetry Layers
  const drawAllLayers = (options = {}) => {
    const { forceFitBounds = false } = options;
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Only fit bounds if explicitly requested, or if case ID / map mode changed
    const currentCaseId = activeCase?.case_id || null;
    const caseChanged = currentCaseId !== prevCaseIdRef.current;
    const mapModeChanged = mapMode !== prevMapModeRef.current;
    const shouldFit = forceFitBounds || caseChanged || mapModeChanged;

    prevCaseIdRef.current = currentCaseId;
    prevMapModeRef.current = mapMode;

    clearMarkers();

    // Remove existing dynamically added sources & layers
    const dynamicLayerIds = [
      'global-slick-extrusion', 'global-slick-lines',
      'single-slick-extrusion', 'single-slick-glow',
      'forecast-extrusion', 'forecast-lines',
      'origin-decay-0', 'origin-decay-1', 'origin-decay-2',
      'vessel-track-lines', 'dark-vessel-track-lines',
      'response-route-line', 'response-hazard-lines',
      'eco-zone-extrusions'
    ];

    dynamicLayerIds.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    const dynamicSourceIds = [
      'global-slick-src', 'single-slick-src', 'forecast-src',
      'origin-decay-0-src', 'origin-decay-1-src', 'origin-decay-2-src',
      'vessel-tracks-src', 'dark-vessels-src',
      'response-route-src', 'response-hazards-src',
      'eco-zones-src'
    ];

    dynamicSourceIds.forEach(id => {
      if (map.getSource(id)) map.removeSource(id);
    });

    const bounds = new maplibregl.LngLatBounds();

    // --- MODE A: GLOBAL OVERVIEW MODE ---
    if (mapMode === 'global') {
      if (allCases.length === 0) return;

      const slickFeatures = [];
      allCases.forEach(c => {
        if (!c.slick) return;
        const coords = c.slick.coordinates.map(pt => [pt.lng, pt.lat]);
        if (coords.length > 0) {
          coords.push(coords[0]); // Close ring
          coords.forEach(pt => bounds.extend(pt));

          const tierColor = c.confidence_tier === 'High' ? '#EF4444' : c.confidence_tier === 'Medium' ? '#F59E0B' : '#06B6D4';
          const volumeHeight = Math.max(40, (c.slick.estimated_volume_m3 || 100) * 0.5);

          slickFeatures.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {
              caseId: c.case_id,
              name: c.name,
              color: tierColor,
              height: volumeHeight,
              confidence: c.confidence_tier,
              location: c.location_name
            }
          });

          // HTML Marker Cluster for Case in 3D
          const centerLng = coords.reduce((sum, p) => sum + p[0], 0) / (coords.length - 1);
          const centerLat = coords.reduce((sum, p) => sum + p[1], 0) / (coords.length - 1);

          const el = document.createElement('div');
          el.className = 'global-spill-3d-marker';
          el.innerHTML = `
            <div style="background: ${tierColor}; color: #FFF; font-family: JetBrains Mono, monospace; font-size: 11px; font-weight: bold; padding: 5px 10px; border-radius: 20px; border: 2px solid #FFF; box-shadow: 0 0 20px ${tierColor}; display: flex; align-items: center; gap: 6px; cursor: pointer; transform: translateZ(30px)">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #FFF" class="animate-ping"></span>
              <span>[${c.case_id}] ${c.name}</span>
            </div>
          `;

          el.onclick = () => {
            if (onSelectCase) onSelectCase(c.case_id);
            if (setMapMode) setMapMode('single');
          };

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([centerLng, centerLat])
            .addTo(map);

          markersRef.current.push(marker);
        }
      });

      if (slickFeatures.length > 0) {
        map.addSource('global-slick-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: slickFeatures }
        });

        // 3D Extrusion
        map.addLayer({
          id: 'global-slick-extrusion',
          type: 'fill-extrusion',
          source: 'global-slick-src',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75
          }
        });
      }

      if (shouldFit && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 100, pitch: 45, maxZoom: 8.5, duration: 1200 });
      }
      return;
    }

    // --- MODE B: SINGLE CASE DASHBOARD MODE ---
    if (!activeCase) return;

    // 1. Confirmed Slick 3D Volume Layer
    if (layersConfig.slick && activeCase.slick && activeCase.slick.coordinates) {
      const coords = activeCase.slick.coordinates.map(pt => [pt.lng, pt.lat]);
      if (coords.length > 0) {
        coords.push(coords[0]); // Close polygon
        coords.forEach(pt => bounds.extend(pt));

        const estVol = activeCase.slick.estimated_volume_m3 || 120;
        const estThick = activeCase.slick.estimated_thickness_um || 250;
        // 3D Extrusion Height & Rheology Shading:
        // Thick oil (>200 µm) renders as a deep viscous red-black mass with high vertical profile.
        // Thin sheen (<50 µm) renders as a low-relief iridescent amber film.
        const thicknessFactor = estThick > 200 ? 1.4 : estThick < 50 ? 0.45 : 1.0;
        const volumeHeightMeters = Math.max(30, (estVol * 0.65) * thicknessFactor);
        const slickColor = highlightedLegendKey === 'slick'
          ? '#EF4444'
          : estThick > 200
            ? '#7F1D1D'
            : estThick < 50
              ? '#D97706'
              : '#DC2626';
        const slickOpacity = getLayerOpacity('slick', estThick > 200 ? 0.85 : estThick < 50 ? 0.48 : 0.70);
        const glowColor = estThick > 200 ? '#EF4444' : estThick < 50 ? '#F59E0B' : '#EF4444';

        map.addSource('single-slick-src', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] },
                properties: {
                  height: volumeHeightMeters,
                  thickness: estThick,
                  category: activeCase.slick.thickness_category || 'Oil Slick Layer'
                }
              }
            ]
          }
        });

        // 3D Extrusion Layer (Thickness-Modulated)
        map.addLayer({
          id: 'single-slick-extrusion',
          type: 'fill-extrusion',
          source: 'single-slick-src',
          paint: {
            'fill-extrusion-color': slickColor,
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': slickOpacity
          }
        });

        // Glow boundary line
        map.addLayer({
          id: 'single-slick-glow',
          type: 'line',
          source: 'single-slick-src',
          paint: {
            'line-color': glowColor,
            'line-width': highlightedLegendKey === 'slick' ? 6 : 3.5,
            'line-opacity': getLayerOpacity('slick', 1.0),
            'line-dasharray': [2, 2]
          }
        });
      }
    }

    // 2. Forward Spread Forecast 3D Layer
    if (layersConfig.forwardForecast && forecast && forecast.projected_polygons && forwardOffset > 0) {
      const matchProj = forecast.projected_polygons.find(p => p.time_offset_hours === forwardOffset);
      if (matchProj && matchProj.polygon) {
        const fwdCoords = matchProj.polygon.map(pt => [pt.lng, pt.lat]);
        if (fwdCoords.length > 0) {
          fwdCoords.push(fwdCoords[0]);
          fwdCoords.forEach(pt => bounds.extend(pt));

          map.addSource('forecast-src', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [fwdCoords] }
            }
          });

          map.addLayer({
            id: 'forecast-extrusion',
            type: 'fill-extrusion',
            source: 'forecast-src',
            paint: {
              'fill-extrusion-color': '#8B5CF6',
              'fill-extrusion-height': 45,
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': getLayerOpacity('forecast', 0.45)
            }
          });

          map.addLayer({
            id: 'forecast-lines',
            type: 'line',
            source: 'forecast-src',
            paint: {
              'line-color': '#A855F7',
              'line-width': highlightedLegendKey === 'forecast' ? 5 : 3,
              'line-opacity': getLayerOpacity('forecast', 1.0),
              'line-dasharray': [3, 3]
            }
          });
        }
      }
    }

    // 3. Probable Origin 3D Backtrack Decay Polygons
    if (layersConfig.originZone && activeCase.origin_zone && activeCase.origin_zone.decay_polygons) {
      const decayPolys = activeCase.origin_zone.decay_polygons;
      const colors = ['#7F1D1D', '#991B1B', '#B45309'];
      const heights = [35, 22, 12];

      decayPolys.forEach((polyCoords, idx) => {
        const ring = polyCoords.map(pt => [pt.lng, pt.lat]);
        if (ring.length > 0) {
          ring.push(ring[0]);
          ring.forEach(pt => bounds.extend(pt));

          const srcId = `origin-decay-${idx}-src`;
          const layerId = `origin-decay-${idx}`;

          map.addSource(srcId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [ring] }
            }
          });

          map.addLayer({
            id: layerId,
            type: 'fill-extrusion',
            source: srcId,
            paint: {
              'fill-extrusion-color': colors[idx] || '#B45309',
              'fill-extrusion-height': heights[idx] || 15,
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': getLayerOpacity('origin', 0.4)
            }
          });
        }
      });
    }

    // 4. Vessel Tracks & 3D Vessel Indicators
    if (layersConfig.vesselTracks && activeCase.vessels) {
      const trackFeatures = [];

      activeCase.vessels.forEach(vessel => {
        const isSelected = selectedVesselId === vessel.vessel_id;
        const suspectInfo = activeCase.suspects?.find(s => s.vessel_id === vessel.vessel_id);
        const tier = suspectInfo?.scorecard?.confidence_tier || 'low';
        const trackColor = tier === 'high' ? '#EF4444' : tier === 'medium' ? '#F59E0B' : '#06B6D4';

        const pathCoords = vessel.path.map(p => [p.lng, p.lat]);
        pathCoords.forEach(pt => bounds.extend(pt));

        trackFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: pathCoords },
          properties: {
            color: trackColor,
            width: isSelected ? 4.5 : 2.5
          }
        });

        // Dynamic Position Indicator Marker
        const currPos = getInterpolatedPosition(vessel.path, timelineProgress);
        if (currPos) {
          const el = document.createElement('div');
          el.className = 'custom-vessel-3d-marker';
          if (highlightedLegendKey && highlightedLegendKey !== 'suspectVessels') {
            el.style.opacity = '0.2';
          }
          const rotationStr = `transform: rotate(${currPos.heading_deg}deg);`;

          el.innerHTML = `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <!-- 3D Directional Hull Pointer -->
              <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 20px solid ${trackColor}; filter: drop-shadow(0 0 8px ${trackColor}); ${rotationStr} transition: transform 0.3s ease-out;"></div>
              ${isSelected ? `<div style="position: absolute; width: 36px; height: 36px; border: 2px solid ${trackColor}; border-radius: 50%; animation: ping 1.5s infinite;"></div>` : ''}
            </div>
          `;

          el.onclick = () => onSelectVessel(vessel.vessel_id);

          const popupHtml = `
            <div style="font-family: Inter, sans-serif; font-size: 12px; color: #F3F4F6;">
              <strong style="color: ${trackColor}; font-size: 13px;">${vessel.name}</strong> (${vessel.flag})<br/>
              <span style="color: #9CA3AF; font-size: 11px;">Type: ${vessel.vessel_type}</span><br/>
              <span style="color: #9CA3AF; font-size: 11px;">Speed: <b>${currPos.speed_knots} kts</b> | Heading: <b>${currPos.heading_deg}°</b></span><br/>
              ${currPos.ais_active === false ? '<span style="color: #EF4444; font-weight: bold; font-size: 10px;">⚠ AIS TRANSPONDER SILENT</span>' : '<span style="color:#10B981; font-size:10px;">✓ AIS Operational</span>'}
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([currPos.lng, currPos.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        }
      });

      if (trackFeatures.length > 0) {
        map.addSource('vessel-tracks-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: trackFeatures }
        });

        map.addLayer({
          id: 'vessel-track-lines',
          type: 'line',
          source: 'vessel-tracks-src',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-opacity': getLayerOpacity('suspectVessels', 0.9)
          }
        });
      }
    }

    // 5. Dark Vessel Radar Targets
    if (layersConfig.darkVessels && activeCase.dark_vessels) {
      const darkFeatures = [];

      activeCase.dark_vessels.forEach(dv => {
        const isSelected = selectedVesselId === dv.id;
        const dvPos = dv.track_reconstruction
          ? getInterpolatedPosition(dv.track_reconstruction, timelineProgress) || dv.detected_position
          : dv.detected_position;

        bounds.extend([dvPos.lng, dvPos.lat]);

        const el = document.createElement('div');
        el.className = 'custom-dark-vessel-3d-marker';
        if (highlightedLegendKey && highlightedLegendKey !== 'darkVessels') {
          el.style.opacity = '0.2';
        }
        el.innerHTML = `
          <div class="dark-vessel-pulse-icon">
            <div class="pulse-ring"></div>
            <div class="pulse-ring-outer"></div>
            <div class="dark-vessel-inner" style="${isSelected ? 'transform: rotate(45deg) scale(1.4); border-color:#F59E0B;' : ''}"></div>
          </div>
        `;

        el.onclick = () => onSelectVessel(dv.id);

        const popupHtml = `
          <div style="font-family: JetBrains Mono, monospace; font-size: 11px; color: #F87171;">
            <b style="color: #EF4444; font-size: 12px;">UNIDENTIFIED — DARK VESSEL</b><br/>
            Radar Target ID: <b>${dv.id}</b><br/>
            AIS Status: <span style="color: #EF4444; font-weight: bold;">NO AIS SIGNAL TRANSMITTED</span><br/>
            Est. Hull Length: ${dv.estimated_length_m}m<br/>
            Radar Cross Section: ${dv.radar_cross_section}
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([dvPos.lng, dvPos.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);

        if (dv.track_reconstruction) {
          const darkPath = dv.track_reconstruction.map(p => [p.lng, p.lat]);
          darkPath.forEach(pt => bounds.extend(pt));

          darkFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: darkPath },
            properties: { isSelected }
          });
        }
      });

      if (darkFeatures.length > 0) {
        map.addSource('dark-vessels-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: darkFeatures }
        });

        map.addLayer({
          id: 'dark-vessel-track-lines',
          type: 'line',
          source: 'dark-vessels-src',
          paint: {
            'line-color': '#EF4444',
            'line-width': highlightedLegendKey === 'darkVessels' ? 5 : 3,
            'line-dasharray': [2, 4],
            'line-opacity': getLayerOpacity('darkVessels', 0.95)
          }
        });
      }
    }

    // 6. Weather-Aware Response Route & Hazard Segments
    if (layersConfig.responseRoute && isRouteActive && routeData && routeData.route) {
      const routeCoords = routeData.route.map(pt => [pt.lng, pt.lat]);
      routeCoords.forEach(pt => bounds.extend(pt));

      map.addSource('response-route-src', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: routeCoords }
        }
      });

      map.addLayer({
        id: 'response-route-line',
        type: 'line',
        source: 'response-route-src',
        paint: {
          'line-color': '#00F0FF',
          'line-width': highlightedLegendKey === 'responseRoute' ? 6 : 4.5,
          'line-dasharray': [3, 3],
          'line-opacity': getLayerOpacity('responseRoute', 0.95)
        }
      });

      // Response Base HTML Marker
      if (routeData.starting_base && routeData.starting_base.location) {
        const baseLoc = routeData.starting_base.location;
        const el = document.createElement('div');
        el.className = 'response-base-3d-marker';
        if (highlightedLegendKey && highlightedLegendKey !== 'responseRoute') {
          el.style.opacity = '0.2';
        }
        el.innerHTML = `
          <div style="background: #0F172A; color: #00F0FF; border: 2px solid #00F0FF; border-radius: 8px; padding: 4px 8px; font-family: JetBrains Mono, monospace; font-size: 11px; font-weight: bold; box-shadow: 0 0 15px rgba(0, 240, 255, 0.7); cursor: pointer;">
            ⚓ ${routeData.starting_base.name.split(' ')[0]} Base
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([baseLoc.lng, baseLoc.lat])
          .addTo(map);

        markersRef.current.push(marker);
      }
    }

    // 7. Eco Sensitivity Zones (MPAs, Coral Reefs)
    if (layersConfig.environmentalZones && environmentalData && environmentalData.zones) {
      const ecoFeatures = [];

      environmentalData.zones.forEach(zone => {
        const coords = zone.coordinates.map(pt => [pt.lng, pt.lat]);
        if (coords.length > 0) {
          coords.push(coords[0]);
          coords.forEach(pt => bounds.extend(pt));

          const color = zone.intersects_spill ? '#10B981' : '#059669';
          ecoFeatures.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {
              name: zone.name,
              color: color,
              height: zone.intersects_spill ? 30 : 15
            }
          });
        }
      });

      if (ecoFeatures.length > 0) {
        map.addSource('eco-zones-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: ecoFeatures }
        });

        map.addLayer({
          id: 'eco-zone-extrusions',
          type: 'fill-extrusion',
          source: 'eco-zones-src',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': getLayerOpacity('ecoZones', 0.35)
          }
        });
      }
    }

    // Auto-fit 3D Camera view bounds (only on case/mode change or when explicitly requested)
    if (shouldFit && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 380 },
        pitch: is3D ? 55 : 0,
        bearing: bearing,
        maxZoom: 13,
        duration: 1000
      });
    }
  };

  // 4. Re-draw layers whenever states update
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      drawAllLayers();
    } else {
      map.once('style.load', drawAllLayers);
    }
  }, [
    activeCase, allCases, mapMode, layersConfig, selectedVesselId,
    timelineProgress, forecast, forwardOffset, routeData, isRouteActive, environmentalData,
    highlightedLegendKey
  ]);

  // Camera & Projection Action Handlers
  const handleToggleProjection = () => {
    const nextProj = projection === 'globe' ? 'mercator' : 'globe';
    setProjection(nextProj);
  };

  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const newPitch = is3D ? 0 : 55;
    map.easeTo({ pitch: newPitch, duration: 800 });
    setIs3D(!is3D);
    setPitch(newPitch);
  };

  const handlePitchChange = (newPitch) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ pitch: newPitch, duration: 400 });
    setPitch(newPitch);
    setIs3D(newPitch > 10);
  };

  const handleRotate = (angleDelta) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const newBearing = (map.getBearing() + angleDelta) % 360;
    map.easeTo({ bearing: newBearing, duration: 400 });
    setBearing(Math.round(newBearing));
  };

  const handleResetNorth = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 800 });
    setBearing(0);
  };

  const handleSetHeading = (targetBearing) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ bearing: targetBearing, duration: 400 });
    setBearing(Math.round(targetBearing));
  };

  const handleFlyToGlobe = (elevate = true) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (projection !== 'globe') setProjection('globe');
    setIsGlobeElevated(elevate);

    const targetLng = activeCase?.slick?.coordinates?.[0]?.lng || 2.1;
    // When elevated up, center latitude is slightly south (10° N) and padding bottom lifts the globe ~160px
    // above the bottom timeline and navigation HUD, positioning the full globe higher up in the open viewport
    map.flyTo({
      center: [targetLng, elevate ? 10.0 : 25.0],
      zoom: 1.85,
      pitch: 22,
      bearing: 0,
      padding: elevate
        ? { top: 20, bottom: 160, left: 20, right: 20 }
        : { top: 30, bottom: 30, left: 20, right: 20 },
      duration: 1400,
      essential: true
    });
  };

  const handleMoveGlobe = (direction) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const step = 95; // pixels
    if (direction === 'up') {
      // Panning camera down moves the globe UP on the screen
      map.panBy([0, step], { duration: 250 });
    } else if (direction === 'down') {
      // Panning camera up moves the globe DOWN on the screen
      map.panBy([0, -step], { duration: 250 });
    } else if (direction === 'left') {
      map.panBy([step, 0], { duration: 250 });
    } else if (direction === 'right') {
      map.panBy([-step, 0], { duration: 250 });
    }
  };

  const handleSpinGlobe = (deltaLng) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const center = map.getCenter();
    const newLng = ((center.lng + deltaLng + 180) % 360) - 180;
    map.easeTo({
      center: [newLng, center.lat],
      duration: 350
    });
  };

  const handleToggleElevateGlobe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next = !isGlobeElevated;
    setIsGlobeElevated(next);
    if (next) {
      // Shift globe UP by 130 pixels
      map.panBy([0, 130], { duration: 350 });
    } else {
      // Lower globe DOWN by 130 pixels
      map.panBy([0, -130], { duration: 350 });
    }
  };

  const handleFlyToIncident = () => {
    drawAllLayers({ forceFitBounds: true });
  };

  const handleFullMapView = () => {
    setProjection('mercator');
    setIsNavCollapsed(true);
    setTimeout(() => {
      drawAllLayers({ forceFitBounds: true });
    }, 80);
  };

  const getCompassHeadingText = (b) => {
    const normalized = (b % 360 + 360) % 360;
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(normalized / 22.5) % 16;
    return `${Math.round(normalized)}° ${directions[index]}`;
  };

  // Effect: Sync Projection changes dynamically
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const applyProj = () => {
      try {
        if (typeof map.setProjection === 'function') {
          map.setProjection({ type: projection });
        }
        if (typeof map.setSky === 'function') {
          if (projection === 'globe') {
            map.setSky({
              'sky-color': '#030712',
              'sky-horizon-blend': 0.8,
              'horizon-color': '#0c1b38',
              'horizon-fog-blend': 0.85,
              'fog-color': '#001428',
              'fog-ground-blend': 0.9,
              'atmosphere-blend': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 0.95,
                3, 0.85,
                6, 0.3,
                9, 0.0
              ]
            });
          } else {
            map.setSky(undefined);
          }
        }
      } catch (err) {
        console.warn('Projection update waiting for style load:', err);
      }
    };

    if (map.isStyleLoaded()) {
      applyProj();
    } else {
      map.once('style.load', applyProj);
    }
  }, [projection]);

  // Effect: Free 3D Globe Drag & Rotate (Intuitive Mouse Interaction)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startCenter = null;
    let startBearing = 0;
    let startPitch = 0;
    let isRotateDrag = false;

    const handlePointerDown = (e) => {
      // Ignore clicks on buttons, inputs, links, or markers
      if (e.target.closest('button, input, select, a, .global-spill-3d-marker, .custom-vessel-3d-marker, .custom-dark-vessel-3d-marker, .response-base-3d-marker')) {
        return;
      }

      if (e.button !== 0 && e.button !== 2) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startCenter = map.getCenter();
      startBearing = map.getBearing();
      startPitch = map.getPitch();

      // Right-click or Ctrl/Alt click is camera angle tilt & bearing rotate
      isRotateDrag = e.button === 2 || e.ctrlKey || e.altKey;

      if (!isRotateDrag && (projection === 'globe' || isOrbitMode)) {
        map.dragPan.disable();
      }

      container.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const handlePointerMove = (e) => {
      if (!isDragging || !startCenter) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (isRotateDrag) {
        // Camera perspective rotation (bearing & pitch)
        const newBearing = (startBearing + deltaX * 0.45) % 360;
        const newPitch = Math.max(0, Math.min(85, startPitch - deltaY * 0.35));
        map.jumpTo({
          bearing: newBearing,
          pitch: newPitch
        });
        setBearing(Math.round(newBearing));
        setPitch(Math.round(newPitch));
      } else if (projection === 'globe' || isOrbitMode) {
        // Planetary Sphere Drag: Rotate Earth longitude & move latitude
        const zoom = map.getZoom();
        const pxSensitivity = 360 / (512 * Math.pow(2, zoom));
        const newLng = ((startCenter.lng - deltaX * pxSensitivity * 1.35 + 180) % 360) - 180;
        const newLat = Math.max(-84, Math.min(84, startCenter.lat + deltaY * pxSensitivity * 1.35));

        map.jumpTo({
          center: [newLng, newLat]
        });
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = (projection === 'globe' || isOrbitMode) ? 'grab' : '';
        if (map && !map.dragPan.isEnabled()) {
          map.dragPan.enable();
        }
      }
    };

    const handleContextMenu = (e) => {
      if (isDragging && isRotateDrag) {
        e.preventDefault();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('contextmenu', handleContextMenu);
      if (map) map.dragPan.enable();
      if (container) container.style.cursor = '';
    };
  }, [projection, isOrbitMode]);

  // Effect: Continuous Earth Planetary Auto-Spin (rotates Earth's longitude axis)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isAutoRotating) return;

    let animId;
    let lastTime = performance.now();

    const spinStep = (now) => {
      const delta = now - lastTime;
      lastTime = now;
      if (delta > 0 && delta < 200) {
        const center = map.getCenter();
        // Rotate longitude eastward smoothly (8 degrees per second * spinSpeed)
        const nextLng = ((center.lng - (delta / 1000) * 8 * spinSpeed + 180) % 360) - 180;
        map.jumpTo({ center: [nextLng, center.lat] });
      }
      animId = requestAnimationFrame(spinStep);
    };

    animId = requestAnimationFrame(spinStep);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isAutoRotating, spinSpeed]);

  return (
    <div className={`relative w-full h-full bg-[#050811] overflow-hidden select-none globe-space-canvas ${isOrbitMode ? 'cursor-orbit-ready' : ''}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Deep Space Starfield & Atmosphere Glow for Globe Mode */}
      {projection === 'globe' && (
        <div className="space-starfield pointer-events-none" />
      )}
      {projection === 'globe' && (
        <div className="globe-atmosphere-glow pointer-events-none" />
      )}

      {/* Top-Left Mode Indicator & Banner (Non-overlapping) */}
      {mapMode === 'global' && showGlobalBanner && (
        <div className="absolute top-3.5 left-4 z-20 bg-[#111726]/95 border border-[#26334D] px-3.5 py-2 rounded-xl backdrop-blur-md font-mono text-xs text-gray-200 flex items-center space-x-3 shadow-xl max-w-sm animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0"></span>
          <div className="flex-1 min-w-0">
            <strong className="block text-cyan-300">GLOBAL MULTI-SPILL 3D OVERVIEW</strong>
            <span className="block text-[10px] text-gray-400 font-sans truncate">
              3D volumetric rendering of SAR passes. Click a cluster to inspect.
            </span>
          </div>
          <button
            onClick={() => setShowGlobalBanner(false)}
            className="text-gray-400 hover:text-white text-sm leading-none cursor-pointer shrink-0 p-1"
            title="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {mapMode === 'single' && activeCase && !isCleanMapMode && (
        <div className="absolute top-3.5 left-4 z-10 bg-[#111726]/90 border border-[#26334D] px-3 py-1.5 rounded-xl backdrop-blur-md font-mono text-xs text-gray-300 flex items-center space-x-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-[11px] font-bold text-gray-100">[{activeCase.case_id}]</span>
          <span className="text-[11px] text-gray-400 hidden sm:inline max-w-[160px] truncate">{activeCase.name}</span>
        </div>
      )}

      {/* Top-Right HUD Control Cluster: Map Style, Overlays, View Toggles */}
      <div className="absolute top-3.5 right-4 z-20 flex items-center space-x-2">
        {/* One-Click 3D Globe vs Flat Map Toggle */}
        <button
          onClick={() => {
            if (projection === 'globe') {
              handleFullMapView();
            } else {
              handleFlyToGlobe(true);
            }
          }}
          className={`flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-mono shadow-xl backdrop-blur-md transition-all cursor-pointer ${
            projection === 'globe'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
              : 'bg-[#111726]/90 border-[#26334D] hover:border-cyan-500/60 text-gray-200'
          }`}
          title={projection === 'globe' ? "Switch to Flat Satellite Map view" : "Switch to 3D Earth Globe view"}
        >
          <span>{projection === 'globe' ? '🌍' : '🗺️'}</span>
          <span>{projection === 'globe' ? '3D Globe' : 'Flat Map'}</span>
        </button>

        {/* Clean Map Mode Toggle */}
        <button
          onClick={() => setIsCleanMapMode(!isCleanMapMode)}
          className={`flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-mono shadow-xl backdrop-blur-md transition-all cursor-pointer ${
            isCleanMapMode
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
              : 'bg-[#111726]/90 border-[#26334D] hover:border-cyan-500/60 text-gray-200'
          }`}
          title={isCleanMapMode ? "Restore HUD navigation tools & legend" : "Clean View: hide HUD overlays for unobstructed map view"}
        >
          <span>{isCleanMapMode ? '👁️' : '🧹'}</span>
          <span>{isCleanMapMode ? 'Restore HUD' : 'Clean View'}</span>
        </button>

        {/* Style Selector Widget */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStyleWidget(!showStyleWidget);
              if (showLayerWidget) setShowLayerWidget(false);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-[#111726]/90 border border-[#26334D] hover:border-cyan-500/60 rounded-xl text-xs font-mono text-gray-200 shadow-xl backdrop-blur-md transition-all cursor-pointer"
          >
            <span className="text-sm">🌍</span>
            <span className="capitalize">{mapStyle === 'satellite' ? 'Photorealistic 3D' : mapStyle === 'dark-satellite' ? 'Dark Tactical 3D' : 'Ocean Bathymetry'}</span>
          </button>

          {showStyleWidget && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111726]/95 border border-[#26334D] rounded-xl p-2 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 z-30">
              <div className="text-[10px] uppercase text-gray-500 font-semibold px-2 py-1 border-b border-[#26334D]">
                Base Map Engine
              </div>
              <button
                onClick={() => { setMapStyle('satellite'); setShowStyleWidget(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer ${mapStyle === 'satellite' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-gray-300 hover:bg-gray-800/60'}`}
              >
                <span>🌍 Esri HD Satellite 3D</span>
                {mapStyle === 'satellite' && <span>✓</span>}
              </button>

              <button
                onClick={() => { setMapStyle('dark-satellite'); setShowStyleWidget(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer ${mapStyle === 'dark-satellite' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-gray-300 hover:bg-gray-800/60'}`}
              >
                <span>🛰️ Dark Tactical 3D</span>
                {mapStyle === 'dark-satellite' && <span>✓</span>}
              </button>

              <button
                onClick={() => { setMapStyle('ocean-topo'); setShowStyleWidget(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer ${mapStyle === 'ocean-topo' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-gray-300 hover:bg-gray-800/60'}`}
              >
                <span>🌊 Ocean Bathymetry</span>
                {mapStyle === 'ocean-topo' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Layers Control Toggle Widget */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayerWidget(!showLayerWidget);
              if (showStyleWidget) setShowStyleWidget(false);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-[#111726]/90 border border-[#26334D] hover:border-cyan-500/60 rounded-xl text-xs font-mono text-gray-200 shadow-xl backdrop-blur-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Overlays</span>
          </button>

          {showLayerWidget && (
            <div className="absolute right-0 mt-2 w-64 bg-[#111726]/95 border border-[#26334D] rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-2.5 z-30">
              <div className="flex items-center justify-between text-[10px] uppercase text-gray-500 font-semibold border-b border-[#26334D] pb-1.5">
                <span>Toggle 3D Layers & Lines</span>
                <div className="space-x-2 font-mono">
                  <button
                    onClick={() => setLayersConfig({
                      slick: false,
                      originZone: false,
                      vesselTracks: false,
                      darkVessels: false,
                      forwardForecast: false,
                      responseRoute: false,
                      environmentalZones: false
                    })}
                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Hide All
                  </button>
                  <button
                    onClick={() => setLayersConfig({
                      slick: true,
                      originZone: true,
                      vesselTracks: true,
                      darkVessels: true,
                      forwardForecast: true,
                      responseRoute: true,
                      environmentalZones: true
                    })}
                    className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Show All
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span>
                  <span>Confirmed 3D Slick</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.slick}
                  onChange={(e) => setLayersConfig({ ...layersConfig, slick: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500 border border-dashed border-white inline-block"></span>
                  <span>3D Forecast Spread</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.forwardForecast}
                  onChange={(e) => setLayersConfig({ ...layersConfig, forwardForecast: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-dashed inline-block"></span>
                  <span>Eco Sensitivity 3D</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.environmentalZones}
                  onChange={(e) => setLayersConfig({ ...layersConfig, environmentalZones: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                  <span>Origin Backtrack 3D</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.originZone}
                  onChange={(e) => setLayersConfig({ ...layersConfig, originZone: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block"></span>
                  <span>Vessel Tracks</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.vesselTracks}
                  onChange={(e) => setLayersConfig({ ...layersConfig, vesselTracks: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-400 border border-white inline-block"></span>
                  <span>Dark Vessels</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.darkVessels}
                  onChange={(e) => setLayersConfig({ ...layersConfig, darkVessels: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-gray-300 hover:text-white cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-300 border border-dashed inline-block"></span>
                  <span>Response Route</span>
                </span>
                <input
                  type="checkbox"
                  checked={layersConfig.responseRoute}
                  onChange={(e) => setLayersConfig({ ...layersConfig, responseRoute: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Floating 3D Navigation Controls HUD (Bottom Left) */}
      {!isCleanMapMode && (
        <div className="absolute bottom-6 left-6 z-20 flex flex-col space-y-2 select-none font-mono">
          {isNavCollapsed ? (
            /* Minimized Sleek Pill Button */
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-[#111726]/95 border border-[#26334D] hover:border-cyan-500/60 rounded-xl text-xs text-gray-200 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
              title="Expand Camera & Navigation Controls"
            >
              <span className="text-cyan-400 text-sm">🧭</span>
              <span className="font-bold">MAP CONTROLS</span>
              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          ) : (
            <div className="flex flex-col space-y-2 w-[370px] bg-[#111726]/95 border border-[#26334D] p-3 rounded-2xl backdrop-blur-md shadow-2xl animate-fadeIn text-xs text-gray-200 font-mono select-none">
              {/* Header with Title and Minimize Button */}
              <div className="flex items-center justify-between border-b border-[#26334D] pb-1.5 text-xs text-gray-300">
                <span className="flex items-center space-x-2 text-[11px] font-bold text-gray-200">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>CAMERA & GLOBE CONTROLS</span>
                </span>
                <button
                  onClick={() => setIsNavCollapsed(true)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] transition-all cursor-pointer"
                  title="Minimize controls panel"
                >
                  <span>Minimize</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Row 1: 3D Globe / Flat Map Toggle, Lift Up, and Focus */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {/* 3D Globe vs Flat Map Toggle */}
                <div className="flex items-center bg-[#090D16] p-0.5 rounded-xl border border-[#26334D]">
                  <button
                    onClick={() => handleFlyToGlobe(true)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      projection === 'globe'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="3D Spherical Round Earth Globe (Elevated view)"
                  >
                    <span>🌍</span>
                    <span>GLOBE</span>
                  </button>
                  <button
                    onClick={() => {
                      setProjection('mercator');
                      drawAllLayers({ forceFitBounds: true });
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      projection === 'mercator'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Flat Edge-to-Edge Map View"
                  >
                    <span>🗺️</span>
                    <span>FLAT</span>
                  </button>
                </div>

                {/* Direct Lift Up / Lower Globe Toggle */}
                <button
                  onClick={handleToggleElevateGlobe}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                    isGlobeElevated
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                      : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:text-white'
                  }`}
                  title="Lift Globe Up to position it higher on screen above panels"
                >
                  <span>{isGlobeElevated ? '⬆' : '⬇'}</span>
                  <span>{isGlobeElevated ? 'LIFTED UP' : 'LOWER'}</span>
                </button>

                {/* Focus Active Incident Spill Button */}
                <button
                  onClick={handleFlyToIncident}
                  className="flex items-center space-x-1 px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  title="Focus camera directly on the active oil slick investigation in 3D"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>FOCUS</span>
                </button>
              </div>

              {/* Row 2: 4-Way Move D-Pad, Longitude Spin & Auto-Spin */}
              <div className="flex items-center justify-between gap-1.5 bg-[#0e1424] p-1.5 rounded-xl border border-[#26334D]/70">
                {/* 4-Way Move D-Pad */}
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase pr-0.5">Move:</span>
                  <div className="flex items-center space-x-0.5">
                    <button onClick={() => handleMoveGlobe('up')} className="dpad-btn w-6 h-6 text-[10px]" title="Move Globe Up">▲</button>
                    <button onClick={() => handleMoveGlobe('down')} className="dpad-btn w-6 h-6 text-[10px]" title="Move Globe Down">▼</button>
                    <button onClick={() => handleMoveGlobe('left')} className="dpad-btn w-6 h-6 text-[10px]" title="Move Globe Left">◀</button>
                    <button onClick={() => handleMoveGlobe('right')} className="dpad-btn w-6 h-6 text-[10px]" title="Move Globe Right">▶</button>
                  </div>
                </div>

                {/* Spin Earth West / East */}
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handleSpinGlobe(-30)} className="dpad-btn px-1.5 h-6 text-[9px] font-bold" title="Spin Earth West (-30° longitude)">↺ W</button>
                  <button onClick={() => handleSpinGlobe(30)} className="dpad-btn px-1.5 h-6 text-[9px] font-bold" title="Spin Earth East (+30° longitude)">↻ E</button>
                </div>

                {/* Continuous Planetary Auto-Spin */}
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center space-x-1 px-2 h-6 rounded-lg text-[9px] font-bold transition-all cursor-pointer border ${
                    isAutoRotating
                      ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-sm animate-pulse'
                      : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                  title="Toggle continuous planetary auto-spin around Earth's polar axis"
                >
                  <span>🌐</span>
                  <span>{isAutoRotating ? 'SPINNING' : 'SPIN'}</span>
                </button>
              </div>

              {/* Row 3: Compass Dial, Cardinal Heading, Rotation & Pitch */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                {/* Compass Dial & Cardinal Heading */}
                <div className="flex items-center space-x-1.5">
                  <div
                    onClick={handleResetNorth}
                    className="compass-dial-container group shrink-0"
                    title="Compass: Click to reset North (0°)"
                  >
                    <div className="compass-needle" style={{ transform: `rotate(${-bearing}deg)` }} />
                    <div className="compass-needle-south" style={{ transform: `rotate(${-bearing}deg)` }} />
                    <span className="text-[7px] text-gray-500 font-bold absolute top-0.5">N</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-400 font-bold leading-none">
                      {getCompassHeadingText(bearing)}
                    </span>
                    <div className="flex items-center space-x-0.5 mt-0.5">
                      <button onClick={() => handleSetHeading(0)} className={`px-1 py-0.2 rounded text-[8px] font-bold cursor-pointer ${bearing === 0 ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>N</button>
                      <button onClick={() => handleSetHeading(90)} className={`px-1 py-0.2 rounded text-[8px] font-bold cursor-pointer ${bearing === 90 ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>E</button>
                      <button onClick={() => handleSetHeading(180)} className={`px-1 py-0.2 rounded text-[8px] font-bold cursor-pointer ${bearing === 180 ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>S</button>
                      <button onClick={() => handleSetHeading(270)} className={`px-1 py-0.2 rounded text-[8px] font-bold cursor-pointer ${bearing === 270 ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>W</button>
                    </div>
                  </div>
                </div>

                {/* Step Rotation */}
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handleRotate(-45)} className="px-1.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-400 text-[9px] font-bold cursor-pointer" title="Rotate Left 45°">↺45°</button>
                  <button onClick={() => handleRotate(45)} className="px-1.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-400 text-[9px] font-bold cursor-pointer" title="Rotate Right 45°">↻45°</button>
                </div>

                {/* Tilt Pitch & 2D/3D */}
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handlePitchChange(Math.max(0, pitch - 15))} className="p-0.5 rounded hover:bg-gray-800 text-gray-300 text-[9px] cursor-pointer" title="Tilt Down">▼</button>
                  <span className="text-[9px] text-cyan-400 font-bold px-0.5">{pitch}°</span>
                  <button onClick={() => handlePitchChange(Math.min(85, pitch + 15))} className="p-0.5 rounded hover:bg-gray-800 text-gray-300 text-[9px] cursor-pointer" title="Tilt Up">▲</button>
                  <button onClick={() => handlePitchChange(0)} className={`px-1 py-0.5 rounded text-[8px] font-bold cursor-pointer ${pitch === 0 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>2D</button>
                  <button onClick={() => handlePitchChange(60)} className={`px-1 py-0.5 rounded text-[8px] font-bold cursor-pointer ${pitch >= 50 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>3D</button>
                </div>
              </div>
            </div>
      )}
    </div>
    )}

      {/* Map Color & Symbol Legend Overlay (Bottom-Right) */}
      {!isCleanMapMode && (
      <div className="absolute bottom-6 right-6 z-20 font-mono select-none">
        {isLegendCollapsed ? (
          <button
            onClick={() => setIsLegendCollapsed(false)}
            className="flex items-center space-x-2 px-3 py-2 bg-[#111726]/90 border border-[#26334D] hover:border-cyan-500/60 rounded-xl text-xs text-gray-200 shadow-2xl backdrop-blur-md transition-all cursor-pointer"
            title="Expand Map Symbol Legend"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold">MAP LEGEND</span>
            {highlightedLegendKey && (
              <span className="bg-cyan-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Focus Active</span>
            )}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-72 bg-[#111726]/95 border border-[#26334D] rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-3">
            {/* Header with reset and collapse buttons */}
            <div className="flex items-center justify-between border-b border-[#26334D] pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="font-bold text-gray-100 tracking-wider text-[11px] uppercase">Map Key & Legend</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {highlightedLegendKey && (
                  <button
                    onClick={() => handleSelectLegendKey(null)}
                    className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg text-[9px] font-bold transition-all cursor-pointer uppercase"
                    title="Reset focus filter"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsLegendCollapsed(true)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Collapse Legend"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Groups */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-[11px]">
              {/* Category 1: Oil Slick & Projections */}
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Oil Spill & Projections</div>
                
                {/* Slick item */}
                <div
                  onClick={() => handleSelectLegendKey('slick')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'slick'
                      ? 'bg-red-950/60 border-red-500 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-3 h-3 rounded bg-red-600 border border-red-400 shrink-0"></span>
                  <span className="flex-1">Confirmed Spill Slick</span>
                  {highlightedLegendKey === 'slick' && <span className="text-[9px] bg-red-600 text-white px-1 rounded">FOCUS</span>}
                </div>

                {/* Forecast item */}
                <div
                  onClick={() => handleSelectLegendKey('forecast')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'forecast'
                      ? 'bg-purple-950/60 border-purple-500 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-3 h-3 rounded bg-purple-600/70 border border-dashed border-purple-300 shrink-0"></span>
                  <span className="flex-1">Forward Spread <span className="text-[9px] text-purple-300 font-normal">(Forecast)</span></span>
                  {highlightedLegendKey === 'forecast' && <span className="text-[9px] bg-purple-600 text-white px-1 rounded">FOCUS</span>}
                </div>

                {/* Origin item */}
                <div
                  onClick={() => handleSelectLegendKey('origin')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'origin'
                      ? 'bg-amber-950/60 border-amber-500 text-white font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-3 h-3 rounded bg-amber-900/80 border border-amber-600 shrink-0"></span>
                  <span className="flex-1">Origin Backtrack Zone</span>
                  {highlightedLegendKey === 'origin' && <span className="text-[9px] bg-amber-600 text-white px-1 rounded">FOCUS</span>}
                </div>
              </div>

              {/* Category 2: Maritime Vessels */}
              <div className="space-y-1 pt-2 border-t border-[#26334D]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Vessels & Transponders</div>

                {/* Dark Vessels item */}
                <div
                  onClick={() => handleSelectLegendKey('darkVessels')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'darkVessels'
                      ? 'bg-red-950/60 border-red-500 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 border border-white animate-ping shrink-0" style={{ animationDuration: '2s' }}></div>
                  <span className="flex-1 text-red-300 font-bold">Dark Vessel Target <span className="text-[9px] text-red-400 font-mono font-normal">(AIS Off)</span></span>
                  {highlightedLegendKey === 'darkVessels' && <span className="text-[9px] bg-red-600 text-white px-1 rounded">FOCUS</span>}
                </div>

                {/* AIS Vessels item */}
                <div
                  onClick={() => handleSelectLegendKey('suspectVessels')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'suspectVessels'
                      ? 'bg-cyan-950/60 border-cyan-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[10px] border-b-cyan-400 shrink-0"></div>
                  <span className="flex-1">AIS Suspect Vessels & Tracks</span>
                  {highlightedLegendKey === 'suspectVessels' && <span className="text-[9px] bg-cyan-600 text-white px-1 rounded">FOCUS</span>}
                </div>
              </div>

              {/* Category 3: Response & Eco Protection */}
              <div className="space-y-1 pt-2 border-t border-[#26334D]">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Response & Environment</div>

                {/* Response Route item */}
                <div
                  onClick={() => handleSelectLegendKey('responseRoute')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'responseRoute'
                      ? 'bg-cyan-950/60 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-cyan-400 shrink-0"></span>
                  <span className="flex-1">Response Vessel Route</span>
                  {highlightedLegendKey === 'responseRoute' && <span className="text-[9px] bg-cyan-600 text-white px-1 rounded">FOCUS</span>}
                </div>

                {/* Eco Zones item */}
                <div
                  onClick={() => handleSelectLegendKey('ecoZones')}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    highlightedLegendKey === 'ecoZones'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : highlightedLegendKey
                      ? 'opacity-40 hover:opacity-100 border-transparent text-gray-400'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-400 shrink-0"></span>
                  <span className="flex-1">Eco Sensitive Zone <span className="text-[9px] text-emerald-400 font-normal">(MPA/Reef)</span></span>
                  {highlightedLegendKey === 'ecoZones' && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded">FOCUS</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
