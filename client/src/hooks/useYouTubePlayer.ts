// client/src/hooks/useYouTubePlayer.ts

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId:          string;
  onProgressChange: (percent: number) => void;
  onComplete:       () => void;
}

interface UseYouTubePlayerReturn {
  containerRef:       RefObject<HTMLDivElement | null>;
  isPlaying:          boolean;
  isEnded:            boolean;
  togglePlay:         () => void;
  progress:           number;
  volume:             number;
  isMuted:            boolean;
  handleVolumeChange: (newVolume: number) => void;
  toggleMute:         () => void;
  // --- NEW: Expose the Seek function ---
  handleSeek:         (percent: number) => void;
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
  onProgressChange,
  onComplete,
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const containerRef    = useRef<HTMLDivElement>(null);
  const playerRef       = useRef<any>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded,   setIsEnded]   = useState(false);
  const [progress,  setProgress]  = useState(0);

  const [volume, setVolume]   = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const onProgressRef = useRef(onProgressChange);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onProgressRef.current = onProgressChange; }, [onProgressChange]);
  useEffect(() => { onCompleteRef.current = onComplete; },       [onComplete]);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width:  '100%',
        height: '100%',
        playerVars: {
          modestbranding: 1,
          rel:            0,
          controls:       0,
          disablekb:      1,
          fs:             0,
          iv_load_policy: 3,
          playsinline:    1,
          showinfo:       0,
        },
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

                const pct = Math.round((current / duration) * 100);
                setProgress(pct);
                onProgressRef.current(pct);

                if (pct >= 98 && !hasCompletedRef.current) {
                  hasCompletedRef.current = true;
                  playerRef.current.pauseVideo();
                  setProgress(100);
                  onProgressRef.current(100);
                  onCompleteRef.current();
                }
              }, 1000);

            } else {
              setIsPlaying(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                playerRef.current?.pauseVideo();
                setIsEnded(true);
                if (!hasCompletedRef.current) {
                  hasCompletedRef.current = true;
                  setProgress(100);
                  onProgressRef.current(100);
                  onCompleteRef.current();
                }
              }

              if (
                event.data === window.YT.PlayerState.PAUSED &&
                hasCompletedRef.current
              ) {
                setIsEnded(true);
              }
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      if (hasCompletedRef.current) {
        hasCompletedRef.current = false;
        setIsEnded(false);
        setProgress(0);
        playerRef.current.seekTo(0);
      }
      playerRef.current.playVideo();
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
      if (volume === 0) {
        setVolume(100);
        if (playerRef.current.setVolume) playerRef.current.setVolume(100);
      }
    } else {
      if (playerRef.current.mute) playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // --- NEW: Calculate the exact second to seek to based on percentage ---
  const handleSeek = (percent: number) => {
    if (!playerRef.current || !playerRef.current.getDuration) return;
    const duration = playerRef.current.getDuration();
    if (duration > 0) {
      const seekTime = (percent / 100) * duration;
      playerRef.current.seekTo(seekTime, true);
      setProgress(percent);
    }
  };

  return {
    containerRef, isPlaying, isEnded, togglePlay, progress,
    volume, isMuted, handleVolumeChange, toggleMute, handleSeek
  };
}