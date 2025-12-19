
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '../types';
import Sidebar, { SidebarProps } from './Sidebar';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize, 
  Minimize, 
  List, 
  Tv, 
  AlertCircle
} from 'lucide-react';

declare global {
  interface Window {
    Hls: any;
  }
}

interface VideoPlayerProps {
  channel: Channel | null;
  sidebarProps: Omit<SidebarProps, 'onClose'>;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, sidebarProps }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Scrubber State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // --- HLS and Video Initialization ---
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    const video = videoRef.current;
    setIsError(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setIsLive(false);

    const initPlayer = () => {
       if (window.Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;

        hls.loadSource(channel.url);
        hls.attachMedia(video);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log("Auto-play prevented", e));
          setIsPlaying(true);
          setIsLoading(false);
        });
        
        hls.on(window.Hls.Events.LEVEL_LOADED, (_event: any, data: any) => {
            setIsLive(data.details.live);
            if (!data.details.live) {
                setDuration(data.details.totalduration);
            } else {
                setDuration(Infinity);
            }
        });

        hls.on(window.Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setIsError(true);
                setIsLoading(false);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log("Auto-play prevented", e));
          setIsPlaying(true);
          setIsLoading(false);
          setDuration(video.duration);
          setIsLive(video.duration === Infinity);
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [channel]);

  // --- Event Handlers ---

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  const handleTimeUpdate = useCallback(() => {
      if (videoRef.current && !isDragging) {
          setCurrentTime(videoRef.current.currentTime);
          if (!isLive && isFinite(videoRef.current.duration)) {
             setDuration(videoRef.current.duration);
          }
      }
  }, [isDragging, isLive]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      setCurrentTime(time);
  };
  
  const handleSeekMouseDown = () => setIsDragging(true);
  
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
      setIsDragging(false);
      if (videoRef.current) {
          const time = parseFloat((e.target as HTMLInputElement).value);
          videoRef.current.currentTime = time;
      }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSpeedMenu && !showSidebar && !isDragging) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showSpeedMenu, showSidebar, isDragging]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onRateChange = () => setPlaybackSpeed(video.playbackRate);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ratechange', onRateChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!channel) {
    return (
      <div className="w-full h-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center flex-col gap-4 text-slate-500 border border-slate-800">
        <Tv className="h-16 w-16 opacity-20" />
        <p className="text-lg font-medium">Select a channel to start streaming</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${isFullscreen ? 'h-screen rounded-none border-none' : 'aspect-video'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => { setShowSpeedMenu(false); }}
    >
      {/* Loading Overlay */}
      {isLoading && !isError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Overlay */}
      {isError && (
        <div className="absolute inset-0 z-30 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
          <p className="text-white font-bold mb-1">Stream Unavailable</p>
          <p className="text-slate-400 text-sm">This channel is currently offline or blocked.</p>
        </div>
      )}
      
      {/* Sidebar Overlay (Full Sidebar) */}
      <div className={`absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 border-l border-white/10 backdrop-blur-md transform transition-transform duration-300 z-30 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
          <Sidebar 
            {...sidebarProps} 
            onClose={() => setShowSidebar(false)}
            showCloseButton={true}
          />
      </div>

      {/* Video Element (Hidden controls) */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />
      
      {/* Channel Overlay Info (Top Left) */}
      <div className={`absolute top-4 left-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
          <img src={channel.logo} alt={channel.name} className="h-8 w-8 object-contain rounded" onError={(e) => (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200?blur=2'}/>
          <div>
            <span className="block font-semibold text-white text-sm drop-shadow-md">{channel.name}</span>
            {isLoading ? <span className="text-xs text-indigo-400">Buffering...</span> : <span className="text-xs text-red-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE</span>}
          </div>
        </div>
      </div>

      {/* Center Play Button */}
      {!isPlaying && !isLoading && !isError && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center group/btn"
        >
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full border border-white/20 group-hover/btn:bg-indigo-600 group-hover/btn:border-indigo-500 transition-all scale-100 group-hover/btn:scale-110">
            <Play className="h-10 w-10 text-white fill-current" />
          </div>
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-8 transition-opacity duration-300 ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Scrubber Bar */}
        <div className="mb-4 flex items-center gap-3 group/scrubber">
            <span className="text-xs font-mono text-slate-300 w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-1 bg-slate-600/50 rounded-full cursor-pointer group-hover/scrubber:h-1.5 transition-all">
                {isLive ? (
                    <div className="absolute inset-y-0 left-0 right-0 bg-red-600/80 rounded-full flex items-center justify-end px-1">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider mr-1">Live</span>
                    </div>
                ) : (
                    <>
                        <div 
                            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="1"
                            value={currentTime}
                            onChange={handleSeekChange}
                            onMouseDown={handleSeekMouseDown}
                            onMouseUp={handleSeekMouseUp}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={!isFinite(duration) || duration === 0}
                        />
                        <div 
                           className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md scale-0 group-hover/scrubber:scale-100 transition-transform pointer-events-none"
                           style={{ left: `${(currentTime / duration) * 100}%` }}
                        ></div>
                    </>
                )}
            </div>
            <span className="text-xs font-mono text-slate-300 w-10">{isLive ? "LIVE" : formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 fill-current" />
              ) : (
                <Play className="h-8 w-8 fill-current" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-6 w-6" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Sidebar Toggle Button */}
             <button
                onClick={(e) => { e.stopPropagation(); setShowSidebar(!showSidebar); }}
                className={`transition-colors ${showSidebar ? 'text-indigo-400' : 'text-white hover:text-indigo-400'}`}
                title="Open Sidebar"
             >
                <List className="h-6 w-6" />
             </button>

             {/* Playback Speed */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                className="text-white hover:text-indigo-400 font-medium text-sm flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[80px]">
                   {[0.5, 1, 1.5, 2].map((speed) => (
                     <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${playbackSpeed === speed ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}
                     >
                       {speed}x
                     </button>
                   ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-indigo-400 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-6 w-6" />
              ) : (
                <Maximize className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
