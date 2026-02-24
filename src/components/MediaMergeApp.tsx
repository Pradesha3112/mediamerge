"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { AdvancedOptions, type Config } from './AdvancedOptions';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Sparkles, Film, Clock, Music, History, Trash2, Download } from 'lucide-react';
import { getFileMetadata, loadImage, loadVideo, formatBytes, formatDuration } from '@/lib/media-utils';
import { saveVideoEntry, getAllVideoEntries, deleteVideoEntry, type VideoHistoryEntry } from '@/lib/video-db';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const INTRO_DURATION = 3; 
const MIN_FINAL_DURATION = 120; // 2 minutes

export function MediaMergeApp() {
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [audios, setAudios] = useState<File[]>([]);
  const [history, setHistory] = useState<VideoHistoryEntry[]>([]);
  const [metadata, setMetadata] = useState<{ video?: any }>({});
  
  const [config, setConfig] = useState<Config>({
    introTransition: 'zoom-in',
    videoTransition: 'crossfade',
    audioVolume: 0.8,
    audioFade: true,
    watermark: true,
    watermarkText: 'MediaFusion',
    roundedCorners: true,
    vignette: true,
    playbackSpeed: 1,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Preparing engines...");
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
      if (type === 'image') setImage(file);
      if (type === 'video') {
        const meta = await getFileMetadata(file);
        setVideo(file);
        setMetadata(prev => ({ ...prev, video: meta }));
      }
      if (type === 'audio') {
        setAudios(prev => [...prev, file]);
        toast({ title: "Audio Added", description: `${file.name} added to random picker pool.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Upload Error", description: "Invalid file format." });
    }
  };

  const combineMedia = async () => {
    if (!image || !video || audios.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Selecting random audio...");

    try {
      // Randomly pick an audio
      const audioFile = audios[Math.floor(Math.random() * audios.length)];
      
      const imgEl = await loadImage(image);
      const vidEl = await loadVideo(video);
      vidEl.playbackRate = config.playbackSpeed;
      
      const audioBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false })!;
      
      const width = vidEl.videoWidth || 1280;
      const height = vidEl.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      // Adjusted Duration Logic for Playback Speed
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
        videoBitsPerSecond: 6000000 
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: 'video/mp4' });
        setFinalVideoBlob(finalBlob);
        
        // Save to History
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 320;
        thumbCanvas.height = 180;
        thumbCanvas.getContext('2d')?.drawImage(imgEl, 0, 0, 320, 180);
        
        const entry: VideoHistoryEntry = {
          id: `fusion-${Date.now()}`,
          blob: finalBlob,
          thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.7),
          duration: totalRequestedDuration,
          size: finalBlob.size,
          timestamp: Date.now(),
          name: `Master Fusion ${new Date().toLocaleDateString()}`
        };
        await saveVideoEntry(entry);
        loadHistory();

        setIsProcessing(false);
        toast({ title: "Fusion Complete!", description: "Video added to history and ready for export." });
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
          if (config.introTransition === 'zoom-out') scale = 1.15 - (now / INTRO_DURATION) * 0.15;
          
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (width - drawW) / 2;
          const offsetY = (height - drawH) / 2;

          ctx.save();
          if (config.introTransition === 'blur') ctx.filter = `blur(${Math.max(0, 20 - now * 10)}px)`;
          ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);
          ctx.restore();

          if (now > INTRO_DURATION - transitionDuration) {
            const alpha = (now - (INTRO_DURATION - transitionDuration)) / transitionDuration;
            ctx.globalAlpha = alpha;
            ctx.drawImage(vidEl, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }
        } else {
          setProcessingStatus(now < MIN_FINAL_DURATION ? "Processing Loops..." : "Finalizing Stream...");
          ctx.drawImage(vidEl, 0, 0, width, height);
        }

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
      toast({ variant: "destructive", title: "Fusion Failed", description: "Processing error. Try reducing file sizes." });
    }
  };

  const removeAudio = (index: number) => {
    setAudios(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteVideoEntry(id);
    loadHistory();
    toast({ title: "Entry Deleted", description: "Video removed from history." });
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allUploaded = !!(image && video && audios.length > 0);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4 shadow-lg shadow-primary/20">
              <Film size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Media<span className="gradient-text">Fusion</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mt-4 leading-relaxed font-medium">
              Ultimate Offline Studio. High-fidelity rendering. Infinite loops. No cloud needed.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl p-2.5 rounded-2xl border border-white/5 shadow-2xl">
             <ThemeToggle />
             <div className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-primary/10 text-primary rounded-xl ring-1 ring-primary/20">
               <Clock size={16} />
               Min 2:00 Output
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UploadCard
                type="image"
                title="Cinematic Intro"
                description="3s Animated Frame"
                accept=".jpg,.jpeg,.png"
                file={image}
                onUpload={(f) => handleUpload('image', f)}
                onClear={() => setImage(null)}
              />
              <UploadCard
                type="video"
                title="Core Footage"
                description={`Auto-loops to 2:00 at ${config.playbackSpeed}x`}
                accept=".mp4,.webm"
                file={video}
                onUpload={(f) => handleUpload('video', f)}
                onClear={() => setVideo(null)}
                metadata={metadata.video}
              />
              
              {/* Multi Audio Management */}
              <Card className="glass-card flex flex-col h-full border-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Music size={20} />
                    </div>
                    {audios.length > 0 && <Badge variant="secondary" className="animate-in zoom-in">{audios.length} Files</Badge>}
                  </div>
                  <CardTitle className="text-xl mt-2">Audio Pool</CardTitle>
                  <CardDescription>Randomly picks one for each fuse</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 overflow-y-auto max-h-[120px] space-y-2 pr-1 custom-scrollbar">
                    {audios.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group animate-in slide-in-from-right-2">
                        <span className="text-xs truncate max-w-[120px] text-muted-foreground font-medium">{a.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeAudio(i)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    {audios.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-50">
                        <Music size={24} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Empty Pool</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-dashed border-white/10 hover:border-primary/50" onClick={() => document.getElementById('audio-pool-input')?.click()}>
                    <input id="audio-pool-input" type="file" accept=".mp3,.wav" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('audio', e.target.files[0])} />
                    Add Audio
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center justify-center space-y-8 py-10">
              {isProcessing ? (
                <div className="w-full max-w-xl space-y-8 text-center animate-in fade-in duration-500">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <Loader2 className="animate-spin text-primary" size={80} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={32} className="text-primary animate-pulse" />
                      </div>
                    </div>
                    <span className="text-3xl font-black text-primary tracking-tight neon-glow">{processingStatus}</span>
                  </div>
                  <div className="space-y-4">
                    <Progress value={progress} className="h-6 w-full bg-primary/10 border border-primary/20 shadow-inner" />
                    <div className="flex justify-between text-sm font-black text-muted-foreground uppercase tracking-widest">
                      <span>{Math.round(progress)}% Optimized</span>
                      <span>Processing Locally</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <Button
                    size="lg"
                    disabled={!allUploaded}
                    onClick={combineMedia}
                    className={cn(
                      "h-28 px-24 text-3xl font-black rounded-[2rem] transition-all duration-500 shadow-2xl",
                      allUploaded 
                        ? "bg-primary hover:bg-primary/90 text-white shadow-primary/40 scale-105 active:scale-95 animate-pulse-subtle border-t border-white/20" 
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Zap className="mr-5" size={40} fill="currentColor" />
                    FUSE NOW
                  </Button>
                  
                  {!allUploaded && (
                    <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest animate-bounce">
                      Ready the Fusion deck with all 3 components
                    </p>
                  )}

                  {(image || video || audios.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImage(null); setVideo(null); setAudios([]); setMetadata({}); setProgress(0); setFinalVideoBlob(null);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                      <RotateCcw className="mr-2" size={14} />
                      Purge Fusion Deck
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

        {/* Video Results */}
        {finalVideoBlob && !isProcessing && (
          <div className="pt-12 border-t border-white/5 animate-in zoom-in-95 duration-700">
            <CombinedOutput 
              blob={finalVideoBlob}
              image={image} 
              onReset={() => setFinalVideoBlob(null)} 
            />
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-8 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <History size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Fusion Vault</h2>
              </div>
              <Badge variant="outline" className="border-secondary/30 text-secondary font-bold">
                {history.length} Saved Masters
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((entry) => (
                <Card key={entry.id} className="glass-card overflow-hidden group hover:border-secondary/30 transition-all border-white/5">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <img src={entry.thumbnail} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" alt="Thumbnail" />
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur rounded text-[10px] font-bold text-white uppercase">
                      {formatDuration(entry.duration)}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm truncate font-black uppercase tracking-tight">{entry.name}</CardTitle>
                    <CardDescription className="text-[10px] font-bold">{new Date(entry.timestamp).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatBytes(entry.size)}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => downloadBlob(entry.blob, `${entry.id}.mp4`)}>
                        <Download size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteHistory(entry.id)}>
                        <Trash2 size={14} />
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 10px; }
      `}</style>
    </div>
  );
}