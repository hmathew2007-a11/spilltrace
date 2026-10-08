/**
 * SpillTrace AI — Weather-Aware Response Route Modal Component (Phase 2)
 */

window.ResponseRouteModal = function ResponseRouteModal({
  isOpen,
  onClose,
  activeCase,
  bases,
  selectedBaseId,
  onSelectBase,
  routeData,
  isRouteActive,
  setIsRouteActive
}) {
  if (!isOpen || !activeCase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-fadeIn">
      <div className="bg-[#111726] border border-[#26334D] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-[#182032] border-b border-[#26334D] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wider">
                Weather-Aware Response Route Planning
              </h2>
              <p className="text-[11px] text-gray-400 font-sans">
                Water-only marine pathfinding & sea-state hazard detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#26334D] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* Incident Target Banner */}
          <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Incident Destination Target:</span>
              <div className="text-cyan-300 font-bold text-xs font-mono">{activeCase.name}</div>
              <div className="text-gray-400 text-[11px] font-sans">{activeCase.location_name}</div>
            </div>
            <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              Target Spill
            </span>
          </div>

          {/* Response Base Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-300 font-semibold uppercase block">
              Select Staged Response Depot / Port Base:
            </label>
            <div className="relative">
              <select
                value={selectedBaseId || ''}
                onChange={(e) => onSelectBase(e.target.value)}
                className="w-full bg-[#182032] text-gray-100 border border-[#26334D] text-xs font-mono rounded-xl p-3 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} [{b.region}] — {b.readiness}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Selected Base Telemetry */}
          {routeData?.starting_base && (
            <div className="bg-[#182032]/70 border border-[#26334D] p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-sans">Staged Vessel Assets:</span>
                <span className="text-gray-200 font-bold">{routeData.starting_base.vessel_assets}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-sans">Base Readiness:</span>
                <span className="text-emerald-400 font-bold">{routeData.starting_base.readiness}</span>
              </div>
            </div>
          )}

          {/* Route Transit Summary & ETA Range */}
          {routeData && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl text-center space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-sans">Marine Distance</span>
                <div className="text-base font-bold text-gray-100">{routeData.distance_km} km</div>
                <span className="text-[10px] text-gray-500 font-sans">Water Route</span>
              </div>

              <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl text-center space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-sans">Est. Transit Time</span>
                <div className="text-base font-bold text-cyan-300">
                  {routeData.transit_time_range?.min_hours || 4}–{routeData.transit_time_range?.max_hours || 6} hrs
                </div>
                <span className="text-[10px] text-cyan-500 font-sans">~{routeData.estimated_transit_time_hours}h avg</span>
              </div>

              <div className="bg-[#182032] border border-[#26334D] p-3 rounded-xl text-center space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-sans">Route Confidence</span>
                <div className="text-base font-bold text-amber-400 uppercase">
                  {routeData.route_confidence}
                </div>
                <span className="text-[10px] text-gray-500 font-sans">Navigable Water</span>
              </div>
            </div>
          )}

          {/* Sea-State Hazard Warnings Segment */}
          {routeData?.hazard_segments?.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Flagged Marine Hazard Segments ({routeData.hazard_segments.length})</span>
              </div>

              {routeData.hazard_segments.map((hz, idx) => (
                <div key={idx} className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold uppercase text-[11px]">
                      ⚠ {hz.reason} Flag
                    </span>
                    <span className="text-amber-300 text-[10px]">Transit Caution Required</span>
                  </div>
                  <p className="text-gray-300 text-[11px] font-sans leading-relaxed">
                    {hz.details}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* NON-NEGOTIABLE PERSISTENT SAFETY DISCLAIMER */}
          <div className="bg-red-950/50 border border-red-800 p-3.5 rounded-xl space-y-1 text-red-200 font-sans shadow-inner">
            <div className="flex items-center space-x-2 text-red-400 font-bold font-mono text-[11px] uppercase">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>MANDATORY MARITIME SAFETY NOTICE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-red-100">
              Advisory routing only. Verify against official maritime weather warnings, navigational charts, and vessel-specific constraints before dispatch.
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-[#182032] border-t border-[#26334D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRouteActive(!isRouteActive)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 border ${
                isRouteActive
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRouteActive ? 'bg-cyan-400 animate-pulse' : 'bg-gray-500'}`}></span>
              <span>{isRouteActive ? 'Hide Route Layer on Map' : 'Draw Route Layer on Map'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-mono font-bold transition-colors border border-gray-700"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
