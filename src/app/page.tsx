
'use client';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Film, UploadCloud } from 'lucide-react';

function PlayerLoader() {
  return <Skeleton className="w-full aspect-video rounded-lg bg-muted" />;
}

function FlickFlowPlayer() {
  const searchParams = useSearchParams();
  const videoUrlFromQuery = searchParams.get('video');
  const [videoUrl, setVideoUrl] = useState<string | null>(videoUrlFromQuery);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {videoUrl ? (
        <VideoPlayer src={videoUrl} />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <UploadCloud className="w-16 h-16 text-muted-foreground/50" strokeWidth={1} />
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Your player is ready</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Click the button below to select a video file from your device and start the show.
            </p>
          </div>
          <Button onClick={handleButtonClick} size="lg">
            <Film className="mr-2" />
            Select Video File
          </Button>
          <Input
            ref={fileInputRef}
            id="video-upload"
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Flick Flow
          </h1>
          <p className="text-muted-foreground mt-3 text-lg md:text-xl max-w-2xl">
            A polished, performant, and minimalist media player built for the modern web.
          </p>
        </div>
        <Card className="w-full shadow-2xl shadow-primary/10 border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Suspense fallback={<PlayerLoader />}>
              <FlickFlowPlayer />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
