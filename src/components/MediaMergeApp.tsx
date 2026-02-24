"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { AdvancedOptions, type Config } from './AdvancedOptions';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Sparkles, Film } from 'lucide-react';
import { getFileMetadata, loadImage, loadVideo } from '@/lib/media-utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const INTRO_DURATION = 3; // seconds
const TRANSITION_DURATION = 0.8; // seconds

export function MediaMergeApp() {
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{ video?: any; audio?: any }>({});
  
  const [config, setConfig] = useState<Config>({
    introTransition: 'zoom-in',
    videoTransition: 'crossfade',
    audioVolume: 0.8,
    audioFade: true,
    watermark: true,
    watermarkText: 'MediaMerge',
    roundedCorners: true,
    vignette: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Preparing engines...");
  const [progress, setProgress] = useState(0);
  const [finalVideoBlob, setFinalVideoBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleUpload = async (type: 'image' | 'video' | 'audio', file: File) => {
    if (type === 'image') setImage(file);
    if (type === 'video') {
      const meta = await getFileMetadata(file);
      setVideo(file);
      setMetadata(prev => ({ ...prev, video: meta }));
    }
    if (type === 'audio') {
      const meta = await getFileMetadata(file);
      setAudio(file);
      setMetadata(prev => ({ ...prev, audio: meta }));
    }
  };

  const combineMedia = async () => {
    if (!image || !video || !audio) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Initializing Web Renderer...");

    try {
      // Load resources
      const imgEl = await loadImage(image);
      const vidEl = await loadVideo(video);
      const audioBuffer = await audio.arrayBuffer();
      
      const audioCtx = new AudioContext();
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Standardize to 720p or video size
      const width = vidEl.videoWidth || 1280;
      const height = vidEl.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const totalDuration = INTRO_DURATION + decodedAudio.duration;
      const stream = canvas.captureStream(30);
      
      // Setup Audio Output
      const audioDest = audioCtx.createMediaStreamDestination();
      const audioSource = audioCtx.createBufferSource();
      audioSource.buffer = decodedAudio;
      audioSource.loop = true; // Looping as per logic rules

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = config.audioVolume;
      
      // Audio Fading
      if (config.audioFade) {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(config.audioVolume, audioCtx.currentTime + 1);
        gainNode.gain.setValueAtTime(config.audioVolume, audioCtx.currentTime + totalDuration - 1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + totalDuration);
      }

      audioSource.connect(gainNode);
      gainNode.connect(audioDest);
      
      // Combine Streams
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        setFinalVideoBlob(new Blob(chunks, { type: 'video/mp4' }));
        setIsProcessing(false);
        toast({ title: "Masterpiece Ready!", description: "Media successfully merged offline." });
      };

      recorder.start();
      audioSource.start(0);
      vidEl.play();

      const startTime = performance.now();
      
      const render = () => {
        const now = (performance.now() - startTime) / 1000;
        const p = Math.min((now / totalDuration) * 100, 100);
        setProgress(p);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (now < INTRO_DURATION) {
          setProcessingStatus("Generating Cinematic Intro...");
          // Phase 1: Intro Logic
          let scale = 1.0;
          if (config.introTransition === 'zoom-in') scale = 1 + (now / INTRO_DURATION) * 0.2;
          if (config.introTransition === 'zoom-out') scale = 1.2 - (now / INTRO_DURATION) * 0.2;
          
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (width - drawW) / 2;
          const offsetY = (height - drawH) / 2;

          ctx.save();
          if (config.introTransition === 'blur') ctx.filter = `blur(${Math.max(0, 20 - now * 10)}px)`;
          ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);
          ctx.restore();

          // Overlay Fade for Phase 2
          if (now > INTRO_DURATION - TRANSITION_DURATION) {
            const alpha = (now - (INTRO_DURATION - TRANSITION_DURATION)) / TRANSITION_DURATION;
            ctx.globalAlpha = alpha;
            ctx.drawImage(vidEl, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }
        } else if (now < totalDuration) {
          setProcessingStatus("Merging Screen Recording...");
          // Phase 2: Play Recording
          ctx.drawImage(vidEl, 0, 0, width, height);
        }

        // Global Effects
        if (config.vignette) {
          const grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width/1.5);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }

        if (config.watermark) {
          ctx.font = '20px Inter';
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillText(config.watermarkText, width - 150, height - 30);
        }

        if (now < totalDuration) {
          requestAnimationFrame(render);
        } else {
          recorder.stop();
          audioSource.stop();
          vidEl.pause();
        }
      };

      render();

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Processing Failed", description: "Browser memory limits reached." });
    }
  };

  const resetAll = () => {
    setImage(null);
    setVideo(null);
    setAudio(null);
    setFinalVideoBlob(null);
    setMetadata({});
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allUploaded = !!(image && video && audio);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
              <Layers size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Media<span className="gradient-text">Merge</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed">
              Studio-quality offline media engine. 100% browser-side processing.
            </p>
          </div>
          <div className="flex gap-4">
             <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <UploadCard
                type="image"
                title="Intro Cover"
                description="3s Cinematic Intro"
                accept=".jpg,.jpeg,.png"
                file={image}
                onUpload={(f) => handleUpload('image', f)}
                onClear={() => setImage(null)}
              />
              <UploadCard
                type="video"
                title="Screen Recording"
                description="Main content layer"
                accept=".mp4,.webm"
                file={video}
                onUpload={(f) => handleUpload('video', f)}
                onClear={() => setVideo(null)}
                metadata={metadata.video}
              />
              <UploadCard
                type="audio"
                title="Soundtrack"
                description="Auto-loops & Syncs"
                accept=".mp3,.wav"
                file={audio}
                onUpload={(f) => handleUpload('audio', f)}
                onClear={() => setAudio(null)}
                metadata={metadata.audio}
              />
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
              {isProcessing ? (
                <div className="w-full max-w-lg space-y-6 text-center animate-pulse">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <span className="text-xl font-semibold text-primary">{processingStatus}</span>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3 w-full" />
                    <p className="text-sm text-muted-foreground">{Math.round(progress)}% Recorded Locally</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    size="lg"
                    disabled={!allUploaded}
                    onClick={combineMedia}
                    className={cn(
                      "h-20 px-16 text-xl font-bold rounded-2xl transition-all duration-500",
                      allUploaded 
                        ? "bg-primary hover:bg-primary/90 text-white shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] scale-105 active:scale-95 animate-pulse-subtle" 
                        : "bg-muted text-muted-foreground opacity-50"
                    )}
                  >
                    <Zap className="mr-3" size={28} fill="currentColor" />
                    Combine & Export
                  </Button>
                  
                  {(image || video || audio) && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resetAll}
                      className="h-20 px-8 rounded-2xl border-white/10 hover:bg-white/5"
                    >
                      <RotateCcw className="mr-2" size={24} />
                      Reset
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <AdvancedOptions config={config} onChange={setConfig} />
          </div>
        </div>

        {/* Results Section */}
        {finalVideoBlob && !isProcessing && (
          <div className="pt-12 border-t border-white/10 animate-in zoom-in-95 duration-700">
            <CombinedOutput 
              blob={finalVideoBlob}
              image={image} 
              onReset={resetAll} 
            />
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
