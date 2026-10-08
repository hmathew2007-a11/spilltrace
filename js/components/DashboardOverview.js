/**
 * SpillTrace AI — Dashboard Overview Strip Component
 *
 * Collapsible overview strip containing:
 * 1. Summary Stat Cards (Active Cases, Avg Detection Time, High Confidence, Dark Vessels, Backlog)
 * 2. Model Accuracy & System Performance Reference Panel (Ratio, Distribution, False Positives)
 * 3. Recent Activity Feed
 */

window.DashboardOverview = function DashboardOverview({
  metrics,
  onNavigateWithFilter
}) {
  const [isOverviewOpen, setIsOverviewOpen] = React.useState(true);
  const [isAccuracyOpen, setIsAccuracyOpen] = React.useState(false);
  const [isActivityOpen, setIsActivityOpen] = React.useState(false);

  if (!metrics) return null;

  return (
    <div className="bg-[#111726]/95 border-b border-[#26334D] text-xs font-mono select-none transition-all duration-300 z-10">
      {/* Top Header Strip Control */}
      <div className="px-4 py-2 bg-[#182032]/80 flex items-center justify-between border-b border-[#26334D]/60">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              System Overview & Telemetry Strip
            </h2>
          </div>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => setIsAccuracyOpen(!isAccuracyOpen)}
            className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center space-x-1 underline"
          >
            <span>Model Accuracy Reference</span>
            <span>{isAccuracyOpen ? '▲' : '▼'}</span>
          </button>
          <span className="text-gray-500 text-[10px]">|</span>
          <button
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className="text-amber-400 hover:text-amber-300 text-[10px] flex items-center space-x-1 underline"
          >
            <span>Recent Activity Feed ({metrics.activity_feed.length})</span>
            <span>{isActivityOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Overview Strip Collapse / Expand Toggle */}
        <button
          onClick={() => setIsOverviewOpen(!isOverviewOpen)}
          className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
          title={isOverviewOpen ? "Collapse Overview Strip" : "Expand Overview Strip"}
        >
          <span>{isOverviewOpen ? "Hide Overview" : "Show Overview"}</span>
          <svg className={`w-3.5 h-3.5 transform transition-transform ${isOverviewOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Overview Stat Cards Row */}
      {isOverviewOpen && (
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-[#090D16]/90">
          {/* Card 1: Active Cases */}
          <div
            onClick={() => onNavigateWithFilter('Active')}
            className="control-card p-3 rounded-lg cursor-pointer hover:border-cyan-500/50 group transition-all"
          >
            <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-between">
              <span>Active Cases</span>
              <span className="text-emerald-400 text-[9px] font-bold">{metrics.active_trend_30d}</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1 group-hover:text-cyan-400 transition-colors">
              {metrics.active_cases_count}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">Click to view active cases →</div>
          </div>

          {/* Card 2: Avg Detection-to-Report Time */}
          <div className="control-card p-3 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-between">
              <span>Avg. Detection Time</span>
              <span className="text-cyan-400 text-[9px]">30d Operational</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {metrics.avg_detection_to_report_days}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">Efficiency rating: Optimal</div>
          </div>

          {/* Card 3: High-Confidence Suspects */}
          <div
            onClick={() => onNavigateWithFilter('High')}
            className="control-card p-3 rounded-lg cursor-pointer hover:border-amber-500/50 group transition-all"
          >
            <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-between">
              <span>High-Conf Suspects</span>
              <span className="text-amber-400 text-[9px] font-bold">30d Total</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1 group-hover:text-amber-300 transition-colors">
              {metrics.high_confidence_suspects_30d}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">Click to filter high risk →</div>
          </div>

          {/* Card 4: Dark-Vessel Detections */}
          <div className="control-card p-3 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-between">
              <span>Dark Vessels (30d)</span>
              <span className="text-red-400 text-[9px] font-bold">Radar Only</span>
            </div>
            <div className="text-xl font-bold font-mono text-red-400 mt-1">
              {metrics.dark_vessel_detections_30d}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">No AIS signal correlation</div>
          </div>

          {/* Card 5: Analyst Review Backlog */}
          <div
            onClick={() => onNavigateWithFilter('Under Review')}
            className="control-card p-3 rounded-lg cursor-pointer hover:border-purple-500/50 group transition-all"
          >
            <div className="text-[10px] text-gray-400 uppercase font-semibold flex items-center justify-between">
              <span>Review Backlog</span>
              <span className="text-purple-400 text-[9px] font-bold">Pending</span>
            </div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1 group-hover:text-purple-300 transition-colors">
              {metrics.analyst_review_backlog}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">Awaiting human sign-off →</div>
          </div>
        </div>
      )}

      {/* A.2 Model Accuracy / Transparency Panel Drawer */}
      {isAccuracyOpen && (
        <div className="p-4 bg-[#090D16] border-t border-[#26334D] space-y-3">
          {/* Mandatory Disclaimer Label */}
          <div className="bg-amber-950/60 border border-amber-800/80 p-2 rounded text-[10px] text-amber-300 font-bold tracking-wider uppercase flex items-center space-x-2">
            <span>⚠ SYSTEM PERFORMANCE REFERENCE ONLY — NOT A SUBSTITUTE FOR ANALYST JUDGMENT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accuracy Ratio */}
            <div className="bg-[#111726] p-3 rounded-lg border border-[#26334D] space-y-1">
              <span className="text-[10px] text-gray-400 uppercase block">Historical Accuracy (Closed Cases)</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {metrics.accuracy_ratio} <span className="text-xs text-gray-400">({metrics.accuracy_ratio_pct}%)</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Confirmed match between analyst-verified suspect and top-ranked AI suggestion upon physical port state inspection.
              </p>
            </div>

            {/* Confidence Tier Distribution */}
            <div className="bg-[#111726] p-3 rounded-lg border border-[#26334D] space-y-2">
              <span className="text-[10px] text-gray-400 uppercase block">Confidence Tier Distribution (30d)</span>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-500" style={{ width: `${metrics.confidence_distribution.high}%` }} title="High: 45%"></div>
                <div className="h-full bg-amber-500" style={{ width: `${metrics.confidence_distribution.medium}%` }} title="Medium: 35%"></div>
                <div className="h-full bg-cyan-500" style={{ width: `${metrics.confidence_distribution.low}%` }} title="Low: 20%"></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span className="text-red-400">High: 45%</span>
                <span className="text-amber-400">Med: 35%</span>
                <span className="text-cyan-400">Low: 20%</span>
              </div>
            </div>

            {/* False-Positive Track Record Notes */}
            <div className="bg-[#111726] p-3 rounded-lg border border-[#26334D] space-y-1 overflow-y-auto max-h-32">
              <span className="text-[10px] text-red-400 uppercase font-bold block">Historical False-Positive Audits</span>
              <div className="space-y-1 text-[10px] text-gray-300 font-sans">
                {metrics.false_positive_notes.map(fp => (
                  <div key={fp.case_id} className="border-b border-[#26334D]/60 pb-1">
                    <span className="font-mono text-cyan-400 font-bold">[{fp.case_id}] {fp.vessel_name}:</span> {fp.reason}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A.3 Recent Activity Feed Drawer */}
      {isActivityOpen && (
        <div className="p-3 bg-[#090D16] border-t border-[#26334D] space-y-2">
          <div className="text-[10px] uppercase text-gray-400 font-bold border-b border-[#26334D] pb-1">
            Recent System Activity Feed (Situational Awareness Log)
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
            {metrics.activity_feed.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-[#111726] px-3 py-1.5 rounded border border-[#26334D]/60">
                <span className="text-gray-300">{item.text}</span>
                <span className="text-[10px] text-gray-500 ml-4 shrink-0">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
