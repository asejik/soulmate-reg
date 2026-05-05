import { useCallback, useEffect, useState, useRef } from 'react';
import type { RefObject } from 'react';

declare global {
  interface Window {
    documentPictureInPicture: any;
  }
}

/**
 * usePictureInPicture
 * 
 * Implements Picture-in-Picture using the Document Picture-in-Picture API.
 * This allows moving the entire player container (iframe + controls) into a 
 * separate floating window that stays on top of other applications.
 */
export function usePictureInPicture(containerRef: RefObject<HTMLDivElement | null>) {
  const [isPiP, setIsPiP] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  // Ref to store the original parent and next sibling to return the element correctly
  const originalParentRef = useRef<HTMLElement | null>(null);
  const originalNextSiblingRef = useRef<Node | null>(null);
  const pipWindowRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 
      'documentPictureInPicture' in window
    );
  }, []);

  const togglePiP = useCallback(async () => {
    if (!isSupported || !containerRef.current) return;

    // If already in PiP, close the window
    if (isPiP && pipWindowRef.current) {
      pipWindowRef.current.close();
      return;
    }

    try {
      const container = containerRef.current;
      originalParentRef.current = container.parentElement;
      originalNextSiblingRef.current = container.nextSibling;

      // Request a PiP window
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: container.clientWidth || 640,
        height: container.clientHeight || 360,
      });

      pipWindowRef.current = pipWindow;

      // Copy styles from the main window to the PiP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.cssRules) {
            const newStyle = pipWindow.document.createElement('style');
            [...styleSheet.cssRules].forEach((rule) => {
              newStyle.append(rule.cssText);
            });
            pipWindow.document.head.append(newStyle);
          } else if (styleSheet.href) {
            const newLink = pipWindow.document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = styleSheet.href;
            pipWindow.document.head.append(newLink);
          }
        } catch (e) {
          // Cross-origin stylesheet access might fail
        }
      });

      // Move the container to the PiP window
      pipWindow.document.body.append(container);
      
      // Ensure the container fills the PiP window
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.margin = '0';
      container.style.borderRadius = '0';

      setIsPiP(true);

      // Handle the PiP window being closed
      pipWindow.addEventListener('pagehide', () => {
        setIsPiP(false);
        pipWindowRef.current = null;
        
        // Return the container to its original position
        if (originalParentRef.current) {
          if (originalNextSiblingRef.current) {
            originalParentRef.current.insertBefore(container, originalNextSiblingRef.current);
          } else {
            originalParentRef.current.append(container);
          }
        }
        
        // Reset styles
        container.style.width = '';
        container.style.height = '';
        container.style.margin = '';
        container.style.borderRadius = '';
      });

    } catch (err) {
      console.error('Failed to enter Document PiP:', err);
    }
  }, [isSupported, containerRef, isPiP]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return { isPiP, isSupported, togglePiP, patchIframe: () => {} };
}
