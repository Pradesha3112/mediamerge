"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings2, Sparkles, Volume2, Type, Gauge, Filter, Share2, Layers } from 'lucide-react';

export type Config = {
  introTransition: string;
  videoTransition: string;
  transitionPack: 'basic' | 'cinematic' | 'glitch' | 'modern';
  filter: 'none' | 'bw' | 'sepia' | 'contrast' | 'warm' | 'cool' | 'retro';
  preset: 'youtube' | 'linkedin';
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
    <Card className="glass-card border-white/5 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="text-primary" size={20} />
          <CardTitle className="text-xl">Editing Studio</CardTitle>
        </div>
        <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Advanced Cinematic Tuning</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Export Presets */}
        <div className="space-y-4 pb-4 border-b border-white/5">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <Share2 size={14} className="text-primary" /> Export Preset
            </Label>
            <Select value={config.preset} onValueChange={(v) => update('preset', v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10">
                <SelectValue placeholder="Resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube Tutorial (16:9)</SelectItem>
                <SelectItem value="linkedin">LinkedIn Professional (4:5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Visual Tuning */}
        <div className="space-y-4 pb-4 border-b border-white/5">
           <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <Filter size={14} className="text-secondary" /> Cinematic Filter
            </Label>
            <Select value={config.filter} onValueChange={(v) => update('filter', v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Filter (Natural)</SelectItem>
                <SelectItem value="bw">Black & White</SelectItem>
                <SelectItem value="sepia">Vintage Sepia</SelectItem>
                <SelectItem value="contrast">High Contrast</SelectItem>
                <SelectItem value="warm">Warm Sunshine</SelectItem>
                <SelectItem value="cool">Icy Cool</SelectItem>
                <SelectItem value="retro">Retro VHS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <Layers size={14} className="text-primary" /> Transition Pack
            </Label>
            <Select value={config.transitionPack} onValueChange={(v) => update('transitionPack', v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10">
                <SelectValue placeholder="Transitions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Fade</SelectItem>
                <SelectItem value="cinematic">Cinematic Zoom</SelectItem>
                <SelectItem value="glitch">Digital Glitch</SelectItem>
                <SelectItem value="modern">Modern Slide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="space-y-4 pb-4 border-b border-white/5">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <Gauge size={14} className="text-primary" /> Playback Speed
            </Label>
            <Select value={String(config.playbackSpeed)} onValueChange={(v) => update('playbackSpeed', parseFloat(v))}>
              <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10">
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

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
              <Type size={14} /> Master Watermark
            </Label>
            <Input 
              value={config.watermarkText} 
              onChange={(e) => update('watermarkText', e.target.value)}
              placeholder="Studio Branding"
              className="h-10 rounded-xl bg-white/5 border-white/10 text-xs"
            />
          </div>
        </div>

        {/* Audio Tuning */}
        <div className="space-y-6 pt-2 pb-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                <Volume2 size={14} /> Audio Fade Transitions
              </Label>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest leading-none">Smooth Master Audio Blend</p>
            </div>
            <Switch checked={config.audioFade} onCheckedChange={(v) => update('audioFade', v)} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Backing Track Volume</span>
              <span>{Math.round(config.audioVolume * 100)}%</span>
            </div>
            <Slider 
              value={[config.audioVolume * 100]} 
              onValueChange={(v) => update('audioVolume', v[0] / 100)} 
              max={100} 
              step={1} 
              className="py-2"
            />
          </div>
        </div>

        {/* Studio Presets */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <Label className="text-[9px] font-black uppercase tracking-widest">Vignette</Label>
            <Switch checked={config.vignette} onCheckedChange={(v) => update('vignette', v)} />
          </div>
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <Label className="text-[9px] font-black uppercase tracking-widest">Rounded</Label>
            <Switch checked={config.roundedCorners} onCheckedChange={(v) => update('roundedCorners', v)} />
          </div>
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] font-black uppercase tracking-widest">Overlay Master</Label>
              <Switch checked={config.watermark} onCheckedChange={(v) => update('watermark', v)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
