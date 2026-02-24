"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, FileVideo, HardDrive, RotateCcw, Loader2, PlayCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/media-utils';

interface CombinedOutputProps {
  blob: Blob;
  image: File | null;
  onReset: () => void;
}

export function CombinedOutput({ blob, image, onReset }: CombinedOutputProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [blob]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `MediaFusion_Master_1.30.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export Success",
      description: "Strict 1:30 master file saved to your device.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-green-500/20 text-green-500 rounded-2xl ring-1 ring-green-500/50 animate-pulse">
          <CheckCircle size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Master Fusion Ready</h2>
          <p className="text-muted-foreground">High-definition export processed locally in your RAM.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Result Preview */}
        <Card className="lg:col-span-2 glass-card overflow-hidden border-primary/20">
          <CardHeader className="bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <PlayCircle size={20} />
                <CardTitle className="text-lg">Final Master Preview</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  1080p Export
                </Badge>
                <Badge variant="secondary">
                  Duration: 1:30 (Exact)
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <Loader2 className="animate-spin text-primary" size={32} />
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="flex-1 h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-xl shadow-lg shadow-primary/20" 
                onClick={handleDownload}
                disabled={!videoUrl}
              >
                <Download className="mr-3" size={24} />
                Download Master ({formatBytes(blob.size)})
              </Button>
              <Button variant="outline" size="lg" onClick={onReset} className="h-16 px-8 border-white/10 hover:bg-white/5 rounded-xl">
                <RotateCcw className="mr-2" size={20} />
                New Fusion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Specs */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info size={18} className="text-primary" />
                Fusion Specs
              </CardTitle>
              <CardDescription>Technical blueprint of your master file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {[
                  { label: "Container", value: "MP4 (H.264/AAC)" },
                  { label: "Exact Duration", value: "90.00 Seconds" },
                  { label: "Bitrate", value: "8.0 Mbps (Target)" },
                  { label: "Frame Rate", value: "30 FPS" }
                ].map((spec, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{spec.label}</span>
                    <span className="text-sm font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mt-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <HardDrive size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Privacy Guarantee</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Fusion processing happens 100% in your browser's private sandbox. No data leaves your machine.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
