// How hard to push the graphics on this device.
//   low    the plain, direct render: no glow, no fire shadows
//   med    adds the glow and film finish and the fire's shadows (phones and tablets by default)
//   high   adds ambient occlusion, bigger shadow maps, denser fur (computers by default)
//   ultra  everything turned up: the largest shadow maps and probe, the densest fur and hair,
//          finer stones, more occlusion samples, the screen's full pixel density
// Settings ▸ Graphics stores a choice; ?q=low|med|high|ultra in the address overrides it.
const KEY = 'frisky.gfx', TIERS = ['low', 'med', 'high', 'ultra'];
function mobile() {
  try { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || '')); } catch (e) { return false; }
}
function pick() {
  try { const m = /[?&]q=(low|med|high|ultra)\b/.exec(location.search); if (m) return m[1]; } catch (e) { /* no location */ }
  try { const s = localStorage.getItem(KEY); if (TIERS.includes(s)) return s; } catch (e) { /* storage blocked */ }
  return mobile() ? 'low' : 'med';
}
const tier = pick(), by = (o) => o[tier];
export const Q = {
  tier,
  auto: mobile() ? 'low' : 'med',                           // what Auto means on this device
  rank: TIERS.indexOf(tier),                                 // 0..3, for "at least" tests
  post: tier !== 'low',                                      // bloom, vignette, grain, multisampled colour buffer
  ao: tier === 'high' || tier === 'ultra',                   // ground-truth ambient occlusion
  aoSamples: by({ low: 0, med: 0, high: 12, ultra: 24 }),
  shadow: by({ low: 512, med: 1024, high: 2048, ultra: 4096 }),          // the room's big lights
  candleShadow: by({ low: 512, med: 512, high: 1024, ultra: 2048 }),
  fireShadow: tier !== 'low',
  shells: by({ low: 16, med: 20, high: 28, ultra: 40 }),                 // fur shells on the hamster
  fur: by({ low: 0.8, med: 1.7, high: 2.8, ultra: 4.6 }),                // guard hairs per mm² of hamster
  beard: by({ low: 1600, med: 2600, high: 3800, ultra: 7000 }),          // strands in the old man's beard
  stone: by({ low: [10, 7], med: [14, 10], high: [16, 11], ultra: [24, 16] }),   // facets per fieldstone
  sculpt: by({ low: [56, 40], med: [80, 56], high: [96, 68], ultra: [144, 100] }), // the old man's face
  probe: by({ low: 64, med: 128, high: 256, ultra: 512 }),               // the room's reflection probe (cube face)
  maxPixelRatio: by({ low: 2, med: 2, high: 2, ultra: 3 }),
  msaa: by({ low: 0, med: 4, high: 4, ultra: 8 }),
};
export function storedTier() { try { const s = localStorage.getItem(KEY); return TIERS.includes(s) ? s : 'auto'; } catch (e) { return 'auto'; } }
export function storeTier(v) { try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }
