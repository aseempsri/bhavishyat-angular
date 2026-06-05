import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { YouTubeVideo } from './youtube.service';

@Injectable({ providedIn: 'root' })
export class VideoShareService {
  private document = inject(DOCUMENT);

  getShareUrl(video: YouTubeVideo, bustCache = true): string {
    const origin = this.document.defaultView?.location.origin ?? '';
    const baseUrl = `${origin}${this.getBaseHref()}share/${video.id}.html`;

    if (!bustCache) {
      return baseUrl;
    }

    return `${baseUrl}?v=${Date.now()}`;
  }

  getGurukulVideoUrl(video: YouTubeVideo): string {
    const origin = this.document.defaultView?.location.origin ?? '';
    return `${origin}${this.getBaseHref()}class-recordings?v=${video.id}`;
  }

  shareToWhatsApp(video: YouTubeVideo): void {
    const shareUrl = this.getShareUrl(video);
    this.openWindow(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`);
  }

  shareToFacebook(video: YouTubeVideo): void {
    const shareUrl = this.getShareUrl(video);
    this.openWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    );
  }

  shareToTwitter(video: YouTubeVideo): void {
    const shareUrl = this.getShareUrl(video);
    const text = video.title;
    this.openWindow(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    );
  }

  async copyShareLink(video: YouTubeVideo): Promise<boolean> {
    const shareUrl = this.getShareUrl(video);

    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      const textarea = this.document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      this.document.body.appendChild(textarea);
      textarea.select();

      try {
        this.document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        this.document.body.removeChild(textarea);
      }
    }
  }

  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }

  private openWindow(url: string): void {
    this.document.defaultView?.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  }
}
