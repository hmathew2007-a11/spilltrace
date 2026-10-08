/**
 * SpillTrace AI — Spread & Coastal Impact Forecast Component (Calibrated by Layer Thickness)
 */

window.ForecastTab = function ForecastTab({
  activeCase,
  forecast,
  forwardOffset,
  setForwardOffset,
  onOpenRoutePlanner,
  onUpdateThickness
}) {
  if (!forecast) {
    return (
      <div className="p-4 font-mono text-xs text-gray-400 text-center space-y-2">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Calculating hydrodynamic spread & coastal projections...</p>
      </div>
    );
  }

  const {
    estimated_spill_age,
    spread_rate_km2_per_hour,
    nearest_coastlines,
    detection_count,
    thickness_um,
    thickness_category,
    dispersion_behavior,
    evaporative_loss_pct
  } = forecast;

  const isMultiPass = detection_count > 1;
  const currentThickness = thickness_um || activeCase?.slick?.estimated_thickness_um || 250;

  const getThicknessBadgeStyle = (um) => {
    if (um < 50) return 'bg-cyan-950 text-cyan-400 border-cyan-800';
    if (um > 200) return 'bg-red-950 text-red-400 border-red-800';
    return 'bg-amber-950 text-amber-400 border-amber-800';
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-none">
      {/* 1. Forward Forecast Control Strip */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-purple-400 font-bold uppercase text-[11px]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Forward Spread Projection</span>
          </div>
          <span className="text-[10px] text-gray-400 font-sans">
            Offset: <strong className="text-purple-300">+{forwardOffset}h</strong>
          </span>
        </div>

        {/* Forward Time Selector Buttons */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {[0, 6, 12, 24, 48].map((hrs) => {
            const isActive = forwardOffset === hrs;
            return (
              <button
                key={hrs}
                onClick={() => setForwardOffset(hrs)}
                className={`py-1.5 rounded text-[11px] font-bold transition-all border ${
                  isActive
                    ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-[0_0_8px_rgba(139,92,246,0.4)]'
                    : 'bg-[#111726] text-gray-400 border-[#26334D] hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                +{hrs}h
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-500 font-sans italic pt-0.5">
          * Forward projections render as dashed 3D overlays on map, calibrated by layer thickness and drift current.
        </p>
      </div>

      {/* 2. Oil Layer Thickness & Spreading Movement Mechanics Card */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase text-[11px]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Layer Thickness & Movement Physics</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getThicknessBadgeStyle(currentThickness)}`}>
            {currentThickness} µm
          </span>
        </div>

        {/* Thickness Category Banner */}
        <div className="bg-[#111726] p-2.5 rounded-lg border border-[#26334D]">
          <span className="text-[10px] text-gray-400 uppercase font-sans block mb-0.5">Rheology Classification:</span>
          <div className="text-gray-100 font-bold text-xs">
            {thickness_category || (currentThickness > 200 ? 'Thick Emulsified Layer (>200 µm)' : currentThickness < 50 ? 'Thin Surface Sheen (<50 µm)' : 'Medium True Color (50-200 µm)')}
          </div>
          <p className="text-[11px] text-gray-300 font-sans mt-1 leading-relaxed">
            {dispersion_behavior || (currentThickness > 200
              ? 'Viscous water-in-oil emulsion mousse inhibits lateral spreading; forms cohesive drifting slick core with negligible evaporative loss. Persistent high-mass hazard.'
              : currentThickness < 50
                ? 'Rapid lateral surface spreading driven by surface tension and wind shear; 50-70% evaporative loss within 24h.'
                : 'Standard surface tension and wave-action spreading with moderate evaporative loss.')}
          </p>
        </div>

        {/* Thickness Quick Selector & Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-sans">
            <span>Calibrate Thickness Parameter:</span>
            <span className="font-mono text-cyan-300 font-bold">{currentThickness} µm</span>
          </div>
          <input
            type="range"
            min="20"
            max="500"
            step="10"
            value={currentThickness}
            onChange={(e) => onUpdateThickness && onUpdateThickness(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer h-1.5"
          />
          <div className="grid grid-cols-4 gap-1 pt-1">
            {[
              { label: '35 µm', sub: 'Sheen', val: 35 },
              { label: '120 µm', sub: 'Medium', val: 120 },
              { label: '280 µm', sub: 'Heavy', val: 280 },
              { label: '450 µm', sub: 'Mousse', val: 450 }
            ].map(preset => {
              const isSelected = Math.abs(currentThickness - preset.val) <= 20;
              return (
                <button
                  key={preset.val}
                  onClick={() => onUpdateThickness && onUpdateThickness(preset.val)}
                  className={`py-1 px-1 rounded text-center transition-all border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-[#111726] text-gray-400 border-[#26334D] hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <div className="text-[10px] font-bold">{preset.label}</div>
                  <div className="text-[9px] text-gray-500 font-sans">{preset.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Movement Rate vs Evaporative Loss Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#111726] p-2 rounded-lg border border-[#26334D] space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-sans block">Lateral Spread Rate:</span>
            <div className="text-xs font-bold text-cyan-300">
              {spread_rate_km2_per_hour.min}–{spread_rate_km2_per_hour.max} km²/hr
            </div>
            <span className="text-[9px] text-gray-500 font-sans block">
              {currentThickness > 200 ? 'Inhibited by high viscosity' : currentThickness < 50 ? 'Rapid surface tension shear' : 'Standard wave expansion'}
            </span>
          </div>

          <div className="bg-[#111726] p-2 rounded-lg border border-[#26334D] space-y-0.5">
            <span className="text-[10px] text-gray-400 uppercase font-sans block">Evaporative Loss (24h):</span>
            <div className={`text-xs font-bold ${evaporative_loss_pct > 50 ? 'text-cyan-400' : 'text-amber-400'}`}>
              ~{evaporative_loss_pct || (currentThickness < 50 ? 65 : currentThickness > 200 ? 8 : 28)}%
            </div>
            <span className="text-[9px] text-gray-500 font-sans block">
              {currentThickness > 200 ? '>90% mass persists in drift core' : 'High natural dispersion'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Estimated Spill Age (Honesty Rule Card) */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 uppercase text-[10px]">Estimated Spill Age:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
            estimated_spill_age.confidence_tier === 'high'
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
              : 'bg-amber-950 text-amber-400 border-amber-800'
          }`}>
            ● {estimated_spill_age.confidence_tier} Confidence
          </span>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold text-gray-100">
            {estimated_spill_age.min_hours} – {estimated_spill_age.max_hours}
          </span>
          <span className="text-gray-400 text-xs font-sans">hours since discharge</span>
        </div>

        {/* Honesty Banner */}
        <div className={`p-2.5 rounded-lg text-[11px] font-sans border leading-relaxed ${
          isMultiPass
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
        }`}>
          <div className="flex items-start space-x-1.5">
            <span className="text-sm leading-none">{isMultiPass ? '✓' : 'ⓘ'}</span>
            <div>
              <strong className="block font-mono text-[10px] uppercase mb-0.5">
                {isMultiPass ? 'Multi-Pass Satellite Telemetry:' : 'Single-Pass Satellite Snapshot:'}
              </strong>
              {estimated_spill_age.reason}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Coastal Impact Assessment (Weighted by Layer Thickness) */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 uppercase text-[10px]">Nearest Coastline Threat:</span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${currentThickness > 200 ? 'text-red-400 bg-red-950 border-red-800' : 'text-amber-400 bg-amber-950 border-amber-800'}`}>
            {currentThickness > 200 ? 'Severe Mousse Threat' : 'Impact Analysis'}
          </span>
        </div>

        {nearest_coastlines.map((coast, idx) => (
          <div key={idx} className="bg-[#111726] border border-[#26334D] p-2.5 rounded-lg space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-gray-100 font-sans text-xs block">{coast.name}</strong>
                <span className="text-gray-400 text-[10px]">{coast.coastal_type}</span>
              </div>
              <span className="text-amber-400 font-bold text-xs">{coast.distance_km} km</span>
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#26334D]/60">
              <span className="text-gray-400">Est. Time to Impact:</span>
              <span className="text-red-400 font-bold">
                {coast.estimated_time_to_impact_hours.min} – {coast.estimated_time_to_impact_hours.max} hours
              </span>
            </div>

            {/* Thickness-Derived Impact Severity Note */}
            <div className="text-[10px] font-sans text-amber-200/90 bg-amber-950/30 border border-amber-800/40 p-1.5 rounded">
              <span className="text-amber-400 font-mono font-bold uppercase block text-[9px]">Shoreline Hazard Tier:</span>
              {coast.impact_severity || (currentThickness > 200
                ? 'Catastrophic Heavy Emulsion Stranding (Severe intertidal & coastal wetland smothering hazard)'
                : currentThickness < 50
                  ? 'Surface Sheen Film (High evaporation / light iridescent wash-up with low smothering risk)'
                  : 'Moderate Shoreline Oiling (Requires physical containment booms & nearshore skimming)')}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Trigger Response Routing Button */}
      <button
        onClick={onOpenRoutePlanner}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold font-mono text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/50 transition-all border border-cyan-400 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span>Plan Response Route for Incident</span>
      </button>
    </div>
  );
};
