// How hard to push the graphics on this device. 'low' is the plain, direct render (phones by default);
// 'med' adds the glow and film finish; 'high' adds ambient occlusion and the biggest shadow maps.
// Settings ▸ Graphics stores a choice; ?q=low|med|high in the address overrides it.
const KEY = 'frisky.gfx';
function pick() {
  try { const m = /[?&]q=(low|med|high)\b/.exec(location.search); if (m) return m[1]; } catch (e) { /* no location */ }
  try { const s = localStorage.getItem(KEY); if (s === 'low' || s === 'med' || s === 'high') return s; } catch (e) { /* storage blocked */ }
  let mobile = false;
  try { mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || '')); } catch (e) { /* no navigator */ }
  return mobile ? 'low' : 'high';
}
const tier = pick();
export const Q = {
  tier,
  post: tier !== 'low',            // bloom, vignette, grain, multisampled colour buffer
  ao: tier === 'high',             // ground-truth ambient occlusion
  shadow: { low: 512, med: 1024, high: 2048 }[tier],        // the room's big lights
  candleShadow: { low: 512, med: 512, high: 1024 }[tier],
  fireShadow: tier !== 'low',
  shells: { low: 16, med: 20, high: 28 }[tier],             // fur shells on the hamster
  probe: { low: 64, med: 128, high: 256 }[tier],            // the room's reflection probe (cube face)
  maxPixelRatio: { low: 2, med: 2, high: 2 }[tier],
};
export function storedTier() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
export function storeTier(v) { try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }
