import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Users, Lock } from 'lucide-react';
import { useYouTubePlayer } from '../../../hooks/useYouTubePlayer';
import { postLMS } from '../../../lib/api';
import type { LessonData } from '../LessonPage';

interface Props {
  lesson: LessonData;
  isUnlocked: boolean;
  setIsUnlocked: (v: boolean) => void;
  onLiveModeChange?: (live: boolean) => void;
  participantCount?: number;
}

export const VideoPlayerUI = ({ lesson, isUnlocked, setIsUnlocked, onLiveModeChange, participantCount = 0 }: Props) => {
  const [showHUD, setShowHUD] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 48h closure countdown — ticks every second from closing_at
  const [closureSecs, setClosureSecs] = useState<number>(0);
  useEffect(() => {
    if (!lesson.closing_at) return;
    const calcSecs = () => Math.max(0, Math.floor((new Date(lesson.closing_at!).getTime() - Date.now()) / 1000));
    setClosureSecs(calcSecs());
    const iv = setInterval(() => setClosureSecs(calcSecs()), 1000);
    return () => clearInterval(iv);
  }, [lesson.closing_at]);

  const {
    containerRef, isPlaying, isEnded, progress,
    isLiveMode, isWaiting, timeLeft, volume, isMuted, togglePlay, handleSeek, toggleMute, handleVolumeChange
  } = useYouTubePlayer({
    videoId: lesson.videoId,
    scheduledStartTime: lesson.scheduled_start_time,
    initialTime: lesson.last_watched_seconds,
    onProgressChange: (pct) => { if (pct >= 80) setIsUnlocked(true); },
    onTimeUpdate: (seconds, percent) => {
      postLMS(`/lms/lessons/${lesson.id}/progress`, { seconds, percent })
        .then(() => console.log(`Saved: ${seconds}s at ${percent}%`))
        .catch((err) => console.error("SAVE FAILED:", err));
    },
    onComplete: () => setIsUnlocked(true),
  });

  const resetHideTimer = () => {
    setShowHUD(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isPlaying && !isWaiting) {
      timeoutRef.current = setTimeout(() => setShowHUD(false), 3000);
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isPlaying, isWaiting]);

  const handleMaskClick = () => {
    if (isWaiting) return;
    if (!showHUD) {
      setShowHUD(true);
      resetHideTimer();
    } else {
      togglePlay();
    }
  };

  const formatCountdown = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    parts.push(`${h.toString().padStart(2, '0')}h`);
    parts.push(`${m.toString().padStart(2, '0')}m`);
    parts.push(`${s.toString().padStart(2, '0')}s`);
    
    return parts.join(' ');
  };

  useEffect(() => {
    onLiveModeChange?.(isLiveMode);
  }, [isLiveMode, onLiveModeChange]);

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group" onMouseMove={resetHideTimer}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Interaction Mask: Toggles HUD/Play and blocks YouTube UI */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={handleMaskClick} 
      />

      {/* 48h Closure Countdown Banner — shown after live ends, before lock */}
      {lesson.closing_at && closureSecs > 0 && !isWaiting && !isLiveMode && (
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm py-1.5 px-4 text-amber-950 text-[11px] font-bold pointer-events-none">
          <Lock size={11} className="flex-shrink-0" />
          <span>Access closes in <span className="font-mono">{formatCountdown(closureSecs)}</span></span>
        </div>
      )}

      {isLiveMode && (
        <>
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-50 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded font-bold text-[8px] sm:text-[10px] tracking-widest shadow-xl animate-pulse uppercase">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" /> LIVE SESSION
          </div>
          {participantCount > 0 && (
            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/60 backdrop-blur-md text-white rounded border border-white/10 font-bold text-[8px] sm:text-[10px] shadow-xl">
               <Users size={12} className="text-blue-400 sm:w-4 sm:h-4" /> {participantCount} ONLINE
            </div>
          )}
        </>
      )}

      {isWaiting && (
        <div className="absolute inset-0 z-50 bg-[#050510] flex flex-col items-center justify-center space-y-6">
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
              Up Next: Video Premiere
            </div>
            <div className="text-4xl sm:text-6xl md:text-8xl font-black text-white tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              {formatCountdown(timeLeft)}
            </div>
            <p className="mt-8 text-slate-400 font-medium text-center max-w-xs px-4">
              Sit tight! The live session will begin automatically in a few moments.
            </p>
          </div>
          <div className="absolute bottom-10 left-10 right-10 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-amber-500/40 animate-scale-x w-full" />
          </div>
        </div>
      )}

      {/* Completion Overlay */}
      <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-300 pointer-events-none ${(!isPlaying && progress > 0 && !isLiveMode && !isWaiting) ? 'opacity-100' : 'opacity-0'}`}>
        {isEnded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-white/40 text-sm font-medium uppercase tracking-widest">Video Complete</div>
              <div className="text-white/20 text-xs text-center px-4">Great job! You can rewatch or complete your assessment below.</div>
            </div>
          </div>
        )}
      </div>

      {/* HUD Container */}
      <div className={`absolute inset-x-0 bottom-0 z-40 transition-opacity duration-500 flex flex-col justify-end p-4 md:p-6 pb-4 sm:pb-6 ${showHUD ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col gap-3 sm:gap-4">
          {/* Progress Bar (Clickable) */}
          {!isLiveMode && (
            <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              if (!isUnlocked) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              handleSeek((x / rect.width) * 100);
              resetHideTimer();
            }}>
              <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              <input type="range" min="0" max="100" value={progress} readOnly className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); resetHideTimer(); }} 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-blue-500 transition-all shadow-lg flex-shrink-0"
              >
                {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </button>

              <div className="flex items-center gap-2 group/volume bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); resetHideTimer(); }} className="text-white/80 hover:text-white transition-colors flex-shrink-0">
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="w-0 group-hover/volume:w-20 transition-all duration-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-20 accent-blue-500 h-1 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLiveMode ? (
                <div className="text-white text-[10px] sm:text-xs font-bold bg-red-600/20 text-red-100 px-3 py-1.5 border border-red-600/30 rounded-full backdrop-blur-md uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> Live HUD
                </div>
              ) : (
                <div className="text-white/60 text-xs sm:text-sm font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                  {Math.round(progress)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};