import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthorSignatureComponent } from '../../components/author-signature/author-signature.component';
import { SeoService } from '../../core/seo/seo.service';
import { DEFAULT_OG_IMAGE, DEFAULT_ROBOTS } from '../../core/seo/seo.config';
import { BlogPost, BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-blog-post',
  imports: [CommonModule, RouterModule, HeaderComponent, AuthorSignatureComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css'
})
export class BlogPostComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  post: BlogPost | null = null;
  loading = true;
  error = '';
  copied = false;
  shareOpen = false;
  shareUrl = '';
  showToTop = false;

  ngOnInit(): void {
    this.updateToTopVisibility();
    this.route.paramMap.pipe(
      switchMap((params) => this.blog.get(params.get('slug') || '')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
        this.error = '';
        this.copied = false;
        this.shareOpen = false;
        this.showToTop = false;
        this.shareUrl = `${window.location.origin}/share/blog/${encodeURIComponent(post.slug)}`;
        this.seo.apply({
          path: `/blog/${post.slug}`,
          title: `${post.headline} | BHAVISHYAT`,
          description: post.excerpt || post.headline,
          ogImage: DEFAULT_OG_IMAGE,
          ogType: 'article',
          schemaType: 'Article',
          robots: DEFAULT_ROBOTS
        });
      },
      error: (err) => {
        this.loading = false;
        this.post = null;
        this.error = err?.status === 404
          ? 'This article is not available.'
          : 'The blog is unavailable right now. Start the local API with npm run start:api and make sure MongoDB is running.';
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateToTopVisibility();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateToTopVisibility();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateToTopVisibility(): void {
    this.showToTop = window.scrollY >= window.innerHeight;
  }

  shareFacebook(): void {
    this.openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`);
  }

  shareWhatsApp(): void {
    const text = encodeURIComponent(`${this.post?.headline || 'BHAVISHYAT'} ${this.shareUrl}`);
    this.openShare(`https://wa.me/?text=${text}`);
  }

  shareX(): void {
    const text = encodeURIComponent(this.post?.headline || 'BHAVISHYAT');
    this.openShare(`https://x.com/intent/post?url=${encodeURIComponent(this.shareUrl)}&text=${text}`);
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.copied = true;
      return;
    } catch {
      const area = document.createElement('textarea');
      area.value = this.shareUrl;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      this.copied = document.execCommand('copy');
      area.remove();
    }
  }

  private openShare(url: string): void {
    const popup = window.open(url, '_blank', 'noopener,noreferrer,width=640,height=560');
    if (popup) popup.opener = null;
  }
}
