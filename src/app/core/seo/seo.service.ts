import { Injectable, inject, RendererFactory2, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { YoutubeService } from '../../services/youtube.service';
import {
  DEFAULT_LOGO,
  DEFAULT_OG_IMAGE,
  DEFAULT_ROBOTS,
  DEFAULT_SEO,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  PageSeo,
  SITE_NAME,
  SITE_ORIGIN,
  TWITTER_SITE,
  seoForUrl
} from './seo.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);
  private readonly youtube = inject(YoutubeService);

  applyForUrl(url: string): void {
    const seo = seoForUrl(url);
    this.apply(seo);
    this.setStructuredData(seo);

    if (seo.path === '/class-recordings') {
      this.setClassRecordingsVideoList();
    } else {
      this.removeJsonLd('seo-jsonld-videolist');
    }
  }

  apply(seo: PageSeo): void {
    const absoluteUrl = this.absoluteUrl(seo.path);
    const image = seo.ogImage || DEFAULT_OG_IMAGE;
    const robots = seo.robots || DEFAULT_ROBOTS;
    const ogType = seo.ogType || 'website';

    this.title.setTitle(seo.title);

    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ name: 'googlebot', content: robots });
    this.meta.updateTag({ name: 'author', content: SITE_NAME });
    this.meta.updateTag({ name: 'application-name', content: SITE_NAME });
    this.meta.updateTag({ name: 'theme-color', content: '#1a120b' });

    if (seo.keywords) {
      this.meta.updateTag({ name: 'keywords', content: seo.keywords });
    }

    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: absoluteUrl });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: `${SITE_NAME} — Vedic astrology` });
    this.meta.updateTag({ property: 'og:image:width', content: String(OG_IMAGE_WIDTH) });
    this.meta.updateTag({ property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/png' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: TWITTER_SITE });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: `${SITE_NAME} — Vedic astrology` });

    this.setCanonical(absoluteUrl);
    this.setHreflang(absoluteUrl);
  }

  private setStructuredData(seo: PageSeo): void {
    const absoluteUrl = this.absoluteUrl(seo.path);
    const image = seo.ogImage || DEFAULT_OG_IMAGE;
    const schemaType = seo.schemaType || 'WebPage';

    const webpage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${absoluteUrl}#webpage`,
      url: absoluteUrl,
      name: seo.title,
      description: seo.description,
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: 'en-IN',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: image,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT
      }
    };

    this.upsertJsonLd('seo-jsonld-webpage', webpage);
    this.upsertJsonLd('seo-jsonld-entity', this.buildEntitySchema(seo, absoluteUrl, image, schemaType));

    if (seo.path !== '/' && !seo.robots?.includes('noindex')) {
      this.upsertJsonLd('seo-jsonld-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_ORIGIN
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: seo.title.split('|')[0].trim(),
            item: absoluteUrl
          }
        ]
      });
    } else {
      this.removeJsonLd('seo-jsonld-breadcrumb');
    }
  }

  private buildEntitySchema(
    seo: PageSeo,
    absoluteUrl: string,
    image: string,
    schemaType: string
  ): Record<string, unknown> {
    const base = {
      '@context': 'https://schema.org',
      '@id': `${absoluteUrl}#entity`,
      name: seo.title.split('|')[0].trim(),
      description: seo.description,
      url: absoluteUrl,
      image,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: 'en-IN'
    };

    switch (schemaType) {
      case 'Course':
        return {
          ...base,
          '@type': 'Course',
          educationalLevel: 'Beginner to Intermediate',
          teaches: 'Vedic astrology',
          isAccessibleForFree: true,
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT1H'
          }
        };
      case 'Service':
        return {
          ...base,
          '@type': 'Service',
          serviceType: 'Vedic astrology kundali analysis',
          areaServed: 'IN',
          brand: { '@id': `${SITE_ORIGIN}/#organization` }
        };
      case 'Article':
        return {
          ...base,
          '@type': 'Article',
          headline: seo.title.split('|')[0].trim(),
          author: { '@id': `${SITE_ORIGIN}/#organization` },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: {
              '@type': 'ImageObject',
              url: DEFAULT_LOGO
            }
          },
          mainEntityOfPage: absoluteUrl
        };
      case 'EventSeries':
        return {
          ...base,
          '@type': 'EventSeries',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          organizer: { '@id': `${SITE_ORIGIN}/#organization` }
        };
      default:
        return {
          ...base,
          '@type': 'WebPage',
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` }
        };
    }
  }

  private setClassRecordingsVideoList(): void {
    this.youtube.getChannelVideos().subscribe((videos) => {
      if (!videos.length) {
        this.removeJsonLd('seo-jsonld-videolist');
        return;
      }

      const items = videos.slice(0, 30).map((video, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'VideoObject',
          name: video.title,
          description: `${video.title} — a Vedic astrology class from BHAVISHYAT Gurukul.`,
          thumbnailUrl: video.thumbnailUrl,
          uploadDate: video.publishedAt || undefined,
          contentUrl: video.videoUrl,
          embedUrl: `https://www.youtube.com/embed/${video.id}`,
          url: `${SITE_ORIGIN}/class-recordings?v=${video.id}`,
          publisher: { '@id': `${SITE_ORIGIN}/#organization` }
        }
      }));

      this.upsertJsonLd('seo-jsonld-videolist', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'BHAVISHYAT Gurukul Class Recordings',
        description: DEFAULT_SEO.description,
        numberOfItems: items.length,
        itemListElement: items
      });
    });
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(this.document.head, link);
    }
    this.renderer.setAttribute(link, 'href', url);
  }

  private setHreflang(url: string): void {
    this.upsertLink('alternate', 'en-IN', url);
    this.upsertLink('alternate', 'x-default', url);
  }

  private upsertLink(rel: string, hreflang: string, href: string): void {
    let link = this.document.querySelector(
      `link[rel="${rel}"][hreflang="${hreflang}"]`
    ) as HTMLLinkElement | null;

    if (!link) {
      link = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(link, 'rel', rel);
      this.renderer.setAttribute(link, 'hreflang', hreflang);
      this.renderer.appendChild(this.document.head, link);
    }

    this.renderer.setAttribute(link, 'href', href);
  }

  private absoluteUrl(path: string): string {
    return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private upsertJsonLd(id: string, data: unknown): void {
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.renderer.createElement('script') as HTMLScriptElement;
      this.renderer.setAttribute(script, 'id', id);
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.appendChild(this.document.head, script);
    }
    script.textContent = JSON.stringify(data);
  }

  private removeJsonLd(id: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.getElementById(id)?.remove();
  }
}
