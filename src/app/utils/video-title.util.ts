const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'its', 'is'
]);

const TITLE_OVERRIDES: Record<string, string> = {
  YRip9YUV10I: 'Seek Answers From the World',
  czzkh7LjcuI: 'Do Gemstones Really Work? The Truth Explained'
};

function titleCaseSegment(segment: string): string {
  const words = segment.split(/(\s+)/);

  return words
    .map((part, index) => {
      if (/^\s+$/.test(part)) {
        return part;
      }

      const isFirstWord = !words.slice(0, index).some((item) => /\S/.test(item));
      const alpha = part.replace(/[^a-zA-Z]/g, '').toLowerCase();

      if (!isFirstWord && MINOR_WORDS.has(alpha)) {
        return part.toLowerCase();
      }

      const firstAlphaIndex = part.search(/[a-zA-Z]/);
      if (firstAlphaIndex === -1) {
        return part;
      }

      return (
        part.slice(0, firstAlphaIndex) +
        part.charAt(firstAlphaIndex).toUpperCase() +
        part.slice(firstAlphaIndex + 1).toLowerCase()
      );
    })
    .join('');
}

function toTitleCase(title: string): string {
  return title
    .split(' | ')
    .map((segment) => titleCaseSegment(segment.trim()))
    .join(' | ');
}

export function normalizeVideoTitle(title: string, videoId?: string): string {
  if (videoId && TITLE_OVERRIDES[videoId]) {
    return TITLE_OVERRIDES[videoId];
  }

  let normalized = title
    .replace(/\s*@\s*Bhavishyatastro\s*/gi, ' ')
    .replace(/\s*@\s*Bhavishyat\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  normalized = normalized.replace(/Dwisvabhav/gi, 'Dwiswabhav');
  normalized = normalized.replace(/Honest Truth/gi, 'Truth');
  normalized = normalized.replace(/\(PART\s*(\d+)\)/gi, '(Part $1)');
  normalized = normalized.replace(/\(part\s*(\d+)\)/gi, '(Part $1)');
  normalized = normalized.replace(/part-ii/gi, 'Part-II');
  normalized = normalized.replace(/part-i(?!\w)/gi, 'Part-I');
  normalized = normalized.replace(/([a-z])(\()/gi, '$1 $2');

  if (/^before you seek answers in the world/i.test(normalized)) {
    return 'Seek Answers From the World';
  }

  return toTitleCase(normalized);
}
