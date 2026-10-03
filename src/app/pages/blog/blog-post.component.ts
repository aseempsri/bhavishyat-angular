import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthorSignatureComponent } from '../../components/author-signature/author-signature.component';
import { SeoService } from '../../core/seo/seo.service';
import { DEFAULT_OG_IMAGE, DEFAULT_ROBOTS } from '../../core/seo/seo.config';
import {
  CONTACT_EMAIL,
  mailtoUrl,
  openWhatsApp,
  WHATSAPP_CONSULTATION_MESSAGE,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER
} from '../../core/contact/contact.config';
import { BlogPost, BlogService } from '../../services/blog.service';

type BodyPart = { type: 'text' | 'phone' | 'email'; value: string };

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
  bodyParts: BodyPart[] = [];
  loading = true;
  error = '';
  copied = false;
  shareOpen = false;
  shareUrl = '';
  showToTop = false;

  readonly whatsappDisplay = WHATSAPP_DISPLAY;
  readonly contactEmail = CONTACT_EMAIL;
  readonly mailtoHref = mailtoUrl();

  ngOnInit(): void {
    this.updateToTopVisibility();
    this.route.paramMap.pipe(
      switchMap((params) => this.blog.get(params.get('slug') || '')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (post) => {
        this.post = post;
        this.bodyParts = this.buildBodyParts(post.body || '');
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
        this.bodyParts = [];
        this.error = err?.status === 404
          ? 'This article is not available.'
          : 'The blog is unavailable right now. Start the local API with npm run start:api and make sure MongoDB is running.';
      }
    });
  }

  openPhoneCta(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    openWhatsApp(WHATSAPP_CONSULTATION_MESSAGE, 'connect-with-us');
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

  private buildBodyParts(rawBody: string): BodyPart[] {
    const body = this.stripTrailingContactBoilerplate(rawBody);
    if (!body) {
      return [];
    }

    const pattern =
      /(\+91[\s-]?(?:\d[\s-]?){10})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const parts: BodyPart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(body)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: body.slice(lastIndex, match.index) });
      }

      if (match[1]) {
        const digits = match[1].replace(/\D/g, '');
        const normalized =
          digits === WHATSAPP_NUMBER || digits === WHATSAPP_NUMBER.slice(2)
            ? WHATSAPP_DISPLAY
            : match[1].replace(/\s+/g, ' ').trim();
        parts.push({ type: 'phone', value: normalized });
      } else if (match[2]) {
        parts.push({ type: 'email', value: match[2] });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < body.length) {
      parts.push({ type: 'text', value: body.slice(lastIndex) });
    }

    return parts;
  }

  private stripTrailingContactBoilerplate(body: string): string {
    return body
      .replace(
        /(?:\n+\s*)?(?:To book a consultation[\s\S]*?(?:connect@bhavishyat\.in|\+91[\s\S]*?\d)[\s\S]*)$/i,
        ''
      )
      .trimEnd();
  }
}
