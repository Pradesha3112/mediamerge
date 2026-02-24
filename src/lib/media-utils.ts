export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s]
    .map(v => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
}

export async function getFileMetadata(file: File): Promise<{ duration?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const media = file.type.startsWith('video/') ? document.createElement('video') : document.createElement('audio');
      media.src = url;
      media.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: media.duration,
          width: (media as HTMLVideoElement).videoWidth,
          height: (media as HTMLVideoElement).videoHeight,
        });
      };
      media.onerror = () => resolve({});
    } else {
      resolve({});
    }
  });
}
