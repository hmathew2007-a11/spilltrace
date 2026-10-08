/**
 * SpillTrace AI — Left Navigation Sidebar Component
 */

window.LeftSidebar = function LeftSidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  activeCase,
  allCases
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'active-cases', label: 'Active Cases', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'archive', label: 'Report Archive', icon: 'M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm14 0l-2-4H7L5 8' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <aside className={`h-[calc(100vh-3.5rem)] bg-[#111726]/95 border-r border-[#26334D] flex flex-col transition-all duration-300 z-20 select-none ${collapsed ? 'w-14' : 'w-56'}`}>
      {/* Navigation Buttons */}
      <div className="flex-1 py-4 space-y-1.5 px-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 shadow-md shadow-cyan-950/50'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#182032]'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'active-cases' && (
                <span className="ml-auto bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                  {allCases.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Case Telemetry Quick Metrics (when expanded) */}
      {!collapsed && activeCase && activeView === 'dashboard' && (
        <div className="mx-2 mb-4 p-3 bg-[#182032] border border-[#26334D] rounded-lg text-xs font-mono space-y-2">
          <div className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider flex items-center justify-between">
            <span>Live Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="space-y-1 text-gray-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Est. Volume:</span>
              <span className="text-cyan-300 font-semibold">{activeCase.slick.estimated_volume_m3} m³</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thickness:</span>
              <span className="text-amber-300 font-semibold">{activeCase.slick.estimated_thickness_um || 250} µm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sensor:</span>
              <span className="text-gray-300 truncate max-w-[100px]" title={activeCase.slick.sensor_source}>
                {activeCase.slick.sensor_source.split(' ')[0]} SAR
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Suspects:</span>
              <span className="text-amber-400 font-bold">{activeCase.suspects.length} vessels</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dark Targets:</span>
              <span className="text-red-400 font-bold">{activeCase.dark_vessels.length} detected</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse/Expand Toggle Footer */}
      <div className="p-2 border-t border-[#26334D] flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#182032] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg className={`w-5 h-5 transform transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
