"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings2, Sparkles, Volume2, Type, Gauge } from 'lucide-react';

export type Config = {
  introTransition: string;
  videoTransition: string;
  audioVolume: number;
  audioFade: boolean;
  watermark: boolean;
  watermarkText: string;
  roundedCorners: boolean;
  vignette: boolean;
  playbackSpeed: number;
};

interface AdvancedOptionsProps {
  config: Config;
  onChange: (config: Config) => void;
}

export function AdvancedOptions({ config, onChange }: AdvancedOptionsProps) {
  const update = (key: keyof Config, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card className="glass-card animate-in fade-in slide-in-from-right-4 duration-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="text-primary" size={20} />
          <CardTitle>Advanced Customization</CardTitle>
        </div>
        <CardDescription>Tailor the cinematic experience of your output.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Sparkles size={14} className="text-secondary" /> Intro Animation
            </Label>
            <Select value={config.introTransition} onValueChange={(v) => update('introTransition', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Smooth Fade In</SelectItem>
                <SelectItem value="zoom-in">Ken Burns (Zoom In)</SelectItem>
                <SelectItem value="zoom-out">Ken Burns (Zoom Out)</SelectItem>
                <SelectItem value="blur">Blur to Clear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Transition to Video</Label>
            <Select value={config.videoTransition} onValueChange={(v) => update('videoTransition', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose transition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crossfade">Crossfade</SelectItem>
                <SelectItem value="fade-black">Fade through Black</SelectItem>
                <SelectItem value="cut">Direct Cut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Gauge size={14} className="text-primary" /> Playback Speed
            </Label>
            <Select value={String(config.playbackSpeed)} onValueChange={(v) => update('playbackSpeed', parseFloat(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5×</SelectItem>
                <SelectItem value="1">1.0× (Normal)</SelectItem>
                <SelectItem value="1.25">1.25×</SelectItem>
                <SelectItem value="1.5">1.5×</SelectItem>
                <SelectItem value="2">2.0×</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Volume2 size={14} /> Audio Fade (In/Out)
              </Label>
              <p className="text-[10px] text-muted-foreground">Smooth transitions for your sound.</p>
            </div>
            <Switch checked={config.audioFade} onCheckedChange={(v) => update('audioFade', v)} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <Label>Background Volume</Label>
              <span className="text-muted-foreground">{Math.round(config.audioVolume * 100)}%</span>
            </div>
            <Slider 
              value={[config.audioVolume * 100]} 
              onValueChange={(v) => update('audioVolume', v[0] / 100)} 
              max={100} 
              step={1} 
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vignette Effect</Label>
              <p className="text-[10px] text-muted-foreground">Add cinematic dark edges.</p>
            </div>
            <Switch checked={config.vignette} onCheckedChange={(v) => update('vignette', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rounded Corners</Label>
              <p className="text-[10px] text-muted-foreground">Soften the video edges.</p>
            </div>
            <Switch checked={config.roundedCorners} onCheckedChange={(v) => update('roundedCorners', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Type size={14} /> Watermark
              </Label>
              <p className="text-[10px] text-muted-foreground">Add "MediaFusion" branding.</p>
            </div>
            <Switch checked={config.watermark} onCheckedChange={(v) => update('watermark', v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}