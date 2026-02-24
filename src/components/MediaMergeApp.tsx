"use client";

import React, { useState, useEffect } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { getFileMetadata } from '@/lib/media-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const PROCESSING_STEPS = [
  "Validating audio bitrates...",
  "Syncing video frames with cover...",
  "Encoding local output stream...",
  "Generating final preview..."
];

export function MediaMergeApp() {
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{ video?: any; audio?: any }>({});
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (type: 'image' | 'video' | 'audio', file: File) => {
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/jpg'],
      video: ['video/mp4', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav']
    };

    if (!validTypes[type].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: `Please upload a valid ${type} format.`,
      });
      return;
    }

    if (type === 'image') setImage(file);
    if (type === 'video') {
      setVideo(file);
      const meta = await getFileMetadata(file);
      setMetadata(prev => ({ ...prev, video: meta }));
    }
    if (type === 'audio') {
      setAudio(file);
      const meta = await getFileMetadata(file);
      setMetadata(prev => ({ ...prev, audio: meta }));
    }
  };

  const handleCombine = () => {
    if (!image || !video || !audio) {
      toast({
        variant: "destructive",
        title: "Missing files",
        description: "Please upload all three files to combine them.",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep(0);

    // Simulated multi-step local processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProcessing(false);
            setIsDone(true);
            toast({
              title: "Success!",
              description: "Media combined successfully.",
            });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 500);
          return 100;
        }
        const newProgress = prev + 1;
        // Update step index based on progress
        const step = Math.min(Math.floor((newProgress / 100) * PROCESSING_STEPS.length), PROCESSING_STEPS.length - 1);
        setProcessingStep(step);
        return newProgress;
      });
    }, 40);
  };

  const resetAll = () => {
    setImage(null);
    setVideo(null);
    setAudio(null);
    setIsDone(false);
    setMetadata({});
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allUploaded = !!(image && video && audio);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
              <Layers size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Media<span className="gradient-text">Merge</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed">
              Professional offline media combiner. Merge screen recordings, audio tracks, and covers entirely in your browser.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <UploadCard
            type="image"
            title="Cover Image"
            description="JPG, PNG, JPEG up to 10MB"
            accept=".jpg,.jpeg,.png"
            file={image}
            onUpload={(f) => handleUpload('image', f)}
            onClear={() => setImage(null)}
          />
          <UploadCard
            type="video"
            title="Screen Recording"
            description="MP4, WebM recordings"
            accept=".mp4,.webm"
            file={video}
            onUpload={(f) => handleUpload('video', f)}
            onClear={() => setVideo(null)}
            metadata={metadata.video}
          />
          <UploadCard
            type="audio"
            title="Audio Track"
            description="MP3, WAV voiceovers"
            accept=".mp3,.wav"
            file={audio}
            onUpload={(f) => handleUpload('audio', f)}
            onClear={() => setAudio(null)}
            metadata={metadata.audio}
          />
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center justify-center space-y-8">
          {isProcessing ? (
            <div className="w-full max-w-md space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <Loader2 className="animate-spin" size={20} />
                <span>{PROCESSING_STEPS[processingStep]}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground italic">Performing local browser-based encoding...</p>
            </div>
          ) : (
            <>
              {!allUploaded && !isDone && (
                <div className="max-w-md w-full">
                   <Alert className="bg-foreground/5 border-foreground/10 text-muted-foreground">
                    <Sparkles size={16} className="text-primary" />
                    <AlertTitle className="text-foreground font-medium">Ready to Merge?</AlertTitle>
                    <AlertDescription>
                      Upload an image, a video, and an audio file to enable the local engine.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  disabled={!allUploaded || isProcessing}
                  onClick={handleCombine}
                  className={cn(
                    "h-16 px-12 text-lg font-bold shadow-2xl transition-all duration-300",
                    allUploaded 
                      ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20 scale-105 active:scale-95" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Zap className="mr-3" size={24} fill="currentColor" />
                  Combine Media
                </Button>
                
                {(image || video || audio) && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={resetAll}
                    className="h-16 border-foreground/10 hover:bg-foreground/5 text-muted-foreground"
                  >
                    <RotateCcw className="mr-2" size={20} />
                    Reset All
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Results Section */}
        {isDone && (
          <div className="pt-12 border-t border-foreground/10">
            <CombinedOutput 
              image={image} 
              video={video} 
              audio={audio} 
              onReset={resetAll} 
            />
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}