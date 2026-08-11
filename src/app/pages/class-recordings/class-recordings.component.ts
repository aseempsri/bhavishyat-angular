import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { AdBannerComponent } from '../../components/ad-banner/ad-banner.component';
import { YoutubeService, YouTubeVideo } from '../../services/youtube.service';
import { VideoShareService } from '../../services/video-share.service';

@Component({
  selector: 'app-class-recordings',
  imports: [CommonModule, RouterModule, HeaderComponent, AdBannerComponent],
  templateUrl: './class-recordings.component.html',
  styleUrl: './class-recordings.component.css'
})
export class ClassRecordingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private youtubeService = inject(YoutubeService);
  private videoShareService = inject(VideoShareService);

  videos: YouTubeVideo[] = [];
  videoRows: YouTubeVideo[][] = [];
  loading = true;
  loadError = false;
  activeShareMenuId: string | null = null;
  copiedShareId: string | null = null;

  private querySub?: Subscription;
  private pendingRedirectVideoId: string | null = null;
  private readonly columnsPerRow = 3;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scrollToTop();
      });
  }

  ngOnInit(): void {
    this.scrollToTop();
    this.loadVideos();

    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const videoId = params.get('v');
      this.pendingRedirectVideoId = videoId;
      this.tryRedirectToVideo();
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  @HostListener('document:click')
  closeShareMenu(): void {
    this.activeShareMenuId = null;
  }

  loadVideos(): void {
    this.loading = true;
    this.loadError = false;

    this.youtubeService.getChannelVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.videoRows = this.chunkVideos(videos, this.columnsPerRow);
        this.loading = false;
        this.loadError = videos.length === 0;
        this.tryRedirectToVideo();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  /** Ad 4 after row 1, Ad 5 after row 2 */
  adKeyAfterRow(rowIndex: number): 'ad4' | 'ad5' | null {
    if (rowIndex === 0) return 'ad4';
    if (rowIndex === 1) return 'ad5';
    return null;
  }

  openVideo(videoUrl: string): void {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  }

  toggleShareMenu(event: Event, videoId: string): void {
    event.stopPropagation();
    this.activeShareMenuId = this.activeShareMenuId === videoId ? null : videoId;
    this.copiedShareId = null;
  }

  shareToWhatsApp(event: Event, video: YouTubeVideo): void {
    event.stopPropagation();
    this.videoShareService.shareToWhatsApp(video);
    this.activeShareMenuId = null;
  }

  shareToFacebook(event: Event, video: YouTubeVideo): void {
    event.stopPropagation();
    this.videoShareService.shareToFacebook(video);
    this.activeShareMenuId = null;
  }

  shareToTwitter(event: Event, video: YouTubeVideo): void {
    event.stopPropagation();
    this.videoShareService.shareToTwitter(video);
    this.activeShareMenuId = null;
  }

  async copyShareLink(event: Event, video: YouTubeVideo): Promise<void> {
    event.stopPropagation();
    const copied = await this.videoShareService.copyShareLink(video);
    if (copied) {
      this.copiedShareId = video.id;
      setTimeout(() => {
        if (this.copiedShareId === video.id) {
          this.copiedShareId = null;
        }
      }, 2000);
    }
    this.activeShareMenuId = null;
  }

  private chunkVideos(videos: YouTubeVideo[], size: number): YouTubeVideo[][] {
    const rows: YouTubeVideo[][] = [];
    for (let i = 0; i < videos.length; i += size) {
      rows.push(videos.slice(i, i + size));
    }
    return rows;
  }

  private tryRedirectToVideo(): void {
    if (!this.pendingRedirectVideoId || this.loading) {
      return;
    }

    const video = this.videos.find((item) => item.id === this.pendingRedirectVideoId);
    if (!video) {
      return;
    }

    this.pendingRedirectVideoId = null;
    this.document.defaultView?.location.replace(video.videoUrl);
  }

  private scrollToTop(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
}
