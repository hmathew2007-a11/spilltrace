/**
 * SpillTrace AI — Top Navigation Bar Component (DB Integrated)
 */

window.TopNavbar = function TopNavbar({
  activeCase,
  allCases,
  onSelectCase,
  isExportReady,
  onExportClick,
  activeView,
  setActiveView,
  onOpenNewCaseModal,
  mapMode = 'single',
  setMapMode,
  onOpenRoutePlanner,
  onTriggerDeDupDemo
}) {
  const getBadgeStyle = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'high':
        return 'bg-red-950/80 text-red-400 border-red-700/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      case 'medium':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'low':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  };

  return (
    <header className="h-14 bg-[#111726]/95 border-b border-[#26334D] px-4 flex items-center justify-between z-30 shadow-lg select-none">
      {/* Left section: Logo & Case Switcher & Mode Toggle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-wider text-white">SPILL<span className="text-cyan-400">TRACE</span></span>
            <span className="ml-1 text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">v2 AI</span>
          </div>
        </div>

        {/* Global Overview vs Single Case Map Mode Toggle */}
        <div className="flex bg-[#182032] p-1 rounded-lg border border-[#26334D] text-xs font-mono">
          <button
            onClick={() => setMapMode && setMapMode('single')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold ${
              mapMode === 'single'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Single Case
          </button>
          <button
            onClick={() => setMapMode && setMapMode('global')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold flex items-center space-x-1 ${
              mapMode === 'global'
                ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span>All Active Spills</span>
          </button>
        </div>

        {/* Case Dropdown (active when Single Case mode) */}
        {mapMode === 'single' && (
          <div className="relative hidden md:block">
            <select
              value={activeCase?.case_id || ''}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-[#182032] text-gray-200 border border-[#26334D] text-xs font-mono rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:border-cyan-500 hover:border-gray-600 transition-colors cursor-pointer appearance-none max-w-[210px] truncate"
            >
              {allCases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  [{c.case_id}] {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* New Incident Button */}
        <button
          onClick={onOpenNewCaseModal}
          className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 rounded-md text-xs font-mono transition-colors"
          title="Create New Satellite Incident Case"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New</span>
        </button>

        {/* De-duplication Demo Button */}
        <button
          onClick={onTriggerDeDupDemo}
          className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-md text-xs font-mono transition-colors"
          title="Simulate candidate pass to test de-duplication engine"
        >
          <span>Test De-Dup</span>
        </button>
      </div>

      {/* Middle section: Active Case Metadata & DB Badge */}
      {activeCase && mapMode === 'single' && (
        <div className="hidden 2xl:flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-gray-300 bg-[#182032] px-2.5 py-1 rounded border border-[#26334D]">
            <span className="text-gray-500 uppercase text-[10px]">Detected:</span>
            <span className="text-cyan-300 font-semibold">{formatDate(activeCase.detection_time)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${getBadgeStyle(activeCase.confidence_tier)}`}>
              ● {activeCase.confidence_tier} Risk
            </span>
          </div>
        </div>
      )}

      {/* Right section: Plan Route & Export Action */}
      <div className="flex items-center space-x-2">
        {/* Plan Response Route Trigger */}
        <button
          onClick={onOpenRoutePlanner}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-cyan-300 border border-blue-600/60 rounded-md text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
          title="Plan Weather-Aware Marine Response Route"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Plan Response Route</span>
        </button>

        <button
          onClick={onExportClick}
          disabled={!isExportReady}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shadow-md ${
            isExportReady
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-cyan-600/30 cursor-pointer'
              : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
};
