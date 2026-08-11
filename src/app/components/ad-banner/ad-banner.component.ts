import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getHoverLandscapePreviewSize,
  getHoverPortraitPreviewSize,
  getPortraitFrameSize,
  LANDSCAPE_FRAME_ASPECT,
} from '../../utils/ad-frame-sizes';
import { isLandscapeMedia } from '../../utils/media-aspect';
import { BHAVISHYAT_ADS, BhavishyatAdKey } from '../../config/ads.config';

const PREVIEW_GAP_PX = 14;
const PREVIEW_ARROW_PX = 10;
const VIEWPORT_PAD_PX = 12;

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full min-w-0',
  },
  template: `
    <div class="w-full flex justify-center py-4 sm:py-6">
      <div
        class="rounded-lg overflow-hidden shadow-lg bg-[#1a1d24] flex flex-col border border-white/10"
        [ngClass]="shellClass"
        [ngStyle]="shellSizeStyle"
        (mouseenter)="onSlotMouseEnter($event)"
        (mouseleave)="onSlotMouseLeave()"
        (mousemove)="onSlotMouseMove($event)"
      >
        <a
          [href]="resolvedLink || 'javascript:void(0)'"
          [target]="resolvedLink ? '_blank' : '_self'"
          [rel]="resolvedLink ? 'noopener noreferrer' : ''"
          [class]="linkClass"
          [attr.aria-label]="resolvedAlt"
        >
          <div [class]="innerWrapClass">
            <div
              class="shrink-0 h-[15px] sm:h-[17px] flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                class="text-[13.5px] sm:text-[15px] leading-none text-gray-400/80 font-normal tracking-wide select-none"
              >
                Advertisement
              </span>
            </div>
            <div
              [class]="mediaFrameClass"
              [style.aspect-ratio]="mediaFrameAspectRatio"
              [ngStyle]="mediaFrameSizeStyle"
            >
              <img
                [src]="resolvedSrc"
                [alt]="resolvedAlt"
                [class]="mediaFitClass"
                (load)="onImageLoad($event)"
              />
            </div>
          </div>
        </a>
      </div>
    </div>

    @if (hoverPreviewOpen && hoverPreviewEnabled) {
      <div
        class="ad-hover-preview fixed z-[10000] pointer-events-none"
        [style.left.px]="hoverPreviewLeft"
        [style.top.px]="hoverPreviewTop"
        role="tooltip"
        [attr.aria-label]="resolvedAlt + ' preview'"
      >
        <div
          class="ad-hover-preview-panel rounded-lg overflow-hidden shadow-2xl border border-gray-600/90 bg-[#1a1d24] flex flex-col"
          [ngStyle]="hoverPreviewPanelStyle"
        >
          <div
            class="shrink-0 h-[17px] flex items-center justify-center bg-[#1a1d24]"
            aria-hidden="true"
          >
            <span
              class="text-[14px] leading-none text-gray-400/80 font-normal tracking-wide select-none"
            >
              Advertisement
            </span>
          </div>
          <div
            class="relative overflow-hidden bg-[#0b0e14]"
            [ngStyle]="hoverPreviewMediaStyle"
          >
            <img
              [src]="resolvedSrc"
              [alt]="resolvedAlt"
              class="absolute inset-0 w-full h-full object-contain object-center"
            />
          </div>
        </div>
        <div
          class="ad-hover-preview-arrow absolute w-0 h-0"
          [style.left.px]="hoverArrowLeft"
          [style.top.px]="hoverArrowTop"
          [class]="hoverArrowClass"
        ></div>
      </div>
    }
  `,
  styles: [
    `
      .ad-hover-preview-arrow {
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
      }
      .ad-hover-preview-arrow--below {
        border-top: 12px solid #1a1d24;
      }
      .ad-hover-preview-arrow--above {
        border-bottom: 12px solid #1a1d24;
      }
      .ad-hover-preview-arrow--right {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 12px solid #1a1d24;
      }
      .ad-hover-preview-arrow--left {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 12px solid #1a1d24;
      }
    `,
  ],
})
export class AdBannerComponent implements OnInit, OnChanges, OnDestroy {
  /** Named slot from ads.config, e.g. 'ad1' */
  @Input() adKey?: BhavishyatAdKey;
  /** Or pass a direct image path */
  @Input() src = '';
  @Input() alt = 'Advertisement';
  @Input() linkUrl: string | null = null;
  @Input() wrapperClass = '';

  isLandscape = false;
  orientationKnown = false;
  naturalWidth = 0;
  naturalHeight = 0;

  hoverPreviewOpen = false;
  hoverPreviewLeft = 0;
  hoverPreviewTop = 0;
  hoverArrowLeft = 0;
  hoverArrowTop = 0;
  hoverArrowPlacement: 'above' | 'below' | 'left' | 'right' = 'below';

  private cursorX = 0;
  private cursorY = 0;
  private dimensionProbeToken = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  get resolvedSrc(): string {
    if (this.adKey && BHAVISHYAT_ADS[this.adKey]) {
      return BHAVISHYAT_ADS[this.adKey].src;
    }
    return this.src;
  }

  get resolvedAlt(): string {
    if (this.adKey && BHAVISHYAT_ADS[this.adKey]) {
      return BHAVISHYAT_ADS[this.adKey].alt;
    }
    return this.alt;
  }

  get resolvedLink(): string | null {
    if (this.linkUrl) return this.linkUrl;
    if (this.adKey && BHAVISHYAT_ADS[this.adKey]) {
      return BHAVISHYAT_ADS[this.adKey].linkUrl;
    }
    return null;
  }

  get hoverPreviewEnabled(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  }

  private get hoverViewportLimits(): { maxWidth: number; maxHeight: number } {
    if (typeof window === 'undefined') {
      return { maxWidth: 1200, maxHeight: 800 };
    }
    return {
      maxWidth: window.innerWidth - VIEWPORT_PAD_PX * 2,
      maxHeight: window.innerHeight - VIEWPORT_PAD_PX * 2,
    };
  }

  private get hoverPreviewDimensions(): { widthPx: number; heightPx: number } {
    const { maxWidth, maxHeight } = this.hoverViewportLimits;
    const labelPx = 17;
    const mediaMaxHeight = maxHeight - labelPx;

    if (this.usePortraitStandardFrame) {
      return getHoverPortraitPreviewSize(
        this.naturalWidth,
        this.naturalHeight,
        maxWidth,
        mediaMaxHeight
      );
    }
    return getHoverLandscapePreviewSize(
      this.naturalWidth,
      this.naturalHeight,
      maxWidth,
      mediaMaxHeight
    );
  }

  get hoverPreviewPanelStyle(): Record<string, string> {
    const labelPx = 17;
    const { widthPx, heightPx } = this.hoverPreviewDimensions;
    return {
      width: `${widthPx}px`,
      height: `${heightPx + labelPx}px`,
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 24px)',
      display: 'flex',
      flexDirection: 'column',
    };
  }

  get hoverPreviewMediaStyle(): Record<string, string> {
    const { heightPx } = this.hoverPreviewDimensions;
    return {
      height: `${heightPx}px`,
      flex: '1 1 auto',
      minHeight: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  get hoverPreviewSize(): { width: number; height: number } {
    const label = 17;
    const { widthPx, heightPx } = this.hoverPreviewDimensions;
    return { width: widthPx, height: heightPx + label };
  }

  get hoverArrowClass(): string {
    const map = {
      above: 'ad-hover-preview-arrow--above',
      below: 'ad-hover-preview-arrow--below',
      left: 'ad-hover-preview-arrow--left',
      right: 'ad-hover-preview-arrow--right',
    };
    return map[this.hoverArrowPlacement];
  }

  ngOnInit(): void {
    this.probeMediaDimensions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adKey'] || changes['src']) {
      this.resetOrientation();
      this.probeMediaDimensions();
      this.hoverPreviewOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.hoverPreviewOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.hoverPreviewOpen) {
      this.updateHoverPreviewPosition();
    }
  }

  onSlotMouseEnter(event: MouseEvent): void {
    if (!this.hoverPreviewEnabled || !this.resolvedSrc) return;
    this.hoverPreviewOpen = true;
    this.onSlotMouseMove(event);
  }

  onSlotMouseLeave(): void {
    this.hoverPreviewOpen = false;
  }

  onSlotMouseMove(event: MouseEvent): void {
    if (!this.hoverPreviewOpen) return;
    this.cursorX = event.clientX;
    this.cursorY = event.clientY;
    this.updateHoverPreviewPosition();
  }

  private updateHoverPreviewPosition(): void {
    const { width: panelW, height: panelH } = this.hoverPreviewSize;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = this.cursorX - panelW / 2;
    let top = this.cursorY - panelH - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
    let placement: typeof this.hoverArrowPlacement = 'below';

    if (top < VIEWPORT_PAD_PX) {
      top = this.cursorY + PREVIEW_GAP_PX + PREVIEW_ARROW_PX;
      placement = 'above';
    }

    if (top + panelH > vh - VIEWPORT_PAD_PX) {
      const tryAbove = this.cursorY - panelH - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
      if (tryAbove >= VIEWPORT_PAD_PX) {
        top = tryAbove;
        placement = 'below';
      }
    }

    if (left < VIEWPORT_PAD_PX) {
      left = VIEWPORT_PAD_PX;
    } else if (left + panelW > vw - VIEWPORT_PAD_PX) {
      left = vw - VIEWPORT_PAD_PX - panelW;
    }

    if (left + panelW > vw - VIEWPORT_PAD_PX || left < VIEWPORT_PAD_PX) {
      const tryRight = this.cursorX + PREVIEW_GAP_PX + PREVIEW_ARROW_PX;
      const tryLeft = this.cursorX - panelW - PREVIEW_GAP_PX - PREVIEW_ARROW_PX;
      if (tryRight + panelW <= vw - VIEWPORT_PAD_PX) {
        left = tryRight;
        top = this.cursorY - panelH / 2;
        placement = 'left';
      } else if (tryLeft >= VIEWPORT_PAD_PX) {
        left = tryLeft;
        top = this.cursorY - panelH / 2;
        placement = 'right';
      }
    }

    top = Math.max(VIEWPORT_PAD_PX, Math.min(vh - VIEWPORT_PAD_PX - panelH, top));
    left = Math.max(VIEWPORT_PAD_PX, Math.min(vw - VIEWPORT_PAD_PX - panelW, left));

    this.hoverPreviewLeft = left;
    this.hoverPreviewTop = top;
    this.hoverArrowPlacement = placement;

    const arrowHalf = 10;
    switch (placement) {
      case 'below':
        this.hoverArrowLeft = this.cursorX - left - arrowHalf;
        this.hoverArrowTop = panelH;
        break;
      case 'above':
        this.hoverArrowLeft = this.cursorX - left - arrowHalf;
        this.hoverArrowTop = -PREVIEW_ARROW_PX;
        break;
      case 'left':
        this.hoverArrowLeft = panelW;
        this.hoverArrowTop = this.cursorY - top - arrowHalf;
        break;
      case 'right':
        this.hoverArrowLeft = -PREVIEW_ARROW_PX;
        this.hoverArrowTop = this.cursorY - top - arrowHalf;
        break;
    }

    this.hoverArrowLeft = Math.max(12, Math.min(panelW - 24, this.hoverArrowLeft));
    this.hoverArrowTop = Math.max(
      placement === 'above' ? -PREVIEW_ARROW_PX : 12,
      Math.min(panelH - 12, this.hoverArrowTop)
    );

    this.cdr.markForCheck();
  }

  get useLandscapeStandardFrame(): boolean {
    return !this.orientationKnown || this.isLandscape;
  }

  get usePortraitStandardFrame(): boolean {
    return this.orientationKnown && !this.isLandscape;
  }

  get portraitFrameSize() {
    return getPortraitFrameSize(this.naturalWidth, this.naturalHeight);
  }

  get shellClass(): string {
    let width = 'w-full';
    if (this.useLandscapeStandardFrame) {
      width = 'w-full max-w-[572px] mx-auto shrink-0';
    } else if (this.usePortraitStandardFrame) {
      width = 'mx-auto shrink-0';
    }
    const extra = this.wrapperClass.replace(/\bmax-w-\S+/g, '').trim();
    return `${width} ${extra}`.trim();
  }

  get linkClass(): string {
    const base = 'block cursor-pointer box-border p-0';
    return this.usePortraitStandardFrame ? base : `${base} w-full`;
  }

  get innerWrapClass(): string {
    return this.usePortraitStandardFrame
      ? 'flex flex-col'
      : 'flex flex-col w-[98%] min-h-0 min-w-0 mx-auto my-[1%]';
  }

  get shellSizeStyle(): Record<string, string> | null {
    if (!this.usePortraitStandardFrame) return null;
    const { widthPx } = this.portraitFrameSize;
    return {
      width: `${widthPx}px`,
      maxWidth: '100%',
    };
  }

  get mediaFrameAspectRatio(): string | null {
    if (this.usePortraitStandardFrame) return null;
    if (this.useLandscapeStandardFrame) return LANDSCAPE_FRAME_ASPECT;
    return null;
  }

  get mediaFrameSizeStyle(): Record<string, string> | null {
    if (!this.usePortraitStandardFrame) return null;
    const { widthPx, heightPx } = this.portraitFrameSize;
    return {
      width: `${widthPx}px`,
      height: `${heightPx}px`,
      maxWidth: '100%',
    };
  }

  get mediaFrameClass(): string {
    if (this.useLandscapeStandardFrame) {
      return 'relative w-full min-w-full aspect-[16/10] overflow-hidden rounded-sm bg-[#0b0e14] shrink-0 flex items-center justify-center';
    }
    if (this.usePortraitStandardFrame) {
      return 'relative overflow-hidden rounded-sm bg-[#0b0e14] shrink-0 flex items-center justify-center box-border';
    }
    return 'overflow-hidden rounded-sm bg-[#0b0e14] flex items-center justify-center w-full min-h-[80px]';
  }

  /** object-contain keeps the full creative visible — nothing is cropped */
  get mediaFitClass(): string {
    return 'max-w-full max-h-full w-auto h-auto object-contain object-center block';
  }

  private resetOrientation(): void {
    this.isLandscape = false;
    this.orientationKnown = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  private probeMediaDimensions(): void {
    const url = this.resolvedSrc;
    if (!url) return;

    const token = ++this.dimensionProbeToken;
    const img = new Image();
    img.onload = () => {
      if (token !== this.dimensionProbeToken) return;
      this.applyOrientation(img.naturalWidth, img.naturalHeight);
    };
    img.src = url;
  }

  private applyOrientation(width: number, height: number): void {
    const nextLandscape = isLandscapeMedia(width, height);
    const sizeChanged = this.naturalWidth !== width || this.naturalHeight !== height;
    if (this.orientationKnown && this.isLandscape === nextLandscape && !sizeChanged) return;
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.isLandscape = nextLandscape;
    this.orientationKnown = true;
    this.cdr.markForCheck();
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.applyOrientation(img.naturalWidth, img.naturalHeight);
  }
}
