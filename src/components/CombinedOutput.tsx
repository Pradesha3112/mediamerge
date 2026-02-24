"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Check, Copy, Share2, Play, FileVideo, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CombinedOutputProps {
  image: File | null;
  video: File | null;
  audio: File | null;
  onReset: () => void;
}

export function CombinedOutput({ image, video, audio, onReset }: CombinedOutputProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Local metadata generation (Offline)
  const suggestions = useMemo(() => {
    if (!video) return { titles: [], descriptions: [] };
    const baseName = video.name.split('.')[0];
    return {
      titles: [
        `Master Edit: ${baseName}`,
        `${baseName} with Custom Soundtrack`,
        `Professional MediaMerge Production`,
        `Enhanced Recording - ${new Date().toLocaleDateString()}`
      ],
      descriptions: [
        `This video combines the original screen recording "${video.name}" with the audio track "${audio?.name || 'Unknown'}".`,
        `A polished media project featuring custom overlays and synced local audio streams.`,
        `Output generated 100% locally using MediaMerge browser-side tools.`
      ]
    };
  }, [video, audio]);

  const handleDownload = () => {
    if (!video) return;
    // In a real browser-based tool, we'd trigger the local Blob download
    const url = URL.createObjectURL(video);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediaMerge_${video.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your combined media is being saved to your device.",
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied",
      description: "Metadata ready to use.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Result Preview */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Combined Output</CardTitle>
                <CardDescription>Preview of your merged local media assets.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/50 text-primary flex gap-1">
                <HardDrive size={12} /> Offline Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative group aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl">
              <video 
                src={video ? URL.createObjectURL(video) : ""} 
                poster={image ? URL.createObjectURL(image) : ""}
                className="w-full h-full object-contain"
                controls
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg" onClick={handleDownload}>
                <Download className="mr-2" size={20} />
                Download Final Video
              </Button>
              <Button variant="outline" size="lg" onClick={onReset} className="flex-1 border-foreground/10 hover:bg-foreground/5">
                Start New Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Local Metadata Suggestions */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileVideo className="text-secondary" size={20} />
              <CardTitle>Metadata Tools</CardTitle>
            </div>
            <CardDescription>Local suggestions based on your files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Local Titles</h4>
                <div className="space-y-2">
                  {suggestions.titles.map((title, i) => (
                    <div key={i} className="group relative p-3 bg-foreground/5 border border-foreground/10 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer" onClick={() => copyToClipboard(title, i)}>
                      <p className="text-sm font-medium pr-8">{title}</p>
                      <div className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIndex === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Project Notes</h4>
                <div className="space-y-2">
                  {suggestions.descriptions.map((desc, i) => (
                    <div key={i + 10} className="group relative p-3 bg-foreground/5 border border-foreground/10 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer" onClick={() => copyToClipboard(desc, i + 10)}>
                      <p className="text-xs text-muted-foreground pr-8 leading-relaxed line-clamp-3">{desc}</p>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIndex === i + 10 ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}