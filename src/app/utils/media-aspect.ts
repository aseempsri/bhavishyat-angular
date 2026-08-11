/** True when width >= height (landscape or square). */
export function isLandscapeMedia(width: number, height: number): boolean {
  return width > 0 && height > 0 && width >= height;
}
