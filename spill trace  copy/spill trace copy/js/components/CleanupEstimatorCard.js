/**
 * SpillTrace AI — Range-Based Cleanup Cost & Resource Estimator Component (Calibrated by Layer Thickness)
 */

window.CleanupEstimatorCard = function CleanupEstimatorCard({
  activeCase,
  estimateData,
  onUpdateThickness
}) {
  if (!estimateData) {
    return (
      <div className="p-4 font-mono text-xs text-gray-400 text-center space-y-2">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Calculating cost & resource ranges from response benchmarks...</p>
      </div>
    );
  }

  const {
    cost_range_usd,
    resource_requirements,
    cost_breakdown_pct,
    disclaimer,
    estimated_volume_m3,
    thickness_um,
    thickness_category,
    skimmer_efficiency_pct,
    emulsion_waste_factor
  } = estimateData;

  const currentThickness = thickness_um || activeCase?.slick?.estimated_thickness_um || 250;

  const formatUsd = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    return `$${(num / 1000).toFixed(0)}K`;
  };

  const getThicknessBadgeStyle = (um) => {
    if (um < 50) {
      return 'bg-cyan-950 text-cyan-400 border-cyan-800';
    }
    if (um > 200) {
      return 'bg-red-950 text-red-400 border-red-800';
    }
    return 'bg-amber-950 text-amber-400 border-amber-800';
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-none">
      {/* 1. Incident Target & Volume Summary */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-sans">Spill Target & Volume:</span>
          <div className="text-gray-100 font-bold text-xs">{activeCase?.name || 'Incident Target'}</div>
          <div className="text-emerald-400 text-[11px] font-bold">~{estimated_volume_m3} m³ Petroleum Slick</div>
        </div>
        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
          Benchmark Model
        </span>
      </div>

      {/* 2. Interactive Oil Layer Thickness Controller */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase text-[11px]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Oil Layer Thickness & Rheology</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getThicknessBadgeStyle(currentThickness)}`}>
            {currentThickness} µm
          </span>
        </div>

        {/* Thickness Category Banner */}
        <div className="flex items-baseline justify-between bg-[#111726] p-2.5 rounded-lg border border-[#26334D]">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-sans block">Slick Physical State:</span>
            <div className="text-gray-100 font-bold text-xs">
              {thickness_category || (currentThickness > 200 ? 'Thick Emulsified Layer (>200 µm)' : currentThickness < 50 ? 'Thin Surface Sheen (<50 µm)' : 'Medium True Color (50-200 µm)')}
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">
            {currentThickness < 50 ? 'High Sheen Dissipation' : currentThickness > 200 ? 'Viscous Mousse Hazard' : 'Standard Cohesion'}
          </span>
        </div>

        {/* Real-Time Thickness Calibration Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-sans">
            <span>Calibrate Layer Thickness:</span>
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
          <div className="flex justify-between text-[9px] text-gray-500 font-sans">
            <span>20 µm (Sheen)</span>
            <span>150 µm (Medium)</span>
            <span>300 µm (Heavy)</span>
            <span>500 µm (Mousse)</span>
          </div>
        </div>

        {/* Quick Calibration Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
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

        {/* Thickness Mechanics Impact Metrics (Skimmer Efficiency & Emulsion Waste Multiplier) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#111726] p-2 rounded-lg border border-[#26334D] space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-sans">
              <span>Skimmer Efficiency:</span>
              <span className={`font-mono font-bold ${skimmer_efficiency_pct > 70 ? 'text-emerald-400' : skimmer_efficiency_pct < 30 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {skimmer_efficiency_pct || 65}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${skimmer_efficiency_pct > 70 ? 'bg-emerald-500' : skimmer_efficiency_pct < 30 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                style={{ width: `${skimmer_efficiency_pct || 65}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-gray-500 font-sans block pt-0.5">
              {currentThickness < 50 ? 'Low: Skimmers pump mostly seawater' : currentThickness > 200 ? 'High: Concentrated viscous recovery' : 'Moderate recovery per pass'}
            </span>
          </div>

          <div className="bg-[#111726] p-2 rounded-lg border border-[#26334D] space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase font-sans">
              <span>Emulsion Waste Multiplier:</span>
              <span className="text-amber-400 font-mono font-bold">
                {emulsion_waste_factor || 1.8}×
              </span>
            </div>
            <div className="text-gray-300 font-mono text-[11px] font-bold">
              ~{Math.round(estimated_volume_m3 * (emulsion_waste_factor || 1.8))} m³
            </div>
            <span className="text-[9px] text-gray-500 font-sans block">
              {currentThickness > 200 ? 'Water entrainment triples waste volume' : 'Minimal water-in-oil mousse swelling'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Estimated Cost Range Card (Calibrated by Layer Thickness) */}
      <div className="bg-[#182032] border border-[#26334D] p-3.5 rounded-xl space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 uppercase text-[10px]">Estimated Response Cost Range:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
            cost_range_usd.confidence_tier === 'high'
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
              : 'bg-amber-950 text-amber-400 border-amber-800'
          }`}>
            ● {cost_range_usd.confidence_tier} Confidence
          </span>
        </div>

        {/* Formatted Dollar Range Banner */}
        <div className="bg-[#111726] p-3 rounded-xl border border-[#26334D] flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {formatUsd(cost_range_usd.min)} – {formatUsd(cost_range_usd.max)}
            </div>
            <span className="text-[10px] text-gray-400 font-sans">Estimated Direct Response Expenditure (USD)</span>
          </div>
          <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
            Thickness-Adjusted
          </span>
        </div>

        {/* Modeling Assumptions Banner */}
        <div className="p-2.5 rounded-lg bg-[#111726]/60 border border-[#26334D] text-[11px] text-gray-300 font-sans leading-relaxed">
          <strong className="text-cyan-400 font-mono text-[10px] uppercase block mb-0.5">ESTIMATION PARAMETERS:</strong>
          {cost_range_usd.assumptions_text}
        </div>
      </div>

      {/* 4. Required Equipment & Personnel Grid */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-gray-400 uppercase font-sans font-semibold">
          Thickness-Calibrated Resource Requirements:
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Response Vessels */}
          <div className="bg-[#182032] border border-[#26334D] p-2.5 rounded-xl space-y-0.5">
            <span className="text-gray-400 text-[10px] uppercase font-sans block">Response Vessels</span>
            <div className="text-base font-bold text-cyan-300">
              {resource_requirements.vessels.min} – {resource_requirements.vessels.max}
            </div>
            <span className="text-[10px] text-gray-500 font-sans">Skimmer Tugs & Waste Barges</span>
          </div>

          {/* Containment Boom */}
          <div className="bg-[#182032] border border-[#26334D] p-2.5 rounded-xl space-y-0.5">
            <span className="text-gray-400 text-[10px] uppercase font-sans block">Containment Boom</span>
            <div className="text-base font-bold text-cyan-300">
              {resource_requirements.containment_boom_m.min} – {resource_requirements.containment_boom_m.max} m
            </div>
            <span className="text-[10px] text-gray-500 font-sans">
              {currentThickness > 200 ? 'Deep-Draft Ocean Boom' : 'Standard Inflatable Boom'}
            </span>
          </div>

          {/* Field Responders */}
          <div className="bg-[#182032] border border-[#26334D] p-2.5 rounded-xl space-y-0.5">
            <span className="text-gray-400 text-[10px] uppercase font-sans block">Field Responders</span>
            <div className="text-base font-bold text-amber-300">
              {resource_requirements.personnel.min} – {resource_requirements.personnel.max}
            </div>
            <span className="text-[10px] text-gray-500 font-sans">Hazmat & Beach Cleaning Crew</span>
          </div>

          {/* Skimming Recovery Capacity */}
          <div className="bg-[#182032] border border-[#26334D] p-2.5 rounded-xl space-y-0.5">
            <span className="text-gray-400 text-[10px] uppercase font-sans block">Recovery Capacity</span>
            <div className="text-base font-bold text-emerald-300">
              {resource_requirements.skimming_capacity_m3_day.min} – {resource_requirements.skimming_capacity_m3_day.max} m³/day
            </div>
            <span className="text-[10px] text-gray-500 font-sans">Mechanical Skimming Rate</span>
          </div>
        </div>
      </div>

      {/* 5. Cost Breakdown Proportional Bar */}
      <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl space-y-2">
        <span className="text-[10px] text-gray-400 uppercase font-sans font-semibold block">
          Cost Category Allocation Breakdown:
        </span>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${cost_breakdown_pct.offshore_skimming}%` }} className="bg-cyan-500 h-full" title={`Offshore Skimming ${cost_breakdown_pct.offshore_skimming}%`}></div>
          <div style={{ width: `${cost_breakdown_pct.containment_booming}%` }} className="bg-blue-500 h-full" title={`Containment Booming ${cost_breakdown_pct.containment_booming}%`}></div>
          <div style={{ width: `${cost_breakdown_pct.shoreline_protection}%` }} className="bg-amber-500 h-full" title={`Shoreline Protection ${cost_breakdown_pct.shoreline_protection}%`}></div>
          <div style={{ width: `${cost_breakdown_pct.waste_disposal}%` }} className="bg-purple-500 h-full" title={`Waste Disposal ${cost_breakdown_pct.waste_disposal}%`}></div>
        </div>

        <div className="grid grid-cols-2 gap-y-1 text-[10px] font-mono text-gray-300 pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>Offshore Skimming ({cost_breakdown_pct.offshore_skimming}%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Containment Booming ({cost_breakdown_pct.containment_booming}%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Shoreline Protection ({cost_breakdown_pct.shoreline_protection}%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Waste Disposal ({cost_breakdown_pct.waste_disposal}%)</span>
          </div>
        </div>
      </div>

      {/* 6. MANDATORY ADVISORY DISCLAIMER BANNER */}
      <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-xl space-y-1 text-amber-200 font-sans">
        <div className="flex items-center space-x-1.5 font-bold font-mono text-[10px] uppercase text-amber-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>ADVISORY PLANNING ESTIMATE NOTICE</span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-100/90">
          {disclaimer}
        </p>
      </div>
    </div>
  );
};
