/** Static ad creatives for BHAVISHYAT (Social Screen frame sizes). */
export const BHAVISHYAT_ADS = {
  ad1: {
    id: 'ad1',
    src: '/ads/ad-1.jpg',
    alt: 'Advertisement',
    linkUrl: null as string | null,
  },
  ad2: {
    id: 'ad2',
    src: '/ads/ad-2.jpg',
    alt: 'Advertisement',
    linkUrl: null as string | null,
  },
  ad3: {
    id: 'ad3',
    src: '/ads/ad-3.jpg',
    alt: 'Advertisement',
    linkUrl: null as string | null,
  },
  ad4: {
    id: 'ad4',
    src: '/ads/ad-4.jpg',
    alt: 'Advertisement',
    linkUrl: null as string | null,
  },
  ad5: {
    id: 'ad5',
    src: '/ads/ad-5.jpg',
    alt: 'Advertisement',
    linkUrl: null as string | null,
  },
} as const;

export type BhavishyatAdKey = keyof typeof BHAVISHYAT_ADS;
