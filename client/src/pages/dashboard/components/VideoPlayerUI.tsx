import { Play, Pause, RotateCcw, Volume2, VolumeX, Users } from 'lucide-react';
import { useEffect } from 'react';
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
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const {
    containerRef, isPlaying, isEnded, progress, progressInSeconds,
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

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Bubble isLiveMode up to the parent so LessonTabs can react
  useEffect(() => {
    onLiveModeChange?.(isLiveMode);
  }, [isLiveMode, onLiveModeChange]);

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative aspect-video group">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 z-10" />

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
            <div className="text-5xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
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

      <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-300 ${(!isPlaying && progress > 0 && !isLiveMode && !isWaiting) ? 'opacity-100' : 'opacity-0'}`}>
        {isEnded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-white/40 text-sm font-medium uppercase tracking-widest">Video Complete</div>
              <div className="text-white/20 text-xs">Click play to rewatch</div>
            </div>
          </div>
        )}
      </div>

      <div className={`absolute inset-0 z-30 transition-opacity flex flex-col justify-end p-6 pointer-events-none ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4 pointer-events-auto">

          {!isLiveMode && (
            <button onClick={togglePlay} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-blue-500 transition-all shadow-lg flex-shrink-0">
              {isEnded ? <RotateCcw size={20} /> : isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>
          )}

          <div className="flex items-center gap-2 group/volume cursor-pointer bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors flex-shrink-0">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-blue-500 h-1 cursor-pointer origin-left" />
          </div>

          {isLiveMode ? (
            <div className="flex-1 flex justify-end items-center">
              <div className="text-white text-xs font-mono bg-red-500/20 text-red-100 px-3 py-2 rounded-full border border-red-500/20 backdrop-blur-md">
                Live: {formatTime(progressInSeconds)}
              </div>
            </div>
          ) : (
            <>
              {isUnlocked ? (
                <div className="flex-1 relative ml-2 flex items-center h-2 group/progress cursor-pointer">
                  <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden ml-2">
                  <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
              )}
              <span className="text-white text-sm font-bold w-12 text-right flex-shrink-0">{progress}%</span>
            </>
          )}

        </div>
      </div>
    </div>
  );
};