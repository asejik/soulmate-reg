import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, PlayCircle, PictureInPicture2 } from 'lucide-react';
import { useYouTubePlayer } from '../../../hooks/useYouTubePlayer';
import { usePictureInPicture } from '../../../hooks/usePictureInPicture';

interface Props {
  videoId: string;
}

const ActivePlayer = ({ videoId }: { videoId: string }) => {
  const [showHUD, setShowHUD] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    containerRef, isPlaying, isEnded, togglePlay, progress, volume, isMuted, handleVolumeChange, toggleMute, handleSeek
  } = useYouTubePlayer({
    videoId: videoId,
    onProgressChange: () => {},
    onComplete: () => {},
  });

  const { isPiP, isSupported: isPiPSupported, togglePiP, patchIframe } = usePictureInPicture(containerRef);

  useEffect(() => { patchIframe(); }, [patchIframe]);

  const resetHideTimer = () => {
    setShowHUD(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => setShowHUD(false), 3000);
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isPlaying]);

  const handleMaskClick = () => {
    if (!showHUD) {
      setShowHUD(true);
      resetHideTimer();
    } else {
      togglePlay();
    }
  };

  return (
    <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group" onMouseMove={resetHideTimer}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Interaction Mask: Toggles HUD/Play and blocks YouTube UI */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={handleMaskClick} 
      />
      
      {/* Custom HUD */}
      <div className={`absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 z-20 ${showHUD ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4">
          {/* Progress bar */}
          <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
            e.stopPropagation(); // Don't trigger togglePlay
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            handleSeek((x / rect.width) * 100);
            resetHideTimer();
          }}>
            <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); resetHideTimer(); }} className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-all">
                {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              
              <div className="flex items-center gap-2 group/volume">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); resetHideTimer(); }} className="text-white/80 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="w-0 group-hover/volume:w-20 transition-all duration-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="range" min="0" max="100" value={isMuted ? 0 : volume} 
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-white/60 text-sm font-medium">
              {Math.round(progress)}%
            </div>

            {isPiPSupported && (
              <button
                onClick={(e) => { e.stopPropagation(); togglePiP(); resetHideTimer(); }}
                title={isPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
                className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all backdrop-blur-md ${
                  isPiP
                    ? 'bg-blue-500/30 border-blue-500/60 text-blue-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <PictureInPicture2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const IntroVideoCard = ({ videoId }: Props) => {
  const [isStarted, setIsStarted] = useState(false);

  if (!videoId) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Introductory Video</h3>
        {isStarted && (
          <button onClick={() => setIsStarted(false)} className="text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
            Close Player
          </button>
        )}
      </div>

      {!isStarted ? (
        <div 
          className="relative w-full aspect-video rounded-3xl overflow-hidden group cursor-pointer border border-white/5 hover:border-white/10 transition-all shadow-xl"
          onClick={() => setIsStarted(true)}
        >
          <img src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} alt="Course Intro" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500 border border-white/10">
              <PlayCircle size={48} className="fill-white/80" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Watch Introduction</h2>
            <p className="text-white/70 text-sm md:text-base max-w-md">Start your journey here with a quick welcome video about the program.</p>
          </div>

          <div className="absolute bottom-6 right-6">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
              Standalone Content
            </span>
          </div>
        </div>
      ) : (
        <ActivePlayer videoId={videoId} />
      )}
    </div>
  );
};
