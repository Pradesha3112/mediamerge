"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Play, CheckCircle, FileVideo, HardDrive, RotateCcw, Loader2 } from 'lucide-react';
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
    a.download = `MediaMerge_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export Success",
      description: "Final combined video saved to your device.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
          <CheckCircle size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Processing Complete</h2>
          <p className="text-muted-foreground">Your high-definition master file is ready for download.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Result Preview */}
        <Card className="lg:col-span-2 glass-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileVideo className="text-primary" />
                <CardTitle>Final Preview</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                1080p Export
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative group aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl flex items-center justify-center">
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
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-bold" 
                onClick={handleDownload}
                disabled={!videoUrl}
              >
                <Download className="mr-2" size={20} />
                Download Final Video ({formatBytes(blob.size)})
              </Button>
              <Button variant="outline" size="lg" onClick={onReset} className="h-14 border-white/10 hover:bg-white/5">
                <RotateCcw className="mr-2" size={20} />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Specs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>File Information</CardTitle>
            <CardDescription>Technical details of your combined media.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-muted-foreground">Format</span>
                <span className="text-sm font-medium">MP4 (MPEG-4)</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-muted-foreground">Codec</span>
                <span className="text-sm font-medium">H.264 / AAC</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">{formatBytes(blob.size)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-muted-foreground">Encryption</span>
                <span className="text-sm font-medium">None (Open)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <HardDrive size={16} />
                <span className="text-sm font-bold">Privacy Note</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This file was generated entirely in your browser's RAM. No data was uploaded to any server. Your content remains 100% private.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
