/**
 * SpillTrace AI — New Incident Case Creation Modal
 */

window.NewCaseModal = function NewCaseModal({
  isOpen,
  onClose,
  onCaseCreated
}) {
  const [name, setName] = React.useState('');
  const [lat, setLat] = React.useState('54.25');
  const [lng, setLng] = React.useState('3.80');
  const [volume, setVolume] = React.useState('450');
  const [thickness, setThickness] = React.useState('250');
  const [creating, setCreating] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setCreating(true);

    const latitude = parseFloat(lat) || 54.25;
    const longitude = parseFloat(lng) || 3.80;
    const vol = parseInt(volume, 10) || 450;
    const thick = parseInt(thickness, 10) || 250;

    window.mockApi.createCase(name, latitude, longitude, vol, thick)
      .then(newCase => {
        setCreating(false);
        onCaseCreated(newCase);
        onClose();
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#111726] border border-[#26334D] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs text-gray-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#26334D] bg-[#182032] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Create New Satellite Incident Case
            </h2>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#090D16]">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Incident Name / Region</label>
            <input
              type="text"
              required
              placeholder="e.g. Celtic Sea Tanker Spill"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#182032] text-white border border-[#26334D] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Target Latitude (°N)</label>
              <input
                type="number"
                step="0.001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-[#182032] text-white border border-[#26334D] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Target Longitude (°E)</label>
              <input
                type="number"
                step="0.001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-[#182032] text-white border border-[#26334D] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Estimated Discharge Volume (m³)</label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full bg-[#182032] text-white border border-[#26334D] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Estimated Layer Thickness (µm)</label>
              <input
                type="number"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                className="w-full bg-[#182032] text-white border border-[#26334D] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-0.5">
            <span className="text-[10px] text-gray-500 font-sans">Thickness Presets:</span>
            {[
              { label: '35 µm (Sheen)', val: '35' },
              { label: '150 µm (Medium)', val: '150' },
              { label: '350 µm (Heavy)', val: '350' }
            ].map(p => (
              <button
                type="button"
                key={p.val}
                onClick={() => setThickness(p.val)}
                className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${thickness === p.val ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold' : 'bg-[#182032] text-gray-400 border-[#26334D] hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-[#111726] border border-[#26334D] p-3 rounded-lg text-[10px] text-gray-400 space-y-1">
            <span className="text-cyan-400 font-bold block">AUTOMATED PIPELINE EXECUTION:</span>
            <p>
              Submitting will initiate Sentinel-1 C-Band SAR feature extraction, launch reverse hydrodynamic drift modeling, and correlate radar targets with historical AIS tracks into SpillTraceDB.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/30 flex items-center space-x-2"
            >
              {creating ? (
                <span>Simulating Backtrack...</span>
              ) : (
                <span>Initiate Case & Store to DB</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
