// Drive train: brass cylinder, hand crank, mainspring barrel and the
// air-brake governor (endless screw + two-bladed fan).
import { AIR } from './constants.js';

const BRASS = 8530;

export function driveParams({ R, cylLen, Trev, comb, airBrake = 1 }) {
  // Cylinder: brass tube with end caps & arbor (+25%)
  const wall = Math.min(1.6e-3, 0.4 * R);
  const Ri = R - wall;
  const mCyl = BRASS * Math.PI * (R * R - Ri * Ri) * cylLen * 1.25;
  const Icyl = 0.5 * mCyl * (R * R + Ri * Ri);
  const omegaNom = (2 * Math.PI) / Trev;

  // ---- hand crank ----
  const G_crank = Math.max(8, Math.round(Trev * 1.15)); // crank turns per cylinder turn (~1.15 Hz cranking)
  const Ihandle = 2.6e-6 * (comb.R / 8e-3);               // knob + arm + crank gear
  const Icrank = Icyl * 1.1 + G_crank * G_crank * Ihandle;  // reflected to the cylinder
  const fHand = 14, zHand = 0.9;                            // finger/wrist compliance
  const kHand = Icrank * (2 * Math.PI * fHand) ** 2;
  const cHand = 2 * zHand * Math.sqrt(kHand * Icrank);
  const tauBearing = 1.2e-4 * (R / 8e-3);

  // ---- mainspring ----
  const turnsMax = comb.springTurns;
  const tauFull = comb.springTorque, tauEmpty = 0.38 * comb.springTorque; // set-up preload
  const playTime = 210;                                      // s of music per full wind (design target)
  const G_spring = Math.max(0.25, playTime / (Trev * turnsMax)); // cylinder turns per barrel turn
  const etaTrain = 0.82;
  const tauAt = (turns) => ((tauEmpty + (tauFull - tauEmpty) * (turns / turnsMax)) / G_spring) * etaTrain;

  // ---- governor ----
  const blades = 2;
  const scale = Math.sqrt(comb.R / 8e-3);
  const bladeA = 1.5e-4 * scale * scale, rCp = 8.5e-3 * scale, Cd = 1.17;
  const kAir = blades * 0.5 * AIR.rho * Cd * bladeA * rCp ** 3;   // tau_fan = kAir * w_fan^2
  const mBlade = 8500 * bladeA * 1.5e-4;
  const Ifan = blades * mBlade * (0.8 * rCp) ** 2 + 6e-9;
  const etaWorm = 0.7;                                            // back-driven worm efficiency
  const tauAvail = (tauAt(0.65 * turnsMax) - tauBearing) * 0.85;
  let G_fan = Math.cbrt((tauAvail * etaWorm) / (kAir * omegaNom * omegaNom));
  G_fan = Math.min(8000, Math.max(40, G_fan));
  const cGov = (G_fan ** 3 * kAir) / etaWorm;                     // tau_cyl = cGov * w_cyl^2
  const Ispring = Icyl * 1.1 + G_fan * G_fan * Ifan + 3e-6 / (G_spring * G_spring);

  return {
    Icyl, mCyl, omegaNom, G_crank, Icrank, kHand, cHand, tauBearing, viscous: 2e-5,
    turnsMax, tauFull, tauEmpty, G_spring, etaTrain, G_fan, cGov, Ispring, airBrake,
    blades, kAir, Ifan, bladeA, rCp,
    clickTeeth: 16, crankTeeth: 12,
    info: {
      fanRpmNominal: (G_fan * omegaNom * 60) / (2 * Math.PI),
      crankRpmNominal: (G_crank * omegaNom * 60) / (2 * Math.PI),
      inertiaRatio: (G_fan * G_fan * Ifan) / Icyl,
    },
  };
}
