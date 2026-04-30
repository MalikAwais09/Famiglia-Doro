export const videoService = {
  validateVideoUrl: (url: string): { valid: boolean; type?: string; error?: string } => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return { valid: true, type: 'youtube' };
      if (hostname.includes('vimeo.com')) return { valid: true, type: 'vimeo' };
      if (hostname.includes('dailymotion.com')) return { valid: true, type: 'dailymotion' };
      return { valid: false, error: 'Unsupported video platform' };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  getYoutubeVideoId: (url: string): string | null => {
    const regexes = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const regex of regexes) {
      const match = url.match(regex);
      if (match && match[1]) return match[1];
    }
    return null;
  },

  getYoutubeEmbedUrl: (url: string): string | null => {
    const videoId = videoService.getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  },

  getYoutubeThumbnail: (url: string, quality: 'default' | 'medium' | 'high' = 'medium'): string | null => {
    const videoId = videoService.getYoutubeVideoId(url);
    if (!videoId) return null;
    const qualities = {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
    return qualities[quality];
  },

  getVimeoVideoId: (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  },

  getVimeoEmbedUrl: (url: string): string | null => {
    const videoId = videoService.getVimeoVideoId(url);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  },

  validateVideoFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024;
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) return { valid: false, error: 'Invalid video format. Use MP4, WebM, OGG, or MOV.' };
    if (file.size > maxSize) return { valid: false, error: 'Video too large. Max 50MB.' };
    return { valid: true };
  },

  getVideoDuration: (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const video = document.createElement('video');
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = reject;
        video.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  },

  generateVideoThumbnail: (file: File, timecode: number = 0): Promise<Blob> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          video.currentTime = timecode;
          video.oncanplay = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9);
            }
          };
        };
        video.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  },
};
