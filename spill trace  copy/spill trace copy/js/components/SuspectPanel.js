/**
 * SpillTrace AI — Suspect Vessel & Evidence Scorecard Panel
 */

window.SuspectPanel = function SuspectPanel({
  suspects,
  selectedVesselId,
  onSelectVessel,
  reviewedVessels,
  onToggleReview,
  analystSignoff,
  onToggleSignoff,
  collapsed,
  setCollapsed,
  activeTab = 'suspects',
  setActiveTab,
  activeCase,
  forecast,
  forwardOffset,
  setForwardOffset,
  onOpenRoutePlanner,
  estimateData,
  onUpdateThickness
}) {
  const [expandedVesselId, setExpandedVesselId] = React.useState(null);

  // Auto-expand card if selected from map
  React.useEffect(() => {
    if (selectedVesselId) {
      setExpandedVesselId(selectedVesselId);
    } else if (suspects.length > 0 && !expandedVesselId) {
      setExpandedVesselId(suspects[0].vessel_id);
    }
  }, [selectedVesselId, suspects]);

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'high':
        return {
          badge: 'bg-red-950/80 text-red-400 border-red-700/60',
          bar: 'bg-red-500',
          text: 'text-red-400'
        };
      case 'medium':
        return {
          badge: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
          bar: 'bg-amber-500',
          text: 'text-amber-400'
        };
      case 'low':
      default:
        return {
          badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
          bar: 'bg-emerald-500',
          text: 'text-emerald-400'
        };
    }
  };

  return (
    <aside className={`h-[calc(100vh-3.5rem)] bg-[#111726]/95 border-l border-[#26334D] flex flex-col transition-all duration-300 z-20 select-none ${collapsed ? 'w-12' : 'w-full md:w-[380px] lg:w-[420px]'}`}>
      {/* Panel Top Header & 3-Tab Selector */}
      <div className="p-2 border-b border-[#26334D] flex items-center justify-between bg-[#182032]/60">
        {!collapsed && (
          <div className="flex items-center space-x-1 flex-1 mr-2">
            <button
              onClick={() => setActiveTab && setActiveTab('suspects')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold font-mono transition-all border ${
                activeTab === 'suspects'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800 shadow-md'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Suspects ({suspects.length})
            </button>

            <button
              onClick={() => setActiveTab && setActiveTab('forecast')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold font-mono transition-all border flex items-center justify-center space-x-1 ${
                activeTab === 'forecast'
                  ? 'bg-purple-950 text-purple-300 border-purple-800 shadow-md'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Forecast</span>
            </button>

            <button
              onClick={() => setActiveTab && setActiveTab('estimator')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold font-mono transition-all border flex items-center justify-center space-x-1 ${
                activeTab === 'estimator'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 shadow-md'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estimator</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-[#182032] transition-colors shrink-0"
          title={collapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          <svg className={`w-4 h-4 transform transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {activeTab === 'forecast' ? (
            <window.ForecastTab
              activeCase={activeCase}
              forecast={forecast}
              forwardOffset={forwardOffset}
              setForwardOffset={setForwardOffset}
              onOpenRoutePlanner={onOpenRoutePlanner}
              onUpdateThickness={onUpdateThickness}
            />
          ) : activeTab === 'estimator' ? (
            <window.CleanupEstimatorCard
              activeCase={activeCase}
              estimateData={estimateData}
              onUpdateThickness={onUpdateThickness}
            />
          ) : (
            <>
          {/* Global Analyst Sign-Off Control */}
          <div className="p-3 border-b border-[#26334D] bg-[#090D16]/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="analyst-signoff"
                checked={analystSignoff}
                onChange={(e) => onToggleSignoff(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="analyst-signoff" className="text-xs font-mono text-gray-300 font-semibold cursor-pointer">
                Analyst Human Sign-Off
              </label>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
              analystSignoff
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}>
              {analystSignoff ? 'Verified' : 'Pending'}
            </span>
          </div>

          {/* Suspect Vessels Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {suspects.map((suspect, index) => {
              const isSelected = selectedVesselId === suspect.vessel_id;
              const isExpanded = expandedVesselId === suspect.vessel_id;
              const isReviewed = reviewedVessels.includes(suspect.vessel_id);
              const tierStyles = getTierColor(suspect.scorecard.confidence_tier);

              return (
                <div
                  key={suspect.vessel_id}
                  className={`rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#1F2A42] border-cyan-500 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#182032] border-[#26334D] hover:border-gray-600'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => {
                      onSelectVessel(suspect.vessel_id);
                      setExpandedVesselId(isExpanded ? null : suspect.vessel_id);
                    }}
                    className="p-3 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-center justify-center w-7 h-7 rounded bg-[#111726] border border-[#26334D] font-mono text-xs font-bold text-cyan-400">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-xs ${suspect.is_dark ? 'text-red-400 font-mono' : 'text-gray-100'}`}>
                            {suspect.name}
                          </span>
                          {suspect.is_dark && (
                            <span className="bg-red-950 text-red-400 text-[9px] font-mono px-1.5 py-0.2 rounded border border-red-800 uppercase font-bold animate-pulse">
                              AIS Dark
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-2 mt-0.5">
                          <span>{suspect.flag}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{suspect.vessel_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Composite Score & Tier Badge */}
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${tierStyles.badge}`}>
                        {suspect.scorecard.confidence_tier}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-200">
                        {suspect.scorecard.composite_score}% Score
                      </span>
                    </div>
                  </div>

                  {/* Expanded Evidence Scorecard */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-[#26334D] space-y-2.5 text-xs font-mono">
                      {/* Metric Breakdown Table */}
                      <div className="space-y-2 pt-1">
                        {/* 1. Route Overlap */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-400">Route Overlap in Drift Zone:</span>
                            <span className="text-cyan-300 font-bold">{suspect.scorecard.route_overlap_pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${suspect.scorecard.route_overlap_pct}%` }}></div>
                          </div>
                        </div>

                        {/* 2. Presence Window */}
                        <div className="flex justify-between items-center bg-[#111726] p-2 rounded border border-[#26334D] text-[11px]">
                          <span className="text-gray-400">In Time Window:</span>
                          <span className={suspect.scorecard.presence_window.present ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                            {suspect.scorecard.presence_window.present ? `YES (${suspect.scorecard.presence_window.duration_minutes} min overlap)` : 'NO'}
                          </span>
                        </div>

                        {/* 3. Dark Period Flag */}
                        <div className="flex justify-between items-center bg-[#111726] p-2 rounded border border-[#26334D] text-[11px]">
                          <span className="text-gray-400">AIS Blackout Flag:</span>
                          <span className={suspect.scorecard.dark_period_flag ? 'text-red-400 font-bold flex items-center space-x-1' : 'text-gray-500'}>
                            {suspect.scorecard.dark_period_flag ? '⚠ YES (AIS Transponder Off)' : 'NO (Continuous)'}
                          </span>
                        </div>

                        {/* 4. Drift Trajectory Match */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-400">Drift Backtrack Match:</span>
                            <span className="text-amber-400 font-bold">{suspect.scorecard.drift_match_pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${suspect.scorecard.drift_match_pct}%` }}></div>
                          </div>
                        </div>

                        {/* 5. Historical Record Flag */}
                        {suspect.scorecard.historical_flag && (
                          <div className="bg-red-950/40 border border-red-800/60 p-2 rounded text-[10px] text-red-300">
                            <strong>Historical Flag:</strong> {suspect.scorecard.historical_flag}
                          </div>
                        )}
                      </div>

                      {/* Plain-Language AI Summary */}
                      <div className="bg-[#111726] border border-[#26334D] p-2.5 rounded-lg text-[11px] text-gray-300 leading-relaxed font-sans">
                        <span className="text-cyan-400 font-semibold font-mono text-[10px] block mb-0.5">EVIDENCE SUMMARY:</span>
                        "{suspect.scorecard.summary_text}"
                      </div>

                      {/* Individual Analyst Review Checkbox */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center space-x-2 text-[11px] text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isReviewed}
                            onChange={() => onToggleReview(suspect.vessel_id)}
                            className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                          />
                          <span>Mark as Reviewed</span>
                        </label>
                        <span className={`text-[10px] font-bold uppercase ${isReviewed ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {isReviewed ? '✓ Reviewed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </>
          )}
        </>
      )}
    </aside>
  );
};
