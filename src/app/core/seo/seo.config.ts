import seoData from './seo-data.json';

export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  /** Path under site origin, e.g. /kundali — used for canonical & og:url */
  path: string;
  ogImage?: string;
  robots?: string;
  ogType?: string;
  schemaType?: string;
  bodyHeadline?: string;
  bodySummary?: string;
  bodyPoints?: string[];
  changefreq?: string;
  priority?: string;
}

export const SITE_ORIGIN = seoData.siteOrigin;
export const SITE_NAME = seoData.siteName;
export const DEFAULT_OG_IMAGE = seoData.defaultOgImage;
export const DEFAULT_LOGO = seoData.defaultLogo;
export const DEFAULT_ROBOTS = seoData.defaultRobots;
export const OG_IMAGE_WIDTH = seoData.ogImageWidth;
export const OG_IMAGE_HEIGHT = seoData.ogImageHeight;
export const TWITTER_SITE = seoData.twitterSite;

export const DEFAULT_SEO: PageSeo = seoData.defaultSeo as PageSeo;

/** Route path (Angular path string) → SEO. Empty string = home. */
export const ROUTE_SEO: Record<string, PageSeo> = seoData.routes as Record<string, PageSeo>;

export function seoForUrl(url: string): PageSeo {
  const pathOnly = url.split('?')[0].split('#')[0].replace(/^\//, '').replace(/\/$/, '');
  const key = pathOnly === '' ? '' : pathOnly;
  return ROUTE_SEO[key] ?? { ...ROUTE_SEO['**'], path: `/${pathOnly}` };
}
