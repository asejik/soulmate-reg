import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId:            string;
  scheduledStartTime?: string | null;
  hasQuiz?:           boolean;
  initialTime?:       number; // <-- Resume position
  onProgressChange:   (percent: number) => void;
  onTimeUpdate?:      (seconds: number, percent: number) => void; // <-- Auto-save callback
  onComplete:         () => void;
  isCompleted?:       boolean;
}

interface UseYouTubePlayerReturn {
  containerRef:       RefObject<HTMLDivElement | null>;
  isPlaying:          boolean;
  isEnded:            boolean;
  togglePlay:         () => void;
  progress:           number;
  progressInSeconds:  number; // <-- MM:SS tracking
  volume:             number;
  isMuted:            boolean;
  handleVolumeChange: (newVolume: number) => void;
  toggleMute:         () => void;
  handleSeek:         (percent: number) => void;
  isLiveMode:         boolean;
  isWaiting:          boolean;
  timeLeft:           number;
  playbackRate:       number;
  handlePlaybackRate: (rate: number) => void;
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    if (window.onYouTubeIframeAPIReady) {
      const existing = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { existing(); resolve(); };
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement('script');
    script.src   = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
}

export function useYouTubePlayer({
  videoId,
  scheduledStartTime,
  initialTime = 0,
  onProgressChange,
  onTimeUpdate,
  onComplete,
  isCompleted = false,
  hasQuiz = false,
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const containerRef    = useRef<HTMLDivElement>(null);
  const playerRef       = useRef<any>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const lastSavedTime   = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded,   setIsEnded]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [progressInSeconds, setProgressInSeconds] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isWaiting, setIsWaiting]   = useState(false);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [volume, setVolume]   = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const onProgressRef = useRef(onProgressChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onProgressRef.current = onProgressChange; }, [onProgressChange]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Standalone Live Engine logic (updates countdown regardless of playing state)
  useEffect(() => {
    if (!scheduledStartTime || hasCompletedRef.current) return;
    const interval = setInterval(() => {
      const startTimeMs = new Date(scheduledStartTime).getTime();
      const videoStartTimeMs = startTimeMs + (hasQuiz ? 10 * 60 * 1000 : 0);
      const nowMs = Date.now();
      const offsetSec = (nowMs - videoStartTimeMs) / 1000;

      if (offsetSec < 0) {
        setIsWaiting(true);
        setIsLiveMode(false);
        setTimeLeft(Math.abs(Math.floor(offsetSec)));
        
        // Pause if it somehow started playing during the wait
        if (playerRef.current && playerRef.current.getPlayerState) {
           if (playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING) {
             playerRef.current.pauseVideo();
           }
        }
      } else if (offsetSec >= 0 && offsetSec < 3) {
        // Auto-play exactly when countdown ends
        setIsWaiting(false);
        if (playerRef.current && playerRef.current.getPlayerState) {
           if (playerRef.current.getPlayerState() !== window.YT?.PlayerState?.PLAYING) {
             playerRef.current.playVideo();
           }
        }
      } else {
        setIsWaiting(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledStartTime, hasQuiz]);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width:  '100%',
        height: '100%',
        playerVars: { controls: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1, showinfo: 0, start: initialTime > 0 ? Math.floor(initialTime) : 0 },
        events: {
          onReady: (event: any) => {
            if (event.target && event.target.getVolume) {
              setVolume(event.target.getVolume());
              setIsMuted(event.target.isMuted());
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsEnded(false);

              intervalRef.current = setInterval(() => {
                if (!playerRef.current) return;
                const current  = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();
                if (!duration) return;

                 setProgressInSeconds(current);

                 // --- SIMULATED LIVE ENGINE (Running while Playing) ---
                 if (scheduledStartTime && !hasCompletedRef.current) {
                   const startTimeMs = new Date(scheduledStartTime).getTime();
                   const videoStartTimeMs = startTimeMs + (hasQuiz ? 10 * 60 * 1000 : 0);
                   const nowMs = Date.now();
                   const offsetSec = (nowMs - videoStartTimeMs) / 1000;

                   if (offsetSec >= 0 && offsetSec < duration) {
                     setIsLiveMode(true);
                     setIsWaiting(false);
                     if (Math.abs(offsetSec - current) > 3) playerRef.current.seekTo(offsetSec, true);
                   }
                 }

                 // Progress Tracking & Auto-Save
                 const pct = Math.round((current / duration) * 100);
                 setProgress(pct);
                 onProgressRef.current(pct);

                 const roundedSec = Math.floor(current);
                 if (roundedSec > 0 && roundedSec % 5 === 0 && roundedSec !== lastSavedTime.current) {
                   lastSavedTime.current = roundedSec;
                   if (onTimeUpdateRef.current) onTimeUpdateRef.current(current, pct);
                 }

                 if (pct >= 98 && !hasCompletedRef.current) {
                   hasCompletedRef.current = true;
                   // Do NOT pause here — let the video play to its natural end.
                   // The ENDED event handler below will pause and show the completion overlay.
                   setIsLiveMode(false);
                   setIsWaiting(false);
                   setProgress(100);
                   onProgressRef.current(100);
                   onCompleteRef.current();
                 }
               }, 1000);

            } else {
              setIsPlaying(false);
              if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

              if (event.data === window.YT.PlayerState.ENDED) {
                playerRef.current?.pauseVideo();
                setIsEnded(true);
                setIsLiveMode(false);
                if (!hasCompletedRef.current) {
                  hasCompletedRef.current = true;
                  setProgress(100);
                  onProgressRef.current(100);
                  onCompleteRef.current();
                }
              }
              if (event.data === window.YT.PlayerState.PAUSED && hasCompletedRef.current) setIsEnded(true);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
    };
  }, [videoId, scheduledStartTime, initialTime]);



  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      if (isLiveMode) return;
      playerRef.current.pauseVideo();
    } else {
      if (hasCompletedRef.current) {
        hasCompletedRef.current = false;
        setIsEnded(false); setProgress(0); playerRef.current.seekTo(0);
      }
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (percent: number) => {
    if (isLiveMode) return;
    if (!playerRef.current || !playerRef.current.getDuration) return;
    const duration = playerRef.current.getDuration();
    if (duration > 0) {
      const seekTime = (percent / 100) * duration;
      playerRef.current.seekTo(seekTime, true);
      setProgress(percent);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        if (playerRef.current.unMute) playerRef.current.unMute();
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      if (playerRef.current.unMute) playerRef.current.unMute();
      setIsMuted(false);
      if (volume === 0) { setVolume(100); if (playerRef.current.setVolume) playerRef.current.setVolume(100); }
    } else {
      if (playerRef.current.mute) playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handlePlaybackRate = (rate: number) => {
    if (!isCompleted) return; // Only allow speed changes if completed (replay)
    setPlaybackRate(rate);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  return { containerRef, isPlaying, isEnded, togglePlay, progress, progressInSeconds, volume, isMuted, handleVolumeChange, toggleMute, handleSeek, isLiveMode, isWaiting, timeLeft, playbackRate, handlePlaybackRate };
}