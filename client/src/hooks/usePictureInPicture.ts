import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * usePictureInPicture
 *
 * Finds the <video> element inside a YouTube iframe container and
 * requests / exits Picture-in-Picture on it.
 *
 * YouTube embeds render as: containerDiv > iframe > (shadow) > video
 * We access it via containerRef → querySelector('iframe') → contentDocument → querySelector('video').
 *
 * Note: This only works when the page and iframe share the same origin OR when the
 * browser grants access. Modern browsers allow PiP on cross-origin iframes when
 * `allow="picture-in-picture"` is set on the iframe — which the YouTube IFrame API
 * does NOT set by default. Our workaround is to patch the attribute after the player
 * is created, then grab the video element.
 */
export function usePictureInPicture(containerRef: RefObject<HTMLDivElement | null>) {
  const [isPiP, setIsPiP] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support once on mount
  useEffect(() => {
    setIsSupported(
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      (document as any).pictureInPictureEnabled === true
    );
  }, []);

  // Patch the iframe's allow attribute so PiP is permitted cross-origin
  const patchIframe = useCallback(() => {
    if (!containerRef.current) return;
    const iframe = containerRef.current.querySelector('iframe');
    if (!iframe) return;
    const allow = iframe.getAttribute('allow') || '';
    if (!allow.includes('picture-in-picture')) {
      iframe.setAttribute('allow', allow ? `${allow}; picture-in-picture` : 'picture-in-picture');
    }
  }, [containerRef]);

  // Try to get the <video> element inside the YouTube iframe
  const getVideoEl = useCallback((): HTMLVideoElement | null => {
    if (!containerRef.current) return null;
    const iframe = containerRef.current.querySelector('iframe');
    if (!iframe) return null;
    try {
      // Cross-origin access — this will throw in strict environments
      return iframe.contentDocument?.querySelector('video') ?? null;
    } catch {
      return null;
    }
  }, [containerRef]);

  const togglePiP = useCallback(async () => {
    if (!isSupported) return;

    // Ensure iframe has the permission attribute first
    patchIframe();

    // If already in PiP, exit it
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }

    const video = getVideoEl();
    if (!video) {
      console.warn('PiP: Could not find the video element inside the YouTube iframe.');
      return;
    }

    try {
      await video.requestPictureInPicture();
    } catch (err) {
      console.warn('PiP request failed:', err);
    }
  }, [isSupported, patchIframe, getVideoEl]);

  // Keep `isPiP` in sync with the browser's PiP state
  useEffect(() => {
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    document.addEventListener('enterpictureinpicture', onEnter);
    document.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      document.removeEventListener('enterpictureinpicture', onEnter);
      document.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  return { isPiP, isSupported, togglePiP, patchIframe };
}
