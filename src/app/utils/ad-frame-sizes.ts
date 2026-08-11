import { isLandscapeMedia } from './media-aspect';

/** Fixed landscape ad frame (all slots): 572×358, 16:10 */
export const LANDSCAPE_FRAME_MAX_WIDTH_PX = 572;
export const LANDSCAPE_FRAME_ASPECT = '16 / 10';

/** Fixed portrait ad frame height; width from upload aspect ratio */
export const PORTRAIT_FRAME_HEIGHT_PX = 413;

export interface PortraitFrameSize {
  widthPx: number;
  heightPx: number;
}

/** Portrait frame dimensions used on every portrait upload site-wide */
export function getPortraitFrameSize(
  naturalWidth = 0,
  naturalHeight = 0
): PortraitFrameSize {
  const heightPx = PORTRAIT_FRAME_HEIGHT_PX;
  const widthPx =
    naturalWidth > 0 && naturalHeight > 0
      ? Math.round(heightPx * (naturalWidth / naturalHeight))
      : Math.round(heightPx * 0.75);
  return { widthPx, heightPx };
}

export function isPortraitMedia(width: number, height: number): boolean {
  return width > 0 && height > 0 && !isLandscapeMedia(width, height);
}

/** Hover floating preview scale vs in-page ad frame (30% above 1.4×) */
export const HOVER_PREVIEW_SCALE = 1.82;

const LANDSCAPE_HEIGHT_PX = Math.round(
  LANDSCAPE_FRAME_MAX_WIDTH_PX / (16 / 10)
);

/**
 * Hover preview size for landscape ads — matches in-page contain fit (16:10 cap),
 * scaled up, then clamped to viewport so nothing is cropped.
 */
export function getHoverLandscapePreviewSize(
  naturalWidth = 0,
  naturalHeight = 0,
  viewportMaxWidth?: number,
  viewportMaxHeight?: number
): PortraitFrameSize {
  const frameW = LANDSCAPE_FRAME_MAX_WIDTH_PX;
  const frameH = LANDSCAPE_HEIGHT_PX;
  const frameAspect = 16 / 10;

  let contentW = frameW;
  let contentH = frameH;

  if (naturalWidth > 0 && naturalHeight > 0) {
    const mediaAspect = naturalWidth / naturalHeight;
    if (mediaAspect >= frameAspect) {
      contentW = frameW;
      contentH = Math.round(frameW / mediaAspect);
    } else {
      contentH = frameH;
      contentW = Math.round(frameH * mediaAspect);
    }
  }

  let widthPx = Math.round(contentW * HOVER_PREVIEW_SCALE);
  let heightPx = Math.round(contentH * HOVER_PREVIEW_SCALE);

  const maxW = viewportMaxWidth ?? widthPx;
  const maxH = viewportMaxHeight ?? heightPx;

  if (widthPx > maxW) {
    const ratio = maxW / widthPx;
    widthPx = maxW;
    heightPx = Math.round(heightPx * ratio);
  }
  if (heightPx > maxH) {
    const ratio = maxH / heightPx;
    heightPx = maxH;
    widthPx = Math.round(widthPx * ratio);
  }

  return { widthPx, heightPx };
}

export function getHoverPortraitPreviewSize(
  naturalWidth = 0,
  naturalHeight = 0,
  viewportMaxWidth?: number,
  viewportMaxHeight?: number
): PortraitFrameSize {
  const base = getPortraitFrameSize(naturalWidth, naturalHeight);
  let widthPx = Math.round(base.widthPx * HOVER_PREVIEW_SCALE);
  let heightPx = Math.round(base.heightPx * HOVER_PREVIEW_SCALE);

  const maxW = viewportMaxWidth ?? widthPx;
  const maxH = viewportMaxHeight ?? heightPx;

  if (widthPx > maxW) {
    const ratio = maxW / widthPx;
    widthPx = maxW;
    heightPx = Math.round(heightPx * ratio);
  }
  if (heightPx > maxH) {
    const ratio = maxH / heightPx;
    heightPx = maxH;
    widthPx = Math.round(widthPx * ratio);
  }

  return { widthPx, heightPx };
}
