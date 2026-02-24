"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Check, Copy, Share2, Play } from 'lucide-react';
import { generateVideoMetadata, type GenerateVideoMetadataOutput } from '@/ai/flows/generate-video-metadata-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CombinedOutputProps {
  image: File | null;
  video: File | null;
  audio: File | null;
  onReset: () => void;
}

export function CombinedOutput({ image, video, audio, onReset }: CombinedOutputProps) {
  const [metadata, setMetadata] = useState<GenerateVideoMetadataOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!video) return;
      setLoading(true);
      try {
        const prompt = `A video combining a screen recording named "${video.name}" and an audio track named "${audio?.name}". The visual cover is "${image?.name}". It's a professional media project.`;
        const result = await generateVideoMetadata({ videoPrompt: prompt });
        setMetadata(result);
      } catch (error) {
        console.error("Failed to generate AI metadata", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [image, video, audio]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Text is ready to paste.",
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
                <CardTitle className="text-2xl font-bold">Final Combined Media</CardTitle>
                <CardDescription>Your assets have been successfully merged into a single output.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/50 text-primary">Ready</Badge>
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
              <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Download className="mr-2" size={20} />
                Download Final Video
              </Button>
              <Button variant="outline" size="lg" onClick={onReset} className="flex-1 border-white/10 hover:bg-white/5">
                Reset All Uploads
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="text-secondary animate-pulse" size={20} />
              <CardTitle>AI Insights</CardTitle>
            </div>
            <CardDescription>Generated titles & descriptions for your content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : metadata ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Suggested Titles</h4>
                  <div className="space-y-2">
                    {metadata.titles.map((title, i) => (
                      <div key={i} className="group relative p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => copyToClipboard(title, i)}>
                        <p className="text-sm font-medium pr-8">{title}</p>
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedIndex === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Descriptions</h4>
                  <div className="space-y-2">
                    {metadata.descriptions.slice(0, 2).map((desc, i) => (
                      <div key={i + 10} className="group relative p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => copyToClipboard(desc, i + 10)}>
                        <p className="text-xs text-muted-foreground pr-8 leading-relaxed line-clamp-3">{desc}</p>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedIndex === i + 10 ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Sparkles size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Something went wrong generating suggestions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
