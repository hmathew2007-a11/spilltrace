/**
 * SpillTrace AI — Main Application Controller (DB & Enhanced Dashboard)
 */

const { useState, useEffect } = React;

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [allCases, setAllCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // v2 Feature States
  const [mapMode, setMapMode] = useState('single'); // 'single' | 'global'
  const [rightPanelTab, setRightPanelTab] = useState('suspects'); // 'suspects' | 'forecast' | 'estimator'
  const [forecast, setForecast] = useState(null);
  const [forwardOffset, setForwardOffset] = useState(0);

  // Estimator & Eco Sensitivity States
  const [estimateData, setEstimateData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);

  // Response Route States
  const [responseBases, setResponseBases] = useState([]);
  const [selectedBaseId, setSelectedBaseId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isRouteActive, setIsRouteActive] = useState(false);

  // Archive Filter Deep Link state
  const [archiveFilterStatus, setArchiveFilterStatus] = useState('ALL');
  const [archiveFilterConfidence, setArchiveFilterConfidence] = useState('ALL');

  // Selection & Analyst State
  const [selectedVesselId, setSelectedVesselId] = useState(null);
  const [reviewedVessels, setReviewedVessels] = useState([]);
  const [analystSignoff, setAnalystSignoff] = useState(false);

  // Timeline Scrubber State
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Layout Panels Collapsed States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSuspectPanelCollapsed, setIsSuspectPanelCollapsed] = useState(false);

  // Modals State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState(null);

  const loadCasesFromDb = async () => {
    const cases = await window.mockApi.getCases();
    setAllCases(cases);

    const systemMetrics = await window.mockApi.getMetrics();
    setMetrics(systemMetrics);

    const bases = await window.mockApi.getResponseBases();
    setResponseBases(bases);

    if (cases.length > 0 && !activeCase) {
      loadCaseDetails(cases[0]);
    }
  };

  useEffect(() => {
    loadCasesFromDb();
  }, []);

  const loadCaseDetails = async (c, overrideBaseId = null) => {
    setActiveCase(c);
    setTimelineProgress(0);
    setForwardOffset(0);
    setIsPlaying(false);
    setIsRouteActive(false);
    setAnalystSignoff(c.analyst_signoff || false);

    const reviews = await window.mockApi.getReviews(c.case_id);
    setReviewedVessels(reviews);

    if (c.suspects && c.suspects.length > 0) {
      setSelectedVesselId(c.suspects[0].vessel_id);
    }

    // Fetch v2 Forecast, Estimator, Environmental & Route telemetry
    const fc = await window.mockApi.getSpreadForecast(c.case_id);
    setForecast(fc);

    const est = await window.mockApi.getCleanupEstimate(c.case_id);
    setEstimateData(est);

    const env = await window.mockApi.getEnvironmentalZones(c.case_id);
    setEnvironmentalData(env);

    const rt = await window.mockApi.getResponseRoute(c.case_id, overrideBaseId);
    setRouteData(rt);
    if (rt && rt.starting_base) {
      setSelectedBaseId(rt.starting_base.id);
    }
  };

  const handleSelectCase = async (caseId) => {
    const found = allCases.find(c => c.case_id === caseId);
    if (found) {
      await loadCaseDetails(found);
    }
  };

  const handleSelectBase = async (baseId) => {
    setSelectedBaseId(baseId);
    if (activeCase) {
      const rt = await window.mockApi.getResponseRoute(activeCase.case_id, baseId);
      setRouteData(rt);
    }
  };

  const handleToggleReview = async (vesselId) => {
    if (!activeCase) return;
    const isNowReviewed = !reviewedVessels.includes(vesselId);

    await window.mockApi.saveReview(activeCase.case_id, vesselId, isNowReviewed);

    setReviewedVessels(prev =>
      isNowReviewed
        ? [...prev, vesselId]
        : prev.filter(id => id !== vesselId)
    );
  };

  const handleToggleSignoff = async (signoffStatus) => {
    if (!activeCase) return;
    setAnalystSignoff(signoffStatus);
    await window.mockApi.saveSignoff(activeCase.case_id, signoffStatus);
  };

  const handleCaseCreated = (newCase) => {
    setAllCases(prev => [newCase, ...prev]);
    loadCaseDetails(newCase);
  };

  const handleTriggerDeDupDemo = async () => {
    const result = await window.mockApi.triggerDeDupDemo();
    setNotification({
      type: result.action === 'merged' ? 'success' : 'info',
      message: result.message
    });

    const refreshedCases = await window.mockApi.getCases();
    setAllCases(refreshedCases);

    if (result.matching_case) {
      await loadCaseDetails(result.matching_case);
    }

    setTimeout(() => setNotification(null), 7000);
  };

  const handleUpdateThickness = async (newThicknessUm) => {
    if (!activeCase) return;
    const thickness = parseInt(newThicknessUm, 10);
    const category = thickness < 50
      ? "Thin Surface Sheen (<50 µm)"
      : thickness <= 200
        ? "Medium True Color (50-200 µm)"
        : "Thick Emulsified Layer (>200 µm)";

    const updatedCase = {
      ...activeCase,
      slick: {
        ...activeCase.slick,
        estimated_thickness_um: thickness,
        thickness_category: category
      }
    };
    setActiveCase(updatedCase);
    setAllCases(prev => prev.map(c => c.case_id === updatedCase.case_id ? updatedCase : c));
    await window.dbManager.saveCase(updatedCase);

    const fc = await window.mockApi.getSpreadForecast(activeCase.case_id, thickness);
    setForecast(fc);

    const est = await window.mockApi.getCleanupEstimate(activeCase.case_id, thickness);
    setEstimateData(est);

    setNotification({
      type: 'info',
      message: `Oil Layer Thickness calibrated to ${thickness} µm [${category}]. Spreading mechanics & response costs recomputed.`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Stat card deep-link navigation
  const handleNavigateWithFilter = (filterVal) => {
    if (filterVal === 'Active' || filterVal === 'Under Review' || filterVal === 'Closed') {
      setArchiveFilterStatus(filterVal);
      setArchiveFilterConfidence('ALL');
    } else if (filterVal === 'High' || filterVal === 'Medium' || filterVal === 'Low') {
      setArchiveFilterConfidence(filterVal);
      setArchiveFilterStatus('ALL');
    }
    setActiveView('archive');
  };

  const isExportReady = analystSignoff;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090D16] text-gray-100 overflow-hidden font-sans select-none relative">
      {/* Dynamic Toast Notification Banner (Top-Right non-intrusive) */}
      {notification && (
        <div className="absolute top-16 right-6 z-50 bg-[#111726]/95 border border-emerald-500/80 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-emerald-300 flex items-center space-x-3 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <span className="max-w-md">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white ml-2 text-sm leading-none cursor-pointer p-0.5"
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Persistent Header */}
      <window.TopNavbar
        activeCase={activeCase}
        allCases={allCases}
        onSelectCase={handleSelectCase}
        isExportReady={isExportReady}
        onExportClick={() => setIsReportModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
        mapMode={mapMode}
        setMapMode={setMapMode}
        onOpenRoutePlanner={() => setIsRouteModalOpen(true)}
        onTriggerDeDupDemo={handleTriggerDeDupDemo}
      />

      {/* Main 3-Zone Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Zone: Navigation Sidebar */}
        <window.LeftSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          activeCase={activeCase}
          allCases={allCases}
        />

        {/* Center & Right Zones based on Active View */}
        {activeView === 'dashboard' || activeView === 'active-cases' ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Collapsible Overview Strip */}
            <window.DashboardOverview
              metrics={metrics}
              onNavigateWithFilter={handleNavigateWithFilter}
            />

            <div className="flex-1 flex overflow-hidden relative">
              {/* Center Zone: Interactive Leaflet Map (~65% width) */}
              <main className="flex-1 h-full relative overflow-hidden">
                <window.MapView
                  activeCase={activeCase}
                  allCases={allCases}
                  onSelectCase={handleSelectCase}
                  selectedVesselId={selectedVesselId}
                  onSelectVessel={(vId) => {
                    setSelectedVesselId(vId);
                    if (isSuspectPanelCollapsed) setIsSuspectPanelCollapsed(false);
                  }}
                  timelineProgress={timelineProgress}
                  isPlaying={isPlaying}
                  mapMode={mapMode}
                  setMapMode={setMapMode}
                  forecast={forecast}
                  forwardOffset={forwardOffset}
                  setForwardOffset={setForwardOffset}
                  routeData={routeData}
                  isRouteActive={isRouteActive}
                  setIsRouteActive={setIsRouteActive}
                  environmentalData={environmentalData}
                />
              </main>

              {/* Right Zone: Suspect Vessel / Forecast / Estimator Panel (~35% width) */}
              {activeCase && mapMode === 'single' && (
                <window.SuspectPanel
                  suspects={activeCase.suspects}
                  selectedVesselId={selectedVesselId}
                  onSelectVessel={setSelectedVesselId}
                  reviewedVessels={reviewedVessels}
                  onToggleReview={handleToggleReview}
                  analystSignoff={analystSignoff}
                  onToggleSignoff={handleToggleSignoff}
                  collapsed={isSuspectPanelCollapsed}
                  setCollapsed={setIsSuspectPanelCollapsed}
                  activeTab={rightPanelTab}
                  setActiveTab={setRightPanelTab}
                  activeCase={activeCase}
                  forecast={forecast}
                  forwardOffset={forwardOffset}
                  setForwardOffset={setForwardOffset}
                  onOpenRoutePlanner={() => {
                    setIsRouteActive(true);
                    setIsRouteModalOpen(true);
                  }}
                  estimateData={estimateData}
                  onUpdateThickness={handleUpdateThickness}
                />
              )}
            </div>
          </div>
        ) : activeView === 'archive' ? (
          <window.CaseArchiveView
            onSelectCase={async (cId) => {
              await handleSelectCase(cId);
              setActiveView('dashboard');
            }}
            setActiveView={setActiveView}
            initialFilterStatus={archiveFilterStatus}
            initialFilterConfidence={archiveFilterConfidence}
          />
        ) : (
          <div className="flex-1 bg-[#090D16] p-8 flex items-center justify-center font-mono text-xs text-gray-400">
            <div className="bg-[#111726] border border-[#26334D] p-6 rounded-xl text-center space-y-3 max-w-md shadow-2xl">
              <h2 className="text-sm font-bold text-gray-200 uppercase">SpillTraceDB System Architecture</h2>
              <p className="text-[11px] text-gray-400 font-sans">
                Persistent storage engine powered by IndexedDB & REST API services. Manages relational tables for SAR detections, hydrodynamic backtrack decay polygons, AIS blackout gaps, and analyst sign-off logs.
              </p>
              <div className="pt-2 text-emerald-400 font-bold">
                ✓ SpillTraceDB Active • 100% Persistence Verified
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Zone: Timeline Scrubber */}
      {(activeView === 'dashboard' || activeView === 'active-cases') && activeCase && mapMode === 'single' && (
        <window.TimelineScrubber
          activeCase={activeCase}
          timelineProgress={timelineProgress}
          setTimelineProgress={setTimelineProgress}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}

      {/* Report Modal Preview */}
      <window.ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeCase={activeCase}
        reviewedVessels={reviewedVessels}
        analystSignoff={analystSignoff}
      />

      {/* New Incident Case Modal */}
      <window.NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />

      {/* Weather-Aware Response Route Modal */}
      <window.ResponseRouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        activeCase={activeCase}
        bases={responseBases}
        selectedBaseId={selectedBaseId}
        onSelectBase={handleSelectBase}
        routeData={routeData}
        isRouteActive={isRouteActive}
        setIsRouteActive={setIsRouteActive}
      />
    </div>
  );
}

// Render React Root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
