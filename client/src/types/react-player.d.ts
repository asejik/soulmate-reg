// client/src/types/react-player.d.ts

declare module 'react-player' {
  import { Component } from 'react';

  export interface YouTubePlayerVars {
    rel?:            0 | 1;
    controls?:       0 | 1;
    autoplay?:       0 | 1;
    loop?:           0 | 1;
    modestbranding?: 0 | 1;
    showinfo?:       0 | 1;
    fs?:             0 | 1;
    cc_load_policy?: 0 | 1;
    disablekb?:      0 | 1;
    enablejsapi?:    0 | 1;
    origin?:         string;
    playsinline?:    0 | 1;
    start?:          number;
    end?:            number;
    hl?:             string;
    iv_load_policy?: 1 | 3;
    color?:          'red' | 'white';
  }

  export interface ReactPlayerConfig {
    youtube?: {
      playerVars?: YouTubePlayerVars;
      embedOptions?: Record<string, unknown>;
      onUnstarted?: () => void;
    };
    file?: {
      attributes?:    Record<string, unknown>;
      tracks?:        unknown[];
      forceVideo?:    boolean;
      forceAudio?:    boolean;
      forceHLS?:      boolean;
      forceDASH?:     boolean;
    };
    vimeo?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface ProgressState {
    played:          number;
    playedSeconds:   number;
    loaded:          number;
    loadedSeconds:   number;
  }

  export interface ReactPlayerProps {
    url?:              string | string[] | MediaStream;
    playing?:          boolean;
    loop?:             boolean;
    controls?:         boolean;
    light?:            boolean | string;
    volume?:           number | null;
    muted?:            boolean;
    playbackRate?:     number;
    width?:            string | number;
    height?:           string | number;
    style?:            React.CSSProperties;
    progressInterval?: number;
    playsinline?:      boolean;
    pip?:              boolean;
    stopOnUnmount?:    boolean;
    fallback?:         React.ReactElement | null;
    wrapper?:          React.ElementType;
    config?:           ReactPlayerConfig;
    onReady?:          (player: ReactPlayerInstance) => void;
    onStart?:          () => void;
    onPlay?:           () => void;
    onPause?:          () => void;
    onBuffer?:         () => void;
    onBufferEnd?:      () => void;
    onEnded?:          () => void;
    onError?:          (error: unknown) => void;
    onProgress?:       (state: ProgressState) => void;
    onDuration?:       (duration: number) => void;
    onSeek?:           (seconds: number) => void;
    onPlaybackRateChange?: (speed: number) => void;
    onClickPreview?:   (event: unknown) => void;
    onEnablePIP?:      () => void;
    onDisablePIP?:     () => void;
  }

  export interface ReactPlayerInstance {
    seekTo:          (amount: number, type?: 'seconds' | 'fraction') => void;
    getCurrentTime: () => number;
    getDuration:    () => number;
    getInternalPlayer: (key?: string) => unknown;
    showPreview:    () => void;
  }

  // The default export is a class component
  export default class ReactPlayer extends Component<ReactPlayerProps> {
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
    getCurrentTime(): number;
    getDuration(): number;
    getInternalPlayer(key?: string): unknown;
    showPreview(): void;
  }
}