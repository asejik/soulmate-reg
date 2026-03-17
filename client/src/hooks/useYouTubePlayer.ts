// client/src/hooks/useYouTubePlayer.ts

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId:          string;
  onProgressChange: (percent: number) => void;
  onComplete:       () => void;
}

interface UseYouTubePlayerReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  isPlaying:    boolean;
  isEnded:      boolean;
  togglePlay:   () => void;
  progress:     number;
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
  const playerRef       = useRef<YT.Player | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false); // prevents multiple onComplete calls

  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded,   setIsEnded]   = useState(false);
  const [progress,  setProgress]  = useState(0);

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
          // FIX 1: loop and playlist removed entirely.
          // We intercept at 98% in the progress interval and
          // pause manually, so YouTube never reaches ENDED state
          // and never renders the end screen.
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {

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

                // FIX 1: Intercept at 98% and pause manually.
                // This stops the video before YouTube fires the
                // ENDED event, which is what triggers the end screen.
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

              // We still handle ENDED as a safety net,
              // but the interval interception above means
              // this should rarely if ever fire.
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

              // FIX 2: Mark as ended when paused too,
              // so LessonPage can render the opaque cover overlay.
              // We only do this after completion so normal mid-video
              // pausing does not trigger the cover.
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
      if (playerRef.current)   playerRef.current.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      // If the video was completed, restart from beginning
      if (hasCompletedRef.current) {
        hasCompletedRef.current = false;
        setIsEnded(false);
        setProgress(0);
        playerRef.current.seekTo(0);
      }
      playerRef.current.playVideo();
    }
  };

  return { containerRef, isPlaying, isEnded, togglePlay, progress };
}