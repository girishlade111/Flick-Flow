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
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
      setIsPlaying(!videoRef.current.paused);
    }
  }, [toast]);

  const handleProgressScrub = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
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
  
  const toggleMute = () => {
      const newMuted = !isMuted;
      if (videoRef.current) {
          videoRef.current.muted = newMuted;
      }
      setIsMuted(newMuted);
      if (newMuted) {
          setVolume(0);
      } else {
          setVolume(videoRef.current?.volume || 1);
      }
  };

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const toggleFullScreen = () => {
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
  };

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
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event;
    if (key === ' ' || key === 'k') {
        event.preventDefault();
        togglePlayPause();
    }
    if (key === 'f') {
        event.preventDefault();
        toggleFullScreen();
    }
    if (key === 'm'){
        event.preventDefault();
        toggleMute();
    }
  }, [togglePlayPause, toggleFullScreen, toggleMute]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      if(video.muted) {
        setIsMuted(true);
        setVolume(0);
      } else {
        setVolume(video.volume);
      }
    }
    const onError = () => {
      toast({
        title: 'Video Error',
        description: 'There was an error loading the video.',
        variant: 'destructive',
      });
    }

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    playerRef.current?.addEventListener('keydown', handleKeyDown);


    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      playerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFullscreenChange, toast, handleKeyDown]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullScreen}
      />

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300',
          areControlsVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex flex-col gap-2">
            <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleProgressScrub}
                className="w-full h-2 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Button onClick={togglePlayPause} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </Button>
                    <div className="flex items-center gap-2 group/volume">
                        <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                           <VolumeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </Button>
                        <div className="w-0 group-hover/volume:w-20 sm:group-hover/volume:w-24 transition-all duration-300 overflow-hidden">
                            <Slider
                                value={[isMuted ? 0 : volume]}
                                onValueChange={handleVolumeChange}
                                max={1}
                                step={0.01}
                                className="w-full cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                     <span className="text-xs sm:text-sm font-mono tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
