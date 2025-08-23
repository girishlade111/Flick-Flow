
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
  const audioInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
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
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  };

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((error) => {
          toast({
            title: 'Playback Error',
            description: 'Could not play the video.',
            variant: 'destructive',
          });
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [toast]);

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
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(videoRef.current.volume);
      }
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
        const isCurrentlyShowing = tracks[0].mode === 'showing';
        tracks[0].mode = isCurrentlyShowing ? 'hidden' : 'showing';
        setAreSubtitlesVisible(!isCurrentlyShowing);
      } else {
        toast({
          title: 'No subtitles found',
          description:
            'Load a subtitle file (.vtt) to enable subtitles.',
        });
      }
    }
  }, [toast]);

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      const audioURL = URL.createObjectURL(file);
      // This is a workaround as you can't truly swap audio tracks on the fly
      // without more complex libraries. This will play the new audio
      // but the video's original audio will be muted.
      const newAudio = new Audio(audioURL);
      videoRef.current.muted = true;
      setIsMuted(true);

      const syncAudio = () => {
        if (videoRef.current) {
          newAudio.currentTime = videoRef.current.currentTime;
        }
      };

      const playAudio = () => newAudio.play();
      const pauseAudio = () => newAudio.pause();

      videoRef.current.addEventListener('play', playAudio);
      videoRef.current.addEventListener('pause', pauseAudio);
      videoRef.current.addEventListener('seeking', syncAudio);

      playAudio();

      toast({
        title: 'Audio Changed',
        description:
          'The new audio track is now playing. Original audio muted.',
      });
    }
  };

  const handleSubtitleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      const subtitleURL = URL.createObjectURL(file);
      // Remove old subtitle tracks
      for (let i = videoRef.current.textTracks.length - 1; i >= 0; i--) {
        const track = videoRef.current.textTracks[i];
        (track as any).track.remove();
      }

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = 'English';
      track.srclang = 'en';
      track.src = subtitleURL;
      track.default = true;
      track.addEventListener('load', () => {
        if (videoRef.current) {
          videoRef.current.textTracks[0].mode = 'showing';
          setAreSubtitlesVisible(true);
          toast({
            title: 'Subtitles added',
            description: 'The subtitle track has been loaded.',
          });
        }
      });
      videoRef.current.appendChild(track);
    }
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, shiftKey } = event;
      if (
        (event.target as HTMLElement).tagName === 'INPUT' ||
        (event.target as HTMLElement).tagName === 'TEXTAREA'
      )
        return;

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
          handleSeek(shiftKey ? 30 : 10);
          break;
        case 'arrowleft':
          handleSeek(shiftKey ? -30 : -10);
          break;
        case '>':
          if (shiftKey) {
            handlePlaybackRateChange(
              String(Math.min(parseFloat(playbackRate) + 0.25, 2))
            );
          }
          break;
        case '<':
          if (shiftKey) {
            handlePlaybackRateChange(
              String(Math.max(parseFloat(playbackRate) - 0.25, 0.5))
            );
          }
          break;
        case '+':
        case '=':
          handleZoom('in');
          break;
        case '-':
        case '_':
          handleZoom('out');
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
      if (!video.muted) {
        setVolume(video.volume);
      }
      setAreSubtitlesVisible(
        video.textTracks.length > 0 && video.textTracks[0].mode === 'showing'
      );
    };
    const onError = () => {
      toast({
        title: 'Video Error',
        description: 'There was an error loading the video.',
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

    // Clean up src object URL
    const currentSrc = video.src;

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      playerRef.current?.removeEventListener('keydown', handleKeyDown);
      if (currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [handleFullscreenChange, toast, handleKeyDown, src]);

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
      className="relative w-full aspect-video flex justify-center items-center bg-black overflow-hidden group rounded-lg focus:outline-none"
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
          areControlsVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex gap-4 p-4 rounded-full bg-black/50">
          <Button onClick={() => handleSeek(-10)} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto">
              <Rewind className="w-8 h-8"/>
          </Button>
          <Button onClick={togglePlayPause} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto">
              {isPlaying ? <Pause className="w-12 h-12"/> : <Play className="w-12 h-12"/>}
          </Button>
          <Button onClick={() => handleSeek(10)} variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto">
              <FastForward className="w-8 h-8"/>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300',
          areControlsVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex flex-col gap-2">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={1}
            onValueChange={handleProgressScrub}
            className="w-full h-2 cursor-pointer"
          />
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={togglePlayPause}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <div className="flex items-center gap-1 group/volume">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <VolumeIcon className="w-5 h-5" />
                </Button>
                <div className="w-0 group-hover/volume:w-20 transition-all duration-300 overflow-hidden">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>
               <span className="text-xs sm:text-sm font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 font-mono text-sm"
                  >
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={playbackRate}
                    onValueChange={handlePlaybackRateChange}
                  >
                    <DropdownMenuRadioItem value="0.5">0.5x</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="1">1x (Normal)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="1.5">1.5x</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="2">2x</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Label htmlFor="audio-upload" className="cursor-pointer">
                <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
                   <div><AudioLines className="w-5 h-5" /></div>
                </Button>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/mp3"
                  className="sr-only"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                />
              </Label>
               <Label htmlFor="subtitle-upload" className="cursor-pointer">
                <Button asChild variant="ghost" size="icon" className={cn("text-white hover:bg-white/10", areSubtitlesVisible && "bg-white/20")}>
                  <div><Subtitles className="w-5 h-5" /></div>
                </Button>
                <Input
                  id="subtitle-upload"
                  type="file"
                  accept=".vtt"
                  className="sr-only"
                  ref={subtitleInputRef}
                  onChange={handleSubtitleChange}
                />
              </Label>
              <Button onClick={() => handleZoom('out')} variant="ghost" size="icon" className="text-white hover:bg-white/10 hidden sm:flex">
                  <ZoomOut className="w-5 h-5" />
              </Button>
              <Button onClick={() => handleZoom('in')} variant="ghost" size="icon" className="text-white hover:bg-white/10 hidden sm:flex">
                  <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                onClick={toggleFullScreen}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
