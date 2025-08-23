'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function PlayerLoader() {
  return (
    <Skeleton className="w-full aspect-video rounded-lg bg-muted" />
  );
}

function FlickFlowPlayer() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('video');
  const defaultVideo =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return <VideoPlayer src={videoUrl || defaultVideo} />;
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Flick Flow</h1>
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
