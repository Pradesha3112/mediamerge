"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UploadCard } from './UploadCard';
import { CombinedOutput } from './CombinedOutput';
import { AdvancedOptions, type Config } from './AdvancedOptions';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Layers, Loader2, RotateCcw, Zap, Music, Clock, Trash2, Library, Download } from 'lucide-react';
import { loadImage, loadVideo, formatBytes, formatDuration } from '@/lib/media-utils';
import { 
  saveVideoEntry, 
  getAllVideoEntries, 
  deleteVideoEntry, 
  saveAudioEntry,
  getAllAudioEntries,
  deleteAudioEntry,
  type VideoHistoryEntry,
  type AudioPoolEntry
} from '@/lib/video-db';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BANNER_DURATION = 4;
const END_CARD_DURATION = 4;

function ImageThumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group bg-black/20">
      <img src={url} className="w-full h-full object-cover" alt="Banner Thumb" />
      <Button 
        variant="destructive" 
        size="icon" 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity h-full w-full rounded-none" 
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function MediaMergeApp() {
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [audios, setAudios] = useState<AudioPoolEntry[]>([]);
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
    thankYouText: '',
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
    loadAudioPool();
  }, []);

  const loadHistory = async () => {
    const entries = await getAllVideoEntries();
    setHistory(entries);
  };

  const loadAudioPool = async () => {
    const entries = await getAllAudioEntries();
    setAudios(entries);
  };

  const handleUpload = async (type: 'image' | 'video' | 'audio', input: File | File[]) => {
    const files = Array.isArray(input) ? input : [input];
    
    if (type === 'image') {
      if (images.length + files.length > 15) {
        toast({ variant: "destructive", title: "Limit Reached", description: "Maximum 15 intro images allowed." });
        return;
      }
      setImages(prev => [...prev, ...files]);
      toast({ title: "Banner Assets Added", description: `${files.length} image(s) added.` });
    }
    if (type === 'video') setVideo(files[0]);
    if (type === 'audio') {
      for (const file of files) {
        const entry: AudioPoolEntry = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          timestamp: Date.now()
        };
        await saveAudioEntry(entry);
      }
      loadAudioPool();
      toast({ title: "Audio Pool Updated", description: `${files.length} track(s) added to permanent library.` });
    }
  };

  const removeAudio = async (id: string) => {
    await deleteAudioEntry(id);
    loadAudioPool();
  };

  const handleHistoryDownload = (entry: VideoHistoryEntry) => {
    const url = URL.createObjectURL(entry.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entry.name.toLowerCase().endsWith('.mp4') ? entry.name : `${entry.name}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Retreived",
      description: "File saved from local vault.",
    });
  };

  const combineMedia = async () => {
    if (images.length === 0 || !video || audios.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus("Calibrating Media Engine...");

    try {
      const audioEntry = audios[Math.floor(Math.random() * audios.length)];
      const audioFile = audioEntry.file;
      const loadedImages = await Promise.all(images.map(img => loadImage(img)));
      const vidEl = await loadVideo(video);
      
      const introPhaseTotal = images.length * BANNER_DURATION;
      const effectiveRecordingDuration = vidEl.duration / config.playbackSpeed;
      const totalRequestedDuration = introPhaseTotal + effectiveRecordingDuration + END_CARD_DURATION;

      vidEl.playbackRate = config.playbackSpeed;
      
      const audioBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false })!;
      
      let width = 1920;
      let height = 1080;
      if (config.preset === 'linkedin') { width = 1080; height = 1350; }
      
      canvas.width = width;
      canvas.height = height;

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
          name: `Fusion Export - ${new Date().toLocaleTimeString()} (${formatDuration(totalRequestedDuration)})`
        };
        await saveVideoEntry(entry);
        loadHistory();
        setIsProcessing(false);

        // Auto-Reset Workspace
        setImages([]);
        setVideo(null);
        toast({ title: "Fusion Complete", description: `Exported: ${formatDuration(totalRequestedDuration)}.` });
      };

      recorder.start();
      audioSource.start(0);
      
      const startTime = performance.now();
      const crossfadeDuration = 0.5;
      
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

        if (now < introPhaseTotal) {
          // PHASE 1: BANNER SEQUENCE (4s each)
          const imgIndex = Math.floor(now / BANNER_DURATION);
          const currentImg = loadedImages[imgIndex];
          const nextImgIndex = imgIndex + 1;
          const imageLocalTime = now % BANNER_DURATION;
          
          let scale = 1.0;
          if (config.introTransition === 'zoom-in') {
            scale = 1 + (imageLocalTime / BANNER_DURATION) * 0.05;
          }
          
          const drawW = width * scale;
          const drawH = height * scale;
          const offsetX = (width - drawW) / 2;
          const offsetY = (height - drawH) / 2;

          ctx.drawImage(currentImg, offsetX, offsetY, drawW, drawH);

          // Transition to next banner or recording
          if (imageLocalTime > (BANNER_DURATION - crossfadeDuration)) {
            const alpha = (imageLocalTime - (BANNER_DURATION - crossfadeDuration)) / crossfadeDuration;
            ctx.globalAlpha = alpha;
            if (nextImgIndex < loadedImages.length) {
              ctx.drawImage(loadedImages[nextImgIndex], 0, 0, width, height);
            } else {
              // Transitioning to recording
              ctx.drawImage(vidEl, 0, 0, width, height);
            }
            ctx.globalAlpha = 1.0;
          }

          // Ensure video is paused or prepared
          if (vidEl.currentTime > 0) vidEl.currentTime = 0;
          if (!vidEl.paused) vidEl.pause();

        } else if (now < introPhaseTotal + effectiveRecordingDuration) {
          // PHASE 2: MASTER RECORDING
          if (vidEl.paused) vidEl.play();
          ctx.drawImage(vidEl, 0, 0, width, height);
        } else {
          // PHASE 3: AUTOMATIC THANK YOU END CARD (4s)
          if (!vidEl.paused) vidEl.pause();
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          
          // Cinematic "THANK YOU"
          ctx.font = 'bold 120px Inter, sans-serif';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('THANK YOU', width / 2, height / 2 - 20);
          
          // Subtitle (Custom or Fallback to Watermark)
          const subtitleText = config.thankYouText || config.watermarkText || 'MediaFusion Professional Export';
          ctx.font = '30px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(subtitleText, width / 2, height / 2 + 100);
          
          // Decorative line
          ctx.fillStyle = 'hsl(var(--primary))';
          ctx.fillRect(width / 2 - 100, height / 2 + 50, 200, 4);
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
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
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
    } catch (e: any) {
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Fusion Error", description: e.message });
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-10">
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
               DYNAMIC EXPORT
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <UploadCard
                type="image"
                title="Banner Assets"
                description="4s each in sequence. At least 1 required."
                accept=".jpg,.jpeg,.png"
                multiple
                file={images.length > 0 ? images[images.length - 1] : null}
                onUpload={(f) => handleUpload('image', f)}
                onClear={() => setImages([])}
              />
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                  {images.map((img, i) => (
                    <ImageThumbnail key={`${img.name}-${i}`} file={img} onRemove={() => removeImage(i)} />
                  ))}
                </div>
              )}
            </div>
            <UploadCard
              type="video"
              title="Master Recording"
              description="Original format playback with speed control."
              accept=".mp4,.webm"
              file={video}
              onUpload={(f) => handleUpload('video', f)}
              onClear={() => setVideo(null)}
            />
          </div>

          <div className="space-y-6">
            <Card className="glass-card flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Library size={20} /></div>
                  {audios.length > 0 && <Badge variant="secondary">{audios.length} Tracks In Library</Badge>}
                </div>
                <CardTitle className="text-xl mt-2">Permanent Audio Library</CardTitle>
                <CardDescription>Saved in browser. Randomly chosen for fusion.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2 custom-scrollbar">
                  {audios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed border-white/5 rounded-2xl">
                       <Music size={32} className="mb-2 opacity-20" />
                       <span className="text-xs uppercase font-black tracking-widest">Library Empty</span>
                    </div>
                  ) : (
                    audios.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-colors">
                        <div className="flex flex-col min-w-0 flex-1 mr-4">
                          <span className="text-xs truncate font-medium">{entry.name}</span>
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{formatBytes(entry.size)} • {new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" 
                          onClick={() => removeAudio(entry.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="w-full h-14 border-dashed border-white/10 hover:border-primary/50 text-xs font-bold uppercase tracking-widest" onClick={() => document.getElementById('audio-input')?.click()}>
                  <input id="audio-input" type="file" multiple accept=".mp3,.wav" className="hidden" onChange={(e) => e.target.files && handleUpload('audio', Array.from(e.target.files))} />
                  Add To Library
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          <div className="lg:col-span-1">
             <AdvancedOptions config={config} onChange={setConfig} />
          </div>

          <div className="lg:col-span-3 flex flex-col items-center justify-center py-10">
            {isProcessing ? (
              <div className="w-full max-w-2xl space-y-8 text-center bg-card/40 p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
                <div className="flex flex-col items-center gap-6">
                  <Loader2 className="animate-spin text-primary" size={80} />
                  <span className="text-3xl font-black text-primary tracking-tight neon-glow uppercase">{processingStatus}</span>
                </div>
                <div className="space-y-4">
                  <Progress value={progress} className="h-4 w-full" />
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <span>Local Rendering</span>
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
                      ? "bg-primary hover:bg-primary/90 text-white shadow-primary/40 scale-105 active:scale-95" 
                      : "bg-muted text-muted-foreground opacity-30 cursor-not-allowed"
                  )}
                >
                  <Zap className="mr-5" size={48} fill="currentColor" />
                  FUSE NOW
                </Button>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  Includes Automatic {END_CARD_DURATION}s End Card
                </div>
              </div>
            )}
          </div>
        </div>

        {finalVideoBlob && !isProcessing && (
          <div className="pt-12 animate-in zoom-in-95 duration-700">
            <CombinedOutput 
              blob={finalVideoBlob}
              image={null} 
              onReset={() => setFinalVideoBlob(null)} 
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-8 pt-16 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Vault</h2>
              <Badge variant="outline" className="border-secondary/30 text-secondary font-black px-4 py-1">
                {history.length} MASTERS SAVED
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.map((entry) => (
                <Card key={entry.id} className="glass-card overflow-hidden group hover:border-secondary/50 transition-all border-white/5">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <img src={entry.thumbnail} className="w-full h-full object-cover opacity-80" alt="Master Thumb" />
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base truncate font-black uppercase tracking-tight">{entry.name}</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(entry.timestamp).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatBytes(entry.size)}</span>
                    <div className="flex gap-3">
                       <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/5 rounded-xl text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleHistoryDownload(entry)}>
                        <Download size={16} />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/5 rounded-xl" onClick={() => deleteVideoEntry(entry.id).then(loadHistory)}>
                        <Trash2 size={16} className="text-destructive" />
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
