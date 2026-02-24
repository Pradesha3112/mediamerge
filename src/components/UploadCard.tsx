"use client";

import React, { useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, Music, X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { formatBytes, formatDuration } from '@/lib/media-utils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadCardProps {
  type: 'image' | 'video' | 'audio';
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  metadata?: {
    duration?: number;
    size?: number;
  };
}

export function UploadCard({ type, title, description, accept, file, onUpload, onClear, metadata }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const Icon = type === 'image' ? ImageIcon : type === 'video' ? Video : Music;

  return (
    <Card className="glass-card overflow-hidden group transition-all duration-300 hover:shadow-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <Icon size={20} />
          </div>
          {file && <CheckCircle2 className="text-green-500 animate-in zoom-in" size={20} />}
        </div>
        <CardTitle className="text-xl mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "upload-zone border-dashed border-2 p-8 transition-all duration-300 min-h-[160px]",
              isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-muted"
            )}
          >
            <input
              type="file"
              ref={inputRef}
              onChange={handleFileChange}
              accept={accept}
              className="hidden"
            />
            <Upload className="mb-4 text-muted-foreground group-hover:text-primary transition-colors" size={32} />
            <p className="text-sm font-medium text-center">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">{accept.split(',').join(', ')}</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative rounded-lg overflow-hidden bg-black/20 aspect-video flex items-center justify-center">
              {type === 'image' && (
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
              )}
              {type === 'video' && (
                <video src={URL.createObjectURL(file)} className="w-full h-full" controls={false} />
              )}
              {type === 'audio' && (
                <div className="flex flex-col items-center">
                  <Music className="text-primary mb-2" size={48} />
                  <audio src={URL.createObjectURL(file)} controls className="w-full max-w-[200px] h-8" />
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <FileText size={18} className="text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatBytes(file.size)}</span>
                  {metadata?.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(metadata.duration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
