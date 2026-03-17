// client/src/types/youtube.d.ts

declare namespace YT {
  class Player {
    constructor(el: HTMLElement | string, options: PlayerOptions);
    playVideo():                              void;
    pauseVideo():                             void;
    stopVideo():                              void;
    seekTo(seconds: number):                  void;
    getCurrentTime():                         number;
    getDuration():                            number;
    getPlayerState():                         number;
    destroy():                                void;
  }

  interface PlayerOptions {
    videoId?:    string;
    width?:      string | number;
    height?:     string | number;
    playerVars?: PlayerVars;
    events?:     PlayerEvents;
  }

  interface PlayerVars {
    autoplay?:        0 | 1;
    controls?:        0 | 1;
    rel?:             0 | 1;
    // FIX 1: 'showinfo' was missing from our PlayerVars interface.
    // It is a valid YouTube playerVar (though deprecated by YouTube,
    // it is still accepted and still suppresses the title bar
    // on older embed contexts).
    showinfo?:        0 | 1;
    modestbranding?:  0 | 1;
    disablekb?:       0 | 1;
    fs?:              0 | 1;
    iv_load_policy?:  1 | 3;
    playsinline?:     0 | 1;
    loop?:            0 | 1;
    // playlist is a comma-separated string of video IDs.
    // Required alongside loop=1 for looping to activate.
    playlist?:        string;
    start?:           number;
    end?:             number;
    origin?:          string;
    color?:           'red' | 'white';
    hl?:              string;
  }

  interface PlayerEvents {
    onReady?:       (event: PlayerEvent)        => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?:       (event: OnErrorEvent)       => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    target: Player;
    data:   number;
  }

  interface OnErrorEvent {
    target: Player;
    data:   number;
  }

  const PlayerState: {
    UNSTARTED: -1;
    ENDED:      0;
    PLAYING:    1;
    PAUSED:     2;
    BUFFERING:  3;
    CUED:       5;
  };
}