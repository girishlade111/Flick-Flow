
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  Volume1,
  VolumeX,
  FastForward,
  Rewind,
  ZoomIn,
  ZoomOut,
  Subtitles,
  AudioLines,
  Settings,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState('1');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [areSubtitlesVisible, setAreSubtitlesVisible] = useState(true);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const parts = [
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ];
    if (hours > 0) {
      parts.unshift(String(hours).padStart(2, '0'));
    }
    return parts.join(':');
  };
  
  const play = useCallback(() => {
    videoRef.current?.play().catch((error) => {
        console.error("Playback failed:", error);
        toast({
          title: 'Playback Error',
          description: 'The browser prevented the video from playing automatically. Please click play.',
          variant: 'destructive',
        });
      });
  }, [toast]);
  
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'audio' | 'subtitle'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !videoRef.current) return;
    
    const fileURL = URL.createObjectURL(file);

    if (type === 'audio') {
      const newAudio = new Audio(fileURL);
      videoRef.current.muted = true;
      setIsMuted(true);

      const syncAudio = () => {
        if (videoRef.current) newAudio.currentTime = videoRef.current.currentTime;
      };
      const playAudio = () => newAudio.play();
      const pauseAudio = () => newAudio.pause();

      videoRef.current.addEventListener('play', playAudio);
      videoRef.current.addEventListener('pause', pauseAudio);
      videoRef.current.addEventListener('seeking', syncAudio);

      newAudio.play();

      toast({
        title: 'Audio Track Changed',
        description: 'The new audio track is now playing and the original is muted.',
      });
    } else if (type === 'subtitle') {
      // Remove any existing subtitle tracks
      Array.from(videoRef.current.textTracks).forEach(track => {
        (track as any).track?.remove();
      });

      const trackElement = document.createElement('track');
      trackElement.kind = 'subtitles';
      trackElement.label = 'Custom Subtitle';
      trackElement.srclang = 'en';
      trackElement.src = fileURL;
      trackElement.default = true;
      
      trackElement.addEventListener('load', () => {
        if(videoRef.current) {
            videoRef.current.textTracks[0].mode = 'showing';
            setAreSubtitlesVisible(true);
            toast({
                title: 'Subtitles Loaded',
                description: 'The subtitle file has been successfully added.',
            });
        }
      });
      videoRef.current.appendChild(trackElement);
    }
  };
  
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [play]);


  const handleSeek = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const handleProgressScrub = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      setVolume(newMuted ? 0 : videoRef.current.volume);
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch((err) => {
        toast({
          title: 'Fullscreen Error',
          description: `Could not enter fullscreen mode: ${err.message}`,
          variant: 'destructive',
        });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);

  const showControls = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setAreControlsVisible(false);
      }
    }, 3000);
  }, []);

  const handlePlaybackRateChange = (rate: string) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = parseFloat(rate);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel((prevZoom) => {
      const newZoom =
        direction === 'in'
          ? Math.min(prevZoom + 0.1, 3)
          : Math.max(prevZoom - 0.1, 0.5);
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${newZoom})`;
      }
      return newZoom;
    });
  };

  const toggleSubtitles = useCallback(() => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      if (tracks.length > 0) {
        const isShowing = tracks[0].mode === 'showing';
        tracks[0].mode = isShowing ? 'hidden' : 'showing';
        setAreSubtitlesVisible(!isShowing);
      } else {
        toast({
          title: 'No Subtitles Available',
          description: 'Load a subtitle file (.vtt) to show subtitles.',
        });
      }
    }
  }, [toast]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
      
      const { key, shiftKey, metaKey, ctrlKey } = event;
      if (metaKey || ctrlKey) return;

      event.preventDefault();

      switch (key.toLowerCase()) {
        case ' ':
        case 'k':
          togglePlayPause();
          break;
        case 'f':
          toggleFullScreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowright':
          handleSeek(5);
          break;
        case 'arrowleft':
          handleSeek(-5);
          break;
        case 'l':
            handleSeek(10);
            break;
        case 'j':
            handleSeek(-10);
            break;
        case '>':
          if (shiftKey) {
            handlePlaybackRateChange(String(Math.min(parseFloat(playbackRate) + 0.25, 2.5)));
          }
          break;
        case '<':
          if (shiftKey) {
            handlePlaybackRateChange(String(Math.max(parseFloat(playbackRate) - 0.25, 0.25)));
          }
          break;
        case 'c':
          toggleSubtitles();
          break;
      }
    },
    [
      togglePlayPause,
      toggleFullScreen,
      toggleMute,
      playbackRate,
      toggleSubtitles,
    ]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsMuted(video.muted);
      if (!video.muted) setVolume(video.volume);
      setAreSubtitlesVisible(video.textTracks.length > 0 && video.textTracks[0].mode === 'showing');
      play();
    };
    const onError = () => {
      toast({
        title: 'Video Error',
        description: 'There was an error loading the video file.',
        variant: 'destructive',
      });
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    playerRef.current?.addEventListener('keydown', handleKeyDown);

    const currentSrc = video.src;

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      playerRef.current?.removeEventListener('keydown', handleKeyDown);
      if (currentSrc && currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [src, handleFullscreenChange, toast, handleKeyDown, play]);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.style.transform = `scale(${zoomLevel})`;
    }
  }, [zoomLevel]);
  
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={playerRef}
      className="relative w-full aspect-video flex justify-center items-center bg-black overflow-hidden group rounded-xl focus:outline-none"
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (isPlaying) setAreControlsVisible(false);
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain transition-transform duration-200"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullScreen}
        crossOrigin="anonymous"
      />
      
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300',
          'group-hover:opacity-100',
          !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex gap-4 p-4 rounded-full bg-black/50 backdrop-blur-sm">
          <Button onClick={(e) => { e.stopPropagation(); handleSeek(-10); }} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto h-16 w-16">
              <Rewind className="w-8 h-8"/>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto h-20 w-20">
              {isPlaying ? <Pause className="w-12 h-12"/> : <Play className="w-12 h-12"/>}
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); handleSeek(10); }} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto h-16 w-16">
              <FastForward className="w-8 h-8"/>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300',
          areControlsVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={1}
            onValueChange={handleProgressScrub}
            className="w-full h-2 [&>span:first-child]:h-1.5 [&>span:first-child>span]:h-1.5"
          />
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button onClick={togglePlayPause} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                {isPlaying ? <Pause /> : <Play />}
              </Button>
              <div className="flex items-center gap-1 group/volume">
                <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <VolumeIcon />
                </Button>
                <div className="w-0 group-hover/volume:w-24 transition-all duration-300 overflow-hidden">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
               <span className="text-xs sm:text-sm font-mono tabular-nums w-24 sm:w-28">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <Settings />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={playbackRate}
                      onValueChange={handlePlaybackRateChange}
                    >
                      <DropdownMenuRadioItem value="0.5">0.5x</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="0.75">0.75x</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1">Normal</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1.25">1.25x</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="1.5">1.5x</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="2">2x</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuLabel>Zoom</DropdownMenuLabel>
                     <div className="flex items-center justify-center gap-2 px-2 py-1">
                        <Button onClick={() => handleZoom('out')} variant="ghost" size="icon" className="h-8 w-8">
                            <ZoomOut />
                        </Button>
                        <span className="font-mono text-sm tabular-nums">{(zoomLevel * 100).toFixed(0)}%</span>
                        <Button onClick={() => handleZoom('in')} variant="ghost" size="icon" className="h-8 w-8">
                            <ZoomIn />
                        </Button>
                     </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              
              <Label htmlFor="audio-upload" className="cursor-pointer">
                <div className="text-white hover:bg-white/10 rounded-md p-2">
                   <AudioLines />
                </div>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => handleFileChange(e, 'audio')}
                />
              </Label>
               <Label htmlFor="subtitle-upload" className="cursor-pointer">
                <div className={cn("text-white hover:bg-white/10 rounded-md p-2", areSubtitlesVisible && "bg-primary/50")}>
                  <Subtitles />
                </div>
                <Input
                  id="subtitle-upload"
                  type="file"
                  accept=".vtt"
                  className="sr-only"
                  onChange={(e) => handleFileChange(e, 'subtitle')}
                />
              </Label>
              <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
