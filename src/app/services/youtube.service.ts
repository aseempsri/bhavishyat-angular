import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { normalizeVideoTitle } from '../utils/video-title.util';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
}

interface YouTubeVideosPayload {
  videos: YouTubeVideo[];
  fetchedAt?: string;
}

interface CachedVideos {
  fetchedAt: number;
  videos: YouTubeVideo[];
}

@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);

  private readonly CACHE_KEY = 'bhavishyat_youtube_videos_v4';
  private readonly CACHE_TTL_MS = 60 * 60 * 1000;

  getChannelVideos(): Observable<YouTubeVideo[]> {
    const cached = this.getValidCache();

    if (cached) {
      this.refreshVideosInBackground();
      return of(cached);
    }

    return this.fetchVideos();
  }

  private refreshVideosInBackground(): void {
    this.fetchVideos().subscribe({
      error: () => {
        // Keep showing cached videos when background refresh fails.
      }
    });
  }

  private fetchVideos(): Observable<YouTubeVideo[]> {
    return this.http
      .get<YouTubeVideosPayload>(`${this.getBaseHref()}youtube-videos.json`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      .pipe(
        map((payload) => (payload.videos ?? []).map((video) => ({
          ...video,
          title: normalizeVideoTitle(video.title, video.id)
        }))),
        tap((videos) => {
          if (videos.length > 0) {
            this.setCache(videos);
          }
        }),
        catchError(() => of([]))
      );
  }

  private getValidCache(): YouTubeVideo[] | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) {
        return null;
      }

      const cached = JSON.parse(raw) as CachedVideos;
      if (Date.now() - cached.fetchedAt > this.CACHE_TTL_MS) {
        return null;
      }

      return cached.videos;
    } catch {
      return null;
    }
  }

  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }

  private setCache(videos: YouTubeVideo[]): void {
    const payload: CachedVideos = {
      fetchedAt: Date.now(),
      videos
    };

    localStorage.setItem(this.CACHE_KEY, JSON.stringify(payload));
  }
}
