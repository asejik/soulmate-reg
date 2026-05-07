import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSmartPiP
 * 
 * A high-performance Picture-in-Picture hook that supports:
 * 1. Native Document PiP (Chrome/Edge) - Stays on top of other applications.
 * 2. In-App Floating Mode (Safari/Firefox/Fallback) - Stays in the corner while scrolling.
 */
export function useSmartPiP(
  videoId: string, 
  playerInstance: any, // The YT.Player instance from the main UI
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

    // Try Native Document PiP first (Best for multitasking)
    if (isNativeSupported) {
      try {
        const currentTime = playerInstance?.getCurrentTime?.() || 0;
        
        // Pause main player
        playerInstance?.pauseVideo?.();

        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 640,
          height: 360,
        });

        pipWindowRef.current = pipWindow;

        // Setup PiP Window Content
        pipWindow.document.title = "Soulmate Program - Floating Player";
        const style = pipWindow.document.createElement('style');
        style.textContent = `
          body { margin: 0; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
          #player { width: 100%; height: 100%; }
          .loading { color: #555; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        `;
        pipWindow.document.head.append(style);

        const container = pipWindow.document.createElement('div');
        container.id = 'player';
        container.innerHTML = '<div class="loading">Initializing Soulmate Player...</div>';
        pipWindow.document.body.append(container);

        // Inject YouTube API
        const script = pipWindow.document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        pipWindow.document.head.append(script);

        // Initialize Player in new window
        (pipWindow as any).onYouTubeIframeAPIReady = () => {
          new (pipWindow as any).YT.Player('player', {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              start: Math.floor(currentTime),
              controls: 1,
              modestbranding: 1,
              rel: 0
            },
            events: {
              onReady: (e: any) => {
                e.target.playVideo();
              }
            }
          });
        };

        pipWindow.addEventListener('pagehide', () => {
          // When PiP closes, resume main player if desired
          // playerInstance?.seekTo?.(pipPlayerInstance.getCurrentTime());
          // playerInstance?.playVideo?.();
          setIsActive(false);
          setMode(null);
          onToggle?.(false);
        });

        setIsActive(true);
        setMode('native');
        onToggle?.(true);
        return;
      } catch (err) {
        console.error('Failed to open native PiP, falling back to floating mode:', err);
      }
    }

    // Fallback: In-App Floating Mode
    setIsActive(true);
    setMode('floating');
    onToggle?.(true);
  }, [isActive, isNativeSupported, videoId, playerInstance, closePiP, onToggle]);

  // Handle unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) pipWindowRef.current.close();
    };
  }, []);

  return { isActive, mode, togglePiP, closePiP };
}
