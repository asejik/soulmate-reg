import { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { useYouTubePlayer } from '../../../hooks/useYouTubePlayer';

interface Props {
  videoId: string;
}

export const IntroVideoCard = ({ videoId }: Props) => {
  const [isStarted, setIsStarted] = useState(false);

  const {
    containerRef, isPlaying, isEnded, togglePlay, progress, volume, isMuted, handleVolumeChange, toggleMute, handleSeek
  } = useYouTubePlayer({
    videoId: videoId,
    onProgressChange: () => {},
    onComplete: () => {},
  });

  if (!videoId) return null;

  if (!isStarted) {
    return (
      <div className="relative group overflow-hidden rounded-3xl border border-white/5 bg-[#111827] p-8 shadow-2xl transition-all duration-500 hover:border-blue-500/30">
        <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 shadow-lg">
            <PlayCircle size={32} className="group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">Introduction: Start Here</h3>
            <p className="text-slate-400 text-sm">Watch this quick video to get the most out of your learning journey.</p>
          </div>
          <button 
            onClick={() => setIsStarted(true)}
            className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            Watch Intro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Introductory Video</h3>
         <button onClick={() => setIsStarted(false)} className="text-xs text-slate-500 hover:text-white transition-colors">Close Player</button>
      </div>
      
      <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()} />

        {/* Video Overlay Info/Ended State */}
        <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-300 ${(!isPlaying && progress > 0) ? 'opacity-100' : 'opacity-0'}`}>
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-white/40 text-sm font-medium uppercase tracking-widest">Introduction Complete</div>
                <div className="text-white/20 text-xs text-center px-4">You're ready to start your first lesson below!</div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Controls Bar */}
        <div className={`absolute inset-0 z-30 transition-opacity flex flex-col justify-end p-6 pointer-events-none ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4 pointer-events-auto">

            <button onClick={togglePlay} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-blue-500 transition-all shadow-lg flex-shrink-0">
              {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>

            <div className="flex items-center gap-2 group/volume cursor-pointer bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors flex-shrink-0">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-blue-500 h-1 cursor-pointer origin-left" />
            </div>

            <div className="flex-1 relative ml-2 flex items-center h-2 group/progress cursor-pointer">
              <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="text-white text-sm font-bold w-12 text-right flex-shrink-0">{progress}%</span>

          </div>
        </div>
      </div>
    </div>
  );
};
