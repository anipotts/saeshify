// 16 visually distinct rhyme family colors — designed for dark backgrounds.
// Ordered by perceptual distinctness to maximize contrast between adjacent families.
const RHYME_PALETTE = [
  '#FF5733', // red-orange
  '#33B5FF', // sky blue
  '#FFC300', // gold
  '#9B59B6', // purple
  '#2ECC71', // emerald
  '#FF69B4', // hot pink
  '#00BCD4', // cyan
  '#FF8C00', // dark orange
  '#7B68EE', // medium slate blue
  '#32CD32', // lime green
  '#E91E63', // pink
  '#00E5FF', // light cyan
  '#FFD700', // bright gold
  '#BA68C8', // light purple
  '#76FF03', // light green
  '#FF4081', // accent pink
] as const;

/**
 * Assign a color from the palette to a rhyme family index.
 * Wraps around if there are more families than colors.
 */
export function getRhymeColor(familyIndex: number): string {
  return RHYME_PALETTE[familyIndex % RHYME_PALETTE.length];
}

export { RHYME_PALETTE };
