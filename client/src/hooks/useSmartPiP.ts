import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSmartPiP
 * 
 * A robust Picture-in-Picture hook that supports:
 * 1. Native Document PiP (Chrome/Edge) - Stays on top of other applications.
 * 2. In-App Floating Mode (Fallback) - Stays in the corner while scrolling.
 * 
 * Fix for Error 153: We inject the origin and widget_referrer into the 
 * YT.Player instance in the new window so YouTube validates the embed correctly.
 */
export function useSmartPiP(
  videoId: string, 
  playerInstance: any, 
  onToggle?: (isActive: boolean) => void
) {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'native' | 'floating' | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const isNativeSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const closePiP = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
    setIsActive(false);
    setMode(null);
    onToggle?.(false);
  }, [onToggle]);

  const togglePiP = useCallback(async () => {
    if (isActive) {
      closePiP();
      return;
    }

    if (isNativeSupported) {
      try {
        const currentTime = playerInstance?.getCurrentTime?.() || 0;
        playerInstance?.pauseVideo?.();

        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 640,
          height: 360,
        });

        pipWindowRef.current = pipWindow;
        pipWindow.document.title = "Soulmate Program - PiP";

        // Fix for YouTube Security: Inject correct origin context
        const base = pipWindow.document.createElement('base');
        base.href = window.location.origin;
        pipWindow.document.head.append(base);

        const style = pipWindow.document.createElement('style');
        style.textContent = `
          body { margin: 0; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
          #player { width: 100%; height: 100%; }
        `;
        pipWindow.document.head.append(style);

        const container = pipWindow.document.createElement('div');
        container.id = 'player';
        pipWindow.document.body.append(container);

        const script = pipWindow.document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        pipWindow.document.head.append(script);

        (pipWindow as any).onYouTubeIframeAPIReady = () => {
          new (pipWindow as any).YT.Player('player', {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              start: Math.floor(currentTime),
              origin: window.location.origin,
              widget_referrer: window.location.href,
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0
            },
            events: {
              onReady: (e: any) => e.target.playVideo()
            }
          });
        };

        pipWindow.addEventListener('pagehide', () => {
          setIsActive(false);
          setMode(null);
          onToggle?.(false);
        });

        setIsActive(true);
        setMode('native');
        onToggle?.(true);
        return;
      } catch (err) {
        console.error('PiP Error:', err);
      }
    }

    // Fallback
    setIsActive(true);
    setMode('floating');
    onToggle?.(true);
  }, [isActive, isNativeSupported, videoId, playerInstance, closePiP, onToggle]);

  useEffect(() => {
    return () => {
      if (pipWindowRef.current) pipWindowRef.current.close();
    };
  }, []);

  return { isActive, mode, togglePiP, closePiP };
}
