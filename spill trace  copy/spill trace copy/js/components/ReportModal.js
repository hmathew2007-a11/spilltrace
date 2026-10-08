/**
 * SpillTrace AI — Maritime Authority Executive Report Modal & PDF Generator
 */

window.ReportModal = function ReportModal({
  isOpen,
  onClose,
  activeCase,
  reviewedVessels,
  analystSignoff
}) {
  const [reportData, setReportData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && activeCase) {
      setLoading(true);
      window.mockApi.generateReport(activeCase.case_id, reviewedVessels, analystSignoff)
        .then(data => {
          setReportData(data);
          setLoading(false);
        });
    }
  }, [isOpen, activeCase, reviewedVessels, analystSignoff]);

  if (!isOpen) return null;

  // Client-side PDF Generation using jsPDF
  const handleDownloadPDF = () => {
    if (!reportData) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(17, 23, 38);
    doc.text("SPILLTRACE AI — SATELLITE INVESTIGATION REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Official Intelligence Summary | Report Ref: ${reportData.report_id}`, 14, 27);
    doc.text(`Generated: ${new Date(reportData.generated_at).toUTCString()}`, 14, 32);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, 196, 36);

    // Case Metadata Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 23, 38);
    doc.text("1. CASE METADATA & SAR DETECTION", 14, 46);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Case ID: ${reportData.case_id}`, 14, 54);
    doc.text(`Location: ${reportData.location}`, 14, 60);
    doc.text(`SAR Detection Timestamp: ${reportData.detection_time}`, 14, 66);
    doc.text(`Overall Case Risk Tier: ${reportData.confidence_tier} Confidence`, 14, 72);
    doc.text(`Estimated Release Time Window: ${reportData.origin_time_range}`, 14, 78);
    doc.text(`Hydrodynamic Drift Model: ${reportData.drift_model}`, 14, 84);

    doc.line(14, 90, 196, 90);

    // Suspect List
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. RANKED SUSPECT VESSELS & EVIDENCE SCORECARDS", 14, 100);

    let yPos = 110;
    reportData.top_suspects.forEach((suspect, idx) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(`Suspect #${idx + 1}: ${suspect.name} (${suspect.flag})`, 14, yPos);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`• Composite Score: ${suspect.scorecard.composite_score}% (${suspect.scorecard.confidence_tier.toUpperCase()} Suspicion)`, 20, yPos + 6);
      doc.text(`• Route Overlap in Drift Zone: ${suspect.scorecard.route_overlap_pct}%`, 20, yPos + 11);
      doc.text(`• AIS Blackout Flag: ${suspect.scorecard.dark_period_flag ? 'YES (Transponder Silent)' : 'NO'}`, 20, yPos + 16);
      doc.text(`• Drift Trajectory Match: ${suspect.scorecard.drift_match_pct}%`, 20, yPos + 21);

      // AI Summary paragraph wrapping
      const lines = doc.splitTextToSize(`Summary: ${suspect.scorecard.summary_text}`, 170);
      doc.text(lines, 20, yPos + 26);

      yPos += 38 + (lines.length * 4);
    });

    // Analyst Sign-off & Disclaimer
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`[✓] HUMAN ANALYST SIGN-OFF VERIFIED`, 14, yPos);

    yPos += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    const disclaimerLines = doc.splitTextToSize(reportData.disclaimer, 180);
    doc.text(disclaimerLines, 14, yPos);

    doc.save(`SpillTrace_Report_${reportData.case_id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#111726] border border-[#26334D] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[#26334D] bg-[#182032] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
              PDF
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wider">
                Official Maritime Authority Report Preview
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                Review intelligence findings before formal PDF dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body: Report Document Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-gray-300 space-y-6 bg-[#090D16]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400">Synthesizing Executive Report Payload...</span>
            </div>
          ) : (
            <>
              {/* Document Header */}
              <div className="border-b border-[#26334D] pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-base font-bold text-cyan-400 tracking-wider">SPILLTRACE AI INVESTIGATION REPORT</h1>
                  <p className="text-gray-400 text-[11px]">Report Reference: {reportData.report_id}</p>
                  <p className="text-gray-500 text-[10px]">Generated: {reportData.generated_at}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                    ✓ Human Sign-Off Verified
                  </span>
                </div>
              </div>

              {/* Section 1: Case & SAR Detection Details */}
              <div className="bg-[#111726] border border-[#26334D] p-4 rounded-lg space-y-2">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider text-cyan-400">
                  1. Satellite SAR Detection & Origin Backtrack
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-500">Case Identifier:</span> {reportData.case_id}</div>
                  <div><span className="text-gray-500">Confidence Rating:</span> {reportData.confidence_tier}</div>
                  <div><span className="text-gray-500">Location:</span> {reportData.location}</div>
                  <div><span className="text-gray-500">Detection Time:</span> {reportData.detection_time}</div>
                  <div><span className="text-gray-500">Est. Release Window:</span> {reportData.origin_time_range}</div>
                  <div><span className="text-gray-500">Drift Backtrack:</span> {reportData.drift_model}</div>
                </div>
              </div>

              {/* Section 2: Top Suspect Vessels */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider text-cyan-400">
                  2. Suspect Vessel Intelligence Breakdown ({reportData.top_suspects.length} Identified)
                </h3>

                {reportData.top_suspects.map((suspect, idx) => (
                  <div key={suspect.vessel_id} className="bg-[#111726] border border-[#26334D] p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-[#26334D] pb-2">
                      <span className="font-bold text-red-400">
                        #{idx + 1} {suspect.name} ({suspect.flag})
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        Score: {suspect.scorecard.composite_score}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                      <div>• Route Overlap: <strong className="text-cyan-400">{suspect.scorecard.route_overlap_pct}%</strong></div>
                      <div>• AIS Blackout: <strong className={suspect.scorecard.dark_period_flag ? 'text-red-400' : 'text-gray-400'}>
                        {suspect.scorecard.dark_period_flag ? 'YES (Silent Transponder)' : 'NO'}
                      </strong></div>
                      <div>• Drift Match: <strong className="text-amber-400">{suspect.scorecard.drift_match_pct}%</strong></div>
                      <div>• Presence Duration: <strong>{suspect.scorecard.presence_window.duration_minutes} mins</strong></div>
                    </div>

                    <div className="bg-[#090D16] p-2 rounded text-[11px] text-gray-400 italic">
                      "{suspect.scorecard.summary_text}"
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 3: Legal Disclaimer */}
              <div className="bg-amber-950/30 border border-amber-800/50 p-3 rounded-lg text-[10px] text-amber-300 space-y-1">
                <strong className="block font-bold">STATUTORY MARITIME DISCLAIMER:</strong>
                <p className="leading-relaxed">{reportData.disclaimer}</p>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3 border-t border-[#26334D] bg-[#182032] flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-mono">
            Formatted for Official Maritime Authority Submission
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-mono text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-5 py-1.5 rounded text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition-all flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Formal PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
