"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { AdvancedOptions, type Config } from './AdvancedOptions';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Sparkles, Film, Clock } from 'lucide-react';
import { getFileMetadata, loadImage, loadVideo } from '@/lib/media-utils';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const INTRO_DURATION = 3; 
const MIN_FINAL_DURATION = 120; // 2 minutes as requested

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
    watermarkText: 'MediaFusion',
    roundedCorners: true,
    vignette: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Preparing engines...");
  const [progress, setProgress] = useState(0);
  const [finalVideoBlob, setFinalVideoBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleUpload = async (type: 'image' | 'video' | 'audio', file: File) => {
    try {
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
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Error", description: "Invalid file format or corrupted file." });
    }
  };

  const combineMedia = async () => {
    if (!image || !video || !audio) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Initializing Fusion Core...");

    try {
      const imgEl = await loadImage(image);
      const vidEl = await loadVideo(video);
      const audioBuffer = await audio.arrayBuffer();
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false })!;
      
      const width = vidEl.videoWidth || 1280;
      const height = vidEl.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      // Calculate Duration Logic
      const rawVideoDuration = vidEl.duration;
      const totalRequestedDuration = Math.max(MIN_FINAL_DURATION, INTRO_DURATION + rawVideoDuration);
      
      const stream = canvas.captureStream(30);
      
      // Audio Setup
      const audioDest = audioCtx.createMediaStreamDestination();
      const audioSource = audioCtx.createBufferSource();
      audioSource.buffer = decodedAudio;
      audioSource.loop = true;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = config.audioVolume;
      
      if (config.audioFade) {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(config.audioVolume, audioCtx.currentTime + 1);
        gainNode.gain.setValueAtTime(config.audioVolume, audioCtx.currentTime + totalRequestedDuration - 1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + totalRequestedDuration);
      }

      audioSource.connect(gainNode);
      gainNode.connect(audioDest);
      
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        setFinalVideoBlob(new Blob(chunks, { type: 'video/mp4' }));
        setIsProcessing(false);
        toast({ title: "Fusion Complete!", description: "Video exported successfully at ≥ 2:00 duration." });
      };

      recorder.start();
      audioSource.start(0);
      vidEl.play();
      vidEl.loop = true;

      const startTime = performance.now();
      const transitionDuration = 1.0;
      
      const render = () => {
        const now = (performance.now() - startTime) / 1000;
        const p = Math.min((now / totalRequestedDuration) * 100, 100);
        setProgress(p);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (now < INTRO_DURATION) {
          setProcessingStatus("Rendering Cinematic Intro...");
          let scale = 1.0;
          if (config.introTransition === 'zoom-in') scale = 1 + (now / INTRO_DURATION) * 0.15;
          
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (width - drawW) / 2;
          const offsetY = (height - drawH) / 2;

          ctx.save();
          if (config.introTransition === 'blur') ctx.filter = `blur(${Math.max(0, 20 - now * 10)}px)`;
          ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);
          ctx.restore();

          // Transition Overlay
          if (now > INTRO_DURATION - transitionDuration) {
            const alpha = (now - (INTRO_DURATION - transitionDuration)) / transitionDuration;
            ctx.globalAlpha = alpha;
            ctx.drawImage(vidEl, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }
        } else {
          setProcessingStatus(now < MIN_FINAL_DURATION ? "Looping Content to 2:00..." : "Finalizing Stream...");
          ctx.drawImage(vidEl, 0, 0, width, height);
        }

        // Enhancements
        if (config.vignette) {
          const grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width/1.2);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }

        if (config.watermark) {
          ctx.font = 'bold 24px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.textAlign = 'right';
          ctx.fillText(config.watermarkText, width - 40, height - 40);
        }

        if (now < totalRequestedDuration) {
          requestAnimationFrame(render);
        } else {
          recorder.stop();
          audioSource.stop();
          vidEl.pause();
          audioCtx.close();
        }
      };

      render();

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Fusion Failed", description: "Browser environment error. Please try smaller files." });
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
              <Film size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Media<span className="gradient-text">Fusion</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed">
              Professional offline video engine. Automagically extends content to a 2-minute cinematic masterpiece.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-2 rounded-full border border-white/10">
             <ThemeToggle />
             <div className="px-4 flex items-center gap-2 text-sm font-medium">
               <Clock size={16} className="text-primary" />
               Min 2:00 Output
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <UploadCard
                type="image"
                title="Cover Art"
                description="Intro Image (3s)"
                accept=".jpg,.jpeg,.png"
                file={image}
                onUpload={(f) => handleUpload('image', f)}
                onClear={() => setImage(null)}
              />
              <UploadCard
                type="video"
                title="Main Footage"
                description="Loops to reach 2:00"
                accept=".mp4,.webm"
                file={video}
                onUpload={(f) => handleUpload('video', f)}
                onClear={() => setVideo(null)}
                metadata={metadata.video}
              />
              <UploadCard
                type="audio"
                title="Background Track"
                description="Auto-loops & Fades"
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
                <div className="w-full max-w-xl space-y-6 text-center animate-pulse">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={64} />
                    <span className="text-2xl font-bold text-primary tracking-tight">{processingStatus}</span>
                  </div>
                  <div className="space-y-3">
                    <Progress value={progress} className="h-4 w-full bg-primary/10" />
                    <div className="flex justify-between text-sm text-muted-foreground font-medium">
                      <span>{Math.round(progress)}% Complete</span>
                      <span>Estimated: ~30s remaining</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <Button
                    size="lg"
                    disabled={!allUploaded}
                    onClick={combineMedia}
                    className={cn(
                      "h-24 px-20 text-2xl font-black rounded-3xl transition-all duration-500",
                      allUploaded 
                        ? "bg-primary hover:bg-primary/90 text-white shadow-[0_20px_60px_rgba(8,_112,_184,_0.5)] scale-105 active:scale-95 animate-pulse-subtle" 
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Zap className="mr-4" size={32} fill="currentColor" />
                    Fuse & Export (Min 2:00)
                  </Button>
                  
                  {!allUploaded && (
                    <p className="text-sm text-muted-foreground animate-bounce">
                      Upload all 3 components to unlock the Fusion Core
                    </p>
                  )}

                  {(image || video || audio) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAll}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <RotateCcw className="mr-2" size={16} />
                      Reset Fusion Deck
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
