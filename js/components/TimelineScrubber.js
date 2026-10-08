/**
 * SpillTrace AI — Timeline Scrubber & Animation Controller
 */

window.TimelineScrubber = function TimelineScrubber({
  activeCase,
  timelineProgress, // 0 to 1
  setTimelineProgress,
  isPlaying,
  setIsPlaying
}) {
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1); // 1x, 2x, 4x

  // Auto-play animation timer loop
  React.useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineProgress(prev => {
          const next = prev + 0.015 * playbackSpeed;
          if (next >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, setTimelineProgress, setIsPlaying]);

  // Format timestamps based on timeline window
  const timeWindow = activeCase?.origin_zone?.time_window || {
    start: "2026-09-03T06:00:00Z",
    end: "2026-09-03T14:30:00Z"
  };

  const getScrubbedTimeLabel = () => {
    const startMs = new Date(timeWindow.start).getTime();
    const endMs = new Date(timeWindow.end).getTime();
    const currentMs = startMs + (endMs - startMs) * timelineProgress;
    const d = new Date(currentMs);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
  };

  return (
    <footer className="h-16 bg-[#111726]/95 border-t border-[#26334D] px-4 flex items-center justify-between z-30 select-none font-mono text-xs shadow-2xl">
      {/* Left: Playback Controls */}
      <div className="flex items-center space-x-3 w-48">
        <button
          onClick={() => {
            if (timelineProgress >= 1) setTimelineProgress(0);
            setIsPlaying(!isPlaying);
          }}
          className="w-9 h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
          title={isPlaying ? "Pause Replay" : "Play Backtrack Replay"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Speed Toggle */}
        <div className="flex bg-[#182032] border border-[#26334D] rounded-md p-0.5 text-[10px]">
          {[1, 2, 4].map(spd => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded ${playbackSpeed === spd ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Center: Timeline Slider */}
      <div className="flex-1 mx-6 flex flex-col justify-center space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Release Window: {timeWindow.start.slice(11, 16)} UTC</span>
          <span className="text-cyan-400 font-bold tracking-wider text-xs">
            ▶ RECONSTRUCTION TIME: {getScrubbedTimeLabel()}
          </span>
          <span>Detection: {timeWindow.end.slice(11, 16)} UTC</span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={timelineProgress}
            onChange={(e) => {
              setTimelineProgress(parseFloat(e.target.value));
              if (isPlaying) setIsPlaying(false);
            }}
            className="w-full h-2 bg-[#182032] rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-[#26334D]"
          />
        </div>
      </div>

      {/* Right: Reset / Jump Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setTimelineProgress(0);
            setIsPlaying(false);
          }}
          className="px-2.5 py-1 bg-[#182032] hover:bg-gray-800 text-gray-300 border border-[#26334D] rounded text-[11px] transition-colors"
        >
          Reset to Start
        </button>
        <button
          onClick={() => {
            setTimelineProgress(1);
            setIsPlaying(false);
          }}
          className="px-2.5 py-1 bg-[#182032] hover:bg-gray-800 text-gray-300 border border-[#26334D] rounded text-[11px] transition-colors"
        >
          Jump to End
        </button>
      </div>
    </footer>
  );
};
