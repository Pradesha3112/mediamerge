"use client";

import React, { useState, useEffect } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { AdvancedOptions, type Config } from './AdvancedOptions';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Sparkles, Film, Clock, Music, History, Trash2, Download, Filter, Share2 } from 'lucide-react';
import { getFileMetadata, loadImage, loadVideo, formatBytes, formatDuration } from '@/lib/media-utils';
import { saveVideoEntry, getAllVideoEntries, deleteVideoEntry, type VideoHistoryEntry } from '@/lib/video-db';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const INTRO_DURATION = 4; 
const MIN_FINAL_DURATION = 120; // 2 minutes

export function MediaMergeApp() {
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [audios, setAudios] = useState<File[]>([]);
  const [history, setHistory] = useState<VideoHistoryEntry[]>([]);
  
  const [config, setConfig] = useState<Config>({
    introTransition: 'zoom-in',
    videoTransition: 'crossfade',
    transitionPack: 'cinematic',
    filter: 'none',
    preset: 'youtube',
    audioVolume: 0.8,
    audioFade: true,
    watermark: true,
    watermarkText: 'MediaFusion',
    roundedCorners: true,
    vignette: true,
    playbackSpeed: 1,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Initializing Studio...");
  const [progress, setProgress] = useState(0);
  const [finalVideoBlob, setFinalVideoBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const entries = await getAllVideoEntries();
    setHistory(entries);
  };

  const handleUpload = async (type: 'image' | 'video' | 'audio', file: File) => {
    try {
      if (type === 'image') setImages(prev => [...prev, file]);
      if (type === 'video') setVideo(file);
      if (type === 'audio') {
        setAudios(prev => [...prev, file]);
        toast({ title: "Audio Pool Updated", description: `${file.name} added.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Error", description: "Invalid file format." });
    }
  };

  const combineMedia = async () => {
    if (images.length === 0 || !video || audios.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Assembling media blocks...");

    try {
      const audioFile = audios[Math.floor(Math.random() * audios.length)];
      const primaryImage = images[0];
      const imgEl = await loadImage(primaryImage);
      const vidEl = await loadVideo(video);
      vidEl.playbackRate = config.playbackSpeed;
      
      const audioBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false })!;
      
      // Preset Resolution logic
      let width = 1920;
      let height = 1080;
      if (config.preset === 'linkedin') { width = 1080; height = 1350; }
      
      canvas.width = width;
      canvas.height = height;

      const adjustedVideoDuration = vidEl.duration / config.playbackSpeed;
      const totalRequestedDuration = Math.max(MIN_FINAL_DURATION, INTRO_DURATION + adjustedVideoDuration);
      
      const stream = canvas.captureStream(30);
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
        videoBitsPerSecond: 8000000 
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: 'video/mp4' });
        setFinalVideoBlob(finalBlob);
        
        const entry: VideoHistoryEntry = {
          id: `fusion-${Date.now()}`,
          blob: finalBlob,
          thumbnail: canvas.toDataURL('image/jpeg', 0.5),
          duration: totalRequestedDuration,
          size: finalBlob.size,
          timestamp: Date.now(),
          name: `${config.preset.toUpperCase()} Fusion ${new Date().toLocaleTimeString()}`
        };
        await saveVideoEntry(entry);
        loadHistory();
        setIsProcessing(false);
      };

      recorder.start();
      audioSource.start(0);
      vidEl.play();
      vidEl.loop = true;

      const startTime = performance.now();
      const transitionDuration = 1.0;
      
      const applyFilter = (ctx: CanvasRenderingContext2D) => {
        switch(config.filter) {
          case 'bw': ctx.filter = 'grayscale(100%)'; break;
          case 'sepia': ctx.filter = 'sepia(100%)'; break;
          case 'contrast': ctx.filter = 'contrast(150%) brightness(110%)'; break;
          case 'warm': ctx.filter = 'sepia(30%) saturate(150%) hue-rotate(-10deg)'; break;
          case 'cool': ctx.filter = 'saturate(120%) hue-rotate(10deg) brightness(105%)'; break;
          case 'retro': ctx.filter = 'contrast(120%) saturate(80%) sepia(20%)'; break;
          default: ctx.filter = 'none';
        }
      };

      const render = () => {
        const now = (performance.now() - startTime) / 1000;
        const p = Math.min((now / totalRequestedDuration) * 100, 100);
        setProgress(p);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        applyFilter(ctx);

        if (now < INTRO_DURATION) {
          setProcessingStatus("Rendering 4s Cinematic Intro...");
          let scale = 1.0;
          if (config.introTransition === 'zoom-in') scale = 1 + (now / INTRO_DURATION) * 0.2;
          
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (width - drawW) / 2;
          const offsetY = (height - drawH) / 2;

          ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);

          // Transition to video logic
          if (now > INTRO_DURATION - transitionDuration) {
            const alpha = (now - (INTRO_DURATION - transitionDuration)) / transitionDuration;
            if (config.transitionPack === 'cinematic') {
              ctx.globalAlpha = alpha;
              ctx.drawImage(vidEl, 0, 0, width, height);
            } else if (config.transitionPack === 'glitch') {
              const glitchOffset = Math.random() * 20 * alpha;
              ctx.drawImage(vidEl, glitchOffset, 0, width, height);
              ctx.globalAlpha = alpha * 0.5;
            } else {
              ctx.globalAlpha = alpha;
              ctx.drawImage(vidEl, 0, 0, width, height);
            }
          }
        } else {
          setProcessingStatus(now < MIN_FINAL_DURATION ? "Enforcing 120s Minimum Duration..." : "Finalizing Export...");
          ctx.drawImage(vidEl, 0, 0, width, height);
        }

        ctx.restore();

        if (config.vignette) {
          const grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width/1.1);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, 'rgba(0,0,0,0.7)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }

        if (config.watermark) {
          ctx.font = 'bold 32px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.textAlign = 'right';
          ctx.fillText(config.watermarkText, width - 60, height - 60);
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
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Fusion Error", description: "Browser processing limit reached." });
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));
  const removeAudio = (index: number) => setAudios(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Media<span className="gradient-text">Fusion</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2 font-medium">
              Ultimate Offline Studio. High-fidelity rendering. Infinite loops. No cloud needed.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-card/60 backdrop-blur-xl p-3 rounded-2xl border border-white/5 shadow-xl">
             <ThemeToggle />
             <div className="px-4 py-2 flex items-center gap-2 text-xs font-black bg-primary/10 text-primary rounded-xl border border-primary/20">
               <Clock size={14} />
               MIN 2:00 OUTPUT
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Media Inputs */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <UploadCard
                type="image"
                title="Banners & Assets"
                description="4s Intro Frame (Slide 1 used)"
                accept=".jpg,.jpeg,.png"
                file={images[0] || null}
                onUpload={(f) => handleUpload('image', f)}
                onClear={() => setImages([])}
              />
              <UploadCard
                type="video"
                title="Master Recording"
                description={`Auto-loops to 2:00 at ${config.playbackSpeed}x`}
                accept=".mp4,.webm"
                file={video}
                onUpload={(f) => handleUpload('video', f)}
                onClear={() => setVideo(null)}
              />
            </div>
          </div>

          {/* Column 2: Audio & Controls */}
          <div className="space-y-6">
            <Card className="glass-card flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Music size={20} /></div>
                  {audios.length > 0 && <Badge variant="secondary">{audios.length} Tracks</Badge>}
                </div>
                <CardTitle className="text-xl mt-2">Background Audio Pool</CardTitle>
                <CardDescription>Randomly picked to match final duration</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1 overflow-y-auto max-h-[140px] space-y-2 pr-2 custom-scrollbar">
                  {audios.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 group">
                      <span className="text-xs truncate max-w-[200px] text-muted-foreground font-medium">{a.name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeAudio(i)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  {audios.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50 border-2 border-dashed border-white/5 rounded-2xl">
                      <Music size={32} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Empty Deck</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full h-12 border-dashed border-white/10 hover:border-primary/50 text-xs font-bold uppercase tracking-widest" onClick={() => document.getElementById('audio-input')?.click()}>
                  <input id="audio-input" type="file" accept=".mp3,.wav" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('audio', e.target.files[0])} />
                  Add New Audio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Editing & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          <div className="lg:col-span-1">
             <AdvancedOptions config={config} onChange={setConfig} />
          </div>

          <div className="lg:col-span-3 flex flex-col items-center justify-center py-10">
            {isProcessing ? (
              <div className="w-full max-w-2xl space-y-8 text-center bg-card/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    <Loader2 className="animate-spin text-primary relative" size={80} />
                  </div>
                  <span className="text-3xl font-black text-primary tracking-tight neon-glow uppercase">{processingStatus}</span>
                </div>
                <div className="space-y-4">
                  <Progress value={progress} className="h-4 w-full bg-primary/10 border border-primary/20" />
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <span>Local Compositing</span>
                    <span>{Math.round(progress)}% Ready</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-10">
                <Button
                  size="lg"
                  disabled={images.length === 0 || !video || audios.length === 0}
                  onClick={combineMedia}
                  className={cn(
                    "h-28 px-24 text-4xl font-black rounded-[2.5rem] transition-all duration-500 shadow-2xl uppercase tracking-tighter",
                    (images.length > 0 && video && audios.length > 0)
                      ? "bg-primary hover:bg-primary/90 text-white shadow-primary/40 scale-105 active:scale-95 animate-pulse-subtle" 
                      : "bg-muted text-muted-foreground opacity-30 cursor-not-allowed"
                  )}
                >
                  <Zap className="mr-5" size={48} fill="currentColor" />
                  FUSE NOW
                </Button>
                
                {(images.length > 0 || video || audios.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setImages([]); setVideo(null); setAudios([]); setProgress(0); setFinalVideoBlob(null); }}
                    className="text-muted-foreground hover:text-destructive font-black uppercase tracking-widest text-[11px]"
                  >
                    <RotateCcw className="mr-2" size={14} /> Purge Studio
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Final Output */}
        {finalVideoBlob && !isProcessing && (
          <div className="pt-12 animate-in zoom-in-95 duration-700">
            <CombinedOutput 
              blob={finalVideoBlob}
              image={images[0]} 
              onReset={() => setFinalVideoBlob(null)} 
            />
          </div>
        )}

        {/* History Vault */}
        {history.length > 0 && (
          <div className="space-y-8 pt-16 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shadow-inner"><History size={28} /></div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Vault</h2>
              </div>
              <Badge variant="outline" className="border-secondary/30 text-secondary font-black px-4 py-1">
                {history.length} MASTERS SAVED
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.map((entry) => (
                <Card key={entry.id} className="glass-card overflow-hidden group hover:border-secondary/50 transition-all border-white/5">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <img src={entry.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Master Thumb" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 font-black text-white text-[11px] uppercase tracking-widest bg-primary/20 px-3 py-1 rounded-full backdrop-blur-md">
                      {formatDuration(entry.duration)}
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base truncate font-black uppercase tracking-tight">{entry.name}</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(entry.timestamp).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatBytes(entry.size)}</span>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary bg-white/5 rounded-xl" onClick={() => {
                        const url = URL.createObjectURL(entry.blob);
                        const a = document.createElement('a'); a.href = url; a.download = `${entry.name}.mp4`; a.click();
                        URL.revokeObjectURL(url);
                      }}>
                        <Download size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive bg-white/5 rounded-xl" onClick={() => { deleteVideoEntry(entry.id); loadHistory(); }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <Toaster />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}
