import { useState, useCallback } from 'react';

/**
 * useSmartPiP
 * 
 * A reliable Picture-in-Picture hook that implements an In-App Floating Mode.
 * 
 * Deep dive context: YouTube's strict embedding security (Domain Whitelisting)
 * throws "Error 153" when trying to initialize a player in a Document PiP window,
 * because the isolated window doesn't pass YouTube's origin/referrer checks for
 * private course videos.
 * 
 * The robust solution is this In-App Floating Mode, which keeps the exact same 
 * DOM node (no re-buffering, no state loss, no CORS errors) and simply floats it
 * in the corner of the application for seamless multitasking within the LMS.
 */
export function useSmartPiP() {
  const [isActive, setIsActive] = useState(false);

  const closePiP = useCallback(() => {
    setIsActive(false);
  }, []);

  const togglePiP = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  // Mode is always 'floating' when active, for a 100% reliable experience
  const mode = isActive ? 'floating' : null;

  return { isActive, mode, togglePiP, closePiP };
}
