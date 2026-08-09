import { Injectable, inject, RendererFactory2, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_SEO,
  PageSeo,
  SITE_NAME,
  SITE_ORIGIN,
  seoForUrl
} from './seo.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);

  applyForUrl(url: string): void {
    const seo = seoForUrl(url);
    this.apply(seo);
    this.setWebPageJsonLd(seo);
  }

  apply(seo: PageSeo): void {
    const absoluteUrl = `${SITE_ORIGIN}${seo.path.startsWith('/') ? seo.path : `/${seo.path}`}`;
    const image = seo.ogImage || DEFAULT_OG_IMAGE;
    const robots = seo.robots || DEFAULT_SEO.robots!;
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
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: `${SITE_NAME} — Vedic astrology` });

    this.setCanonical(absoluteUrl);
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

  private setWebPageJsonLd(seo: PageSeo): void {
    const absoluteUrl = `${SITE_ORIGIN}${seo.path.startsWith('/') ? seo.path : `/${seo.path}`}`;
    const data = {
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
        url: seo.ogImage || DEFAULT_OG_IMAGE
      }
    };

    this.upsertJsonLd('seo-jsonld-webpage', data);

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
    } else if (isPlatformBrowser(this.platformId)) {
      this.document.getElementById('seo-jsonld-breadcrumb')?.remove();
    }
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
}
