
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';

function PlayerLoader() {
  return <Skeleton className="w-full aspect-video rounded-lg bg-muted" />;
}

function FlickFlowPlayer() {
  const searchParams = useSearchParams();
  const videoUrlFromQuery = searchParams.get('video');
  const [videoUrl, setVideoUrl] = useState<string | null>(videoUrlFromQuery);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {videoUrl ? (
        <VideoPlayer src={videoUrl} />
      ) : (
        <div className="w-full aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-4 p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">No video selected</h2>
            <p className="text-muted-foreground">
              Load a video from your device to begin.
            </p>
          </div>
          <div className="flex items-center justify-center w-full max-w-sm">
            <Label htmlFor="video-upload" className="w-full">
              <Button asChild className="w-full cursor-pointer">
                <div>
                  <FileUp className="mr-2 h-4 w-4" />
                  Load Video
                </div>
              </Button>
              <Input
                id="video-upload"
                type="file"
                accept="video/mp4"
                className="sr-only"
                onChange={handleFileChange}
              />
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">
            Flick Flow
          </h1>
          <p className="text-muted-foreground mt-2">
            Minimalist Player. Maximum Immersion.
          </p>
        </div>
        <Card className="w-full shadow-2xl shadow-primary/10 border-0 rounded-xl overflow-hidden">
          <CardContent className="p-0 bg-black">
            <Suspense fallback={<PlayerLoader />}>
              <FlickFlowPlayer />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
