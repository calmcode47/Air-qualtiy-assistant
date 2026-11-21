/**
 * Automated WCAG 2.1 Contrast Ratio Verification Script
 * Computes exact relative luminance and contrast ratio for the text and background pairs cataloged below.
 * Exits with status 1 if any normal-text pair is below 4.5:1 or large-text pair is below 3.0:1.
 */

function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Full palette pairing catalog
export const PALETTE_PAIRS = [
  { text: '#18261F', bg: '#FAF7F2', textName: 'Deep Forest Green', bgName: 'Paper Stage', type: 'normal', usage: 'Primary body & headings' },
  { text: '#18261F', bg: '#FFFFFF', textName: 'Deep Forest Green', bgName: 'Porcelain Card', type: 'normal', usage: 'Primary card text' },
  { text: '#1A2922', bg: '#FAF7F2', textName: 'Deep Charcoal Green', bgName: 'Paper Stage', type: 'normal', usage: 'Dark primary headings' },
  { text: '#1A2922', bg: '#FFFFFF', textName: 'Deep Charcoal Green', bgName: 'Porcelain Card', type: 'normal', usage: 'Dark card headings' },
  { text: '#56685F', bg: '#FAF7F2', textName: 'Slate Sage', bgName: 'Paper Stage', type: 'normal', usage: 'Muted secondary text' },
  { text: '#56685F', bg: '#FFFFFF', textName: 'Slate Sage', bgName: 'Porcelain Card', type: 'normal', usage: 'Muted card text' },
  { text: '#53645C', bg: '#FAF7F2', textName: 'Medium Slate Sage', bgName: 'Paper Stage', type: 'normal', usage: 'Subdued telemetry labels' },
  { text: '#53645C', bg: '#FFFFFF', textName: 'Medium Slate Sage', bgName: 'Porcelain Card', type: 'normal', usage: 'Subdued card labels' },
  { text: '#3D6B56', bg: '#FAF7F2', textName: 'Pine Foliage', bgName: 'Paper Stage', type: 'normal', usage: 'Forecast-period and cleaner-air text' },
  { text: '#3D6B56', bg: '#EAF2ED', textName: 'Pine Foliage', bgName: 'Pine Tint', type: 'normal', usage: 'Forecast-period badge' },
  { text: '#3D6B56', bg: '#FFFFFF', textName: 'Pine Foliage', bgName: 'Porcelain Card', type: 'normal', usage: 'Forecast-period card badge' },
  { text: '#8C5311', bg: '#FAF7F2', textName: 'Warm Amber Text', bgName: 'Paper Stage', type: 'normal', usage: 'Moderate status callouts' },
  { text: '#8C5311', bg: '#FBF5EC', textName: 'Warm Amber Text', bgName: 'Amber Tint', type: 'normal', usage: 'Moderate status badge' },
  { text: '#8C5311', bg: '#FFFFFF', textName: 'Warm Amber Text', bgName: 'Porcelain Card', type: 'normal', usage: 'Moderate status card badge' },
  { text: '#A94A28', bg: '#FAF7F2', textName: 'Darkened Terracotta', bgName: 'Paper Stage', type: 'normal', usage: 'High-smog alert text' },
  { text: '#A94A28', bg: '#FAF0EC', textName: 'Darkened Terracotta', bgName: 'Terracotta Tint', type: 'normal', usage: 'High-smog alert badge' },
  { text: '#A94A28', bg: '#FFFFFF', textName: 'Darkened Terracotta', bgName: 'Porcelain Card', type: 'normal', usage: 'High-smog card badge' },
  { text: '#7A2E3A', bg: '#FAF7F2', textName: 'Severe Burgundy', bgName: 'Paper Stage', type: 'normal', usage: 'Severe AQI text' },
  { text: '#7A2E3A', bg: '#FFFFFF', textName: 'Severe Burgundy', bgName: 'Porcelain Card', type: 'normal', usage: 'Severe AQI card text' },
  { text: '#B5473A', bg: '#FAF7F2', textName: 'Very Poor Clay', bgName: 'Paper Stage', type: 'normal', usage: 'Very Poor AQI text' },
  { text: '#B5473A', bg: '#FFFFFF', textName: 'Very Poor Clay', bgName: 'Porcelain Card', type: 'normal', usage: 'Very Poor AQI card text' },
  { text: '#FAF7F2', bg: '#18261F', textName: 'Paper Light', bgName: 'Deep Forest Green', type: 'normal', usage: 'Buttons & dark pills' },
  { text: '#FAF7F2', bg: '#1A2922', textName: 'Paper Light', bgName: 'Charcoal Green', type: 'normal', usage: 'Dark buttons' },
  { text: '#FFFFFF', bg: '#3D6B56', textName: 'White', bgName: 'Pine Foliage', type: 'normal', usage: 'Pine action buttons' },
  { text: '#F4F2EC', bg: '#18261F', textName: 'Light Paper', bgName: 'Dark Stage', type: 'normal', usage: 'Navbar & footer text' },
  { text: '#F3C474', bg: '#18261F', textName: 'Warm Ochre Light', bgName: 'Dark Stage', type: 'normal', usage: 'Navbar banner highlight' },
  { text: '#F3C474', bg: '#0A0C10', textName: 'Warm Ochre Light', bgName: 'Diagram Background', type: 'normal', usage: 'Diagram AQI label' },
  { text: '#A6BCB0', bg: '#0A0C10', textName: 'Muted Sage', bgName: 'Diagram Background', type: 'normal', usage: 'Diagram annotations' }
];

export function runContrastCheck() {
  let hasFailure = false;
  const results = [];

  for (const pair of PALETTE_PAIRS) {
    const ratio = getContrastRatio(pair.text, pair.bg);
    const minRequired = pair.type === 'large' ? 3.0 : 4.5;
    const passes = ratio >= minRequired;

    if (!passes) {
      hasFailure = true;
    }

    results.push({
      ...pair,
      ratio: Number(ratio.toFixed(2)),
      passes,
      minRequired
    });
  }

  return { hasFailure, results };
}

// If executed directly from CLI
if (process.argv[1]?.endsWith('contrast-check.mjs')) {
  console.log('Running Aura WCAG 2.1 Contrast Ratio Verification...\n');
  const { hasFailure, results } = runContrastCheck();

  console.log('| Text | BG | Names | Ratio | Min Req | Status | Usage |');
  console.log('|---|---|---|---|---|---|---|');
  for (const r of results) {
    const status = r.passes ? 'PASS (AA)' : 'FAIL';
    console.log(
      `| \`${r.text}\` | \`${r.bg}\` | ${r.textName} on ${r.bgName} | ${r.ratio}:1 | ${r.minRequired}:1 | ${status} | ${r.usage} |`
    );
  }

  if (hasFailure) {
    console.error('\nContrast check FAILED: One or more color pairs failed WCAG 2.1 AA requirements.');
    process.exit(1);
  } else {
    console.log(`\nAll ${results.length} color pairs passed WCAG 2.1 AA contrast requirements!`);
    process.exit(0);
  }
}
