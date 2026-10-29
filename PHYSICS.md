# The physics inside Musicbox

Nothing in Musicbox is sampled and nothing is a "music box preset". Every sound is
integrated at 48 kHz from a chain of physical sub-models. This file explains each
link in that chain: the equations, the numbers, and the places where the numerics
had to be careful.

```
 finger circles ──► crank ─┐                          ┌─► tine root shear + moment
 key winding ──► mainspring├─► brass cylinder ──pins──► tine modes (FEM)        │
 air-brake fan ◄── worm ◄──┘   (inertia, ratchet)   ▲       │ direct dipole     ▼
                                       ▲  contact    │       │          bedplate (rigid, 3 DOF)
                                       └── torque ───┘       │                  │ 4 screws (implicit)
                                                             │                  ▼
                                                             │       soundboard plate modes ⇄ Helmholtz cavity
                                                             │                  │ box frame on feet (implicit)
                                                             │                  ▼
                                                             │             table plate modes
                                                             ▼                  ▼
                          monopole + 3 dipoles (box) · monopole (table underside)
                                                             ▼
             image sources (floor, table, walls, ceiling) · air absorption · Doppler
                                                             ▼
                  spherical head (ITD + Brown–Duda shadow) · FDN late reverb ──► ears
```

Code map: `js/physics/` builds the model (main thread / worker), `js/audio/musicbox-worklet.js`
integrates it in real time, `js/melody/` turns tunes into pin positions.

---

## 1. The tine: a tapered cantilever, solved by finite elements

A tine is an Euler–Bernoulli beam clamped at the comb root, free at the tip:

$$\frac{\partial^2}{\partial x^2}\!\left(EI(x)\,\frac{\partial^2 w}{\partial x^2}\right) + \rho A(x)\,\frac{\partial^2 w}{\partial t^2} = f(x,t)$$

Real tines are not uniform: they are ground thinner toward the tip, bass tines are
thinned near the root, and bass tines carry a soldered lead weight under the tip. So
instead of the textbook closed form, `beam.js` builds a 14-element Hermite-cubic FEM
(4×4 stiffness and consistent-mass matrices per element, with section properties at
each element's midpoint), adds the lead block as a point mass with rotary inertia and
offset, and solves the generalized eigenproblem $K\phi = \omega^2 M\phi$
(Cholesky reduction + cyclic Jacobi, `linalg.js`). Modes come out mass-normalised,
$\phi^T M \phi = 1$.

**Verification** (`tests/beam.test.mjs`) against the uniform analytic cantilever:

| | FEM | theory |
|---|---|---|
| f₁ error | 2×10⁻⁵ % | — |
| f₂/f₁ | 6.2669 | 6.2669 |
| f₃/f₁ | 17.549 | 17.547 |
| modal-mass fraction, mode 1 | 0.6131 | 0.6131 |

**Tuning.** For each target pitch, `tuneTine` iterates the free length using
$f\propto L^{-2}$ until the first mode is within 2 ppm. If the length would exceed the
comb's maximum, the length is capped and a lead tip mass is solved by log-space
bisection, as Swiss makers did. Lead pulls the fundamental down far more than the
overtones (a tip mass sits at the antinode of mode 1 and near a node of the
others), so a weighted G3 tine's second mode drops from 6.27× to about 3.5× the
fundamental. That is part of why music-box bass sounds rounder.

Combs with `grade > 0` thin the bass tines, $t \propto (f/f_{top})^{grade}$, which shortens them.

**Tine length slider.** Because $f \propto t/L^2$, scaling every tine's length by k at
constant pitch means scaling its thickness by k² (and the comb's maximum free length
by k, so the lead-weighted bass stays lead-weighted). The consequences are physical:
mass ∝ k³ and tip stiffness ∝ k³. Long tines store more energy per pluck (louder,
longer ring; ×1.6 is about 15 dB louder), and short ones are quiet with brief treble.
A maker fitting a heavier comb fits a stronger mainspring, so the spring torque scales
with k³ too; otherwise a long comb stalls the motor on chords.

**Inharmonicity is the sound.** The overtones at 6.27× and 17.5× are not harmonics.
That metallic shimmer is the music box.

## 2. Why a tine stops ringing: loss factors

Each mode gets a loss factor $\eta$ (with $Q = 1/\eta$ and $T_{60} = 6.91/(\pi f \eta)$) summed from:

* **Material damping** — hardened steel η ≈ 2.6×10⁻⁴, spring brass ≈ 1.3×10⁻³, and so
  on. This is the least certain number in the model, and the reason brass combs sound dull.
* **Thermoelastic (Zener).** Bending compresses one face and stretches the other.
  Heat flows across the thickness and dissipates energy:
  $\eta_{TED} = \Delta\,\dfrac{f/f_r}{1+(f/f_r)^2}$, with
  $\Delta = E\alpha^2T/(\rho c_p)$ and $f_r = \pi\kappa/(2t^2)$.
  For a 0.45 mm steel tine $f_r$ ≈ 94 Hz, so bass tines lose noticeably more. Aluminium
  (large α and κ) has a big TED term, so aluminium tines sound duller than their tiny
  material loss would suggest.
* **Air drag** (Hosaka): $c' = 3\pi\mu + \tfrac34\pi w\sqrt{2\rho_a\mu\omega}$ per unit length.
* **Acoustic radiation** of the tine's own dipole (§7).
* **Support loss** into the base: $\eta = \omega\Gamma^2\,\mathrm{Re}\,Y_{base}$, where the
  base mobility is the bedplate mass on the soundboard's drive-point impedance $8\sqrt{D\rho h}$.
  This term is tiny, which is why tines ring for seconds and why music boxes are quiet:
  very little power leaves the comb.
* **Lead joint** — a small extra loss proportional to the modal kinetic energy in the lead.

The Tines tab shows these as a stacked bar for every mode.

## 3. Modal time integration

In modal coordinates each mode is an independent oscillator
$\ddot q + 2\zeta\omega\dot q + \omega^2 q = \phi(x_c)\,F_c(t)$. It is advanced with
the **exact zero-order-hold discretisation** (the matrix exponential of the 2×2
system, precomputed as A₁₁…B₂), which is unconditionally stable and exact for
free ringing at any frequency below Nyquist. Modes above 0.42·fs are dropped. Only
modes the ear can hear are integrated: up to 4 per tine.

## 4. Pin meets tine: the pluck

### Geometry (`contactGeometry` in `model.js`)
Everything happens in the cylinder's cross-section. The pin-tip circle has radius
ρ = R + h (h ≈ 0.95 mm). Tine tips sit at 32° above horizontal, an
**engagement** e ≈ 0.35 mm inside that circle. The comb is **tilted** 25° away
from tangent. Defining u (from tip toward root) and n (the bending direction):

* a tangent comb (tilt 0°) lifts the tine by exactly e, but the pin slides under it for about 3 mm,
* a radial comb lifts it a great deal,
* at 25° the lift is ≈ 0.40 mm and the slide ≈ 1.1 mm (≈ 6.5° of cylinder rotation),
  which matches real movements.

The pin is modelled as a **rounded rectangle**: wire of diameter 0.42 mm, cut flat,
with a 35 µm edge radius. Two contact checks run:

* **A:** the tine-tip corner against the pin outline (a signed-distance function).
* **B:** the pin's two edge circles against the tine underside, using the *exact*
  deflected shape at the contact point.

### Why the edge radius matters
While the pin slides, the tine is quasi-static: the pin moves at a few mm/s and the
tine's period is under a millisecond. When the pin's trailing edge reaches the tip,
the corner rides down the rounded edge, still quasi-statically, so it loses r_edge
of lift. Then the support vanishes and the tine **snaps free from Δ − r_edge**.
A sharp, fresh pin plucks harder and brighter than a worn, rounded one. Try the
"Pin edge radius" slider.

### Numerics: a compliant constraint, not a spring
The pin and Hertz contact are about 10³× stiffer than the tine tip
(k_tip = 3EI/L³ ≈ 2.8 kN/m). An explicit penalty spring would need tiny time steps.
An implicit penalty spring that pushes penetration out via a velocity kick still
**injects energy** (velocity ≈ 2δ/dt), and short treble tines chatter themselves
into instability. So the contact is solved at velocity level as a
**compliant, perfectly inelastic constraint** (XPBD-style). Each substep chooses the
normal force so the penetration rate becomes −β·pen/dt:

$$F = \max\!\left(0,\;\frac{\dot\delta_{free} + \beta\,\delta/\Delta t}{G_v + 1/(k_{eff}\Delta t)}\right),\qquad
G_v = (\mathbf n_c\!\cdot\!\mathbf n)^2\sum_k \phi_k(s)^2 B_{2,k}$$

Here $k_{eff}$ is the Hertz, pin-axial and pin-bending compliances in series (pin
bending dominates for sideways contacts, so jammed geometries give bounded forces).
Two things turned out to be essential:

1. **Consistency.** The penetration must be computed from the same mode shapes
   φ(s) used to project the force. An earlier version used a straight chord for
   penetration but exact shapes for the force. That made the contact force
   non-conservative, and lead-weighted tines whose 4th mode sat above 13 kHz grew
   without bound.
2. **One-sidedness.** Penetrations deeper than 60 µm mean the tine has swung past
   the pin's far side. Those are ignored rather than "corrected" with a huge force.

Contacts run with 2 substeps; 1 is unstable and 4 matches 2 to within 3%.
The position correction is gentle (β = 0.1). With β = 0.25 the treble tines chattered
against the pin during the dwell before release.

Coulomb friction (μ = 0.14, smoothed) acts along the contact tangent, but it only
loads the cylinder; it does not drive the tine's bending. Because the pin's end face
is tilted 25° to the tine's bending direction, friction has a bending component. Fed
back into the tine, that becomes the textbook brake-squeal mode-coupling instability:
a self-sustained ≈ 1 kHz harmonic buzz, about 20 dB under the notes, during the
~0.1 s the tip rests on the end face. Oiled music-box pins don't squeal, so that
path is cut; the friction work still costs spring torque.

While touching, the lubricated contact also damps the pinned tine's own vibration.
Without that damping, the "pinned-tine" mode chirps from 8 to 6 kHz as the pin slides.

**Dampers.** Bass tines carry a feather damper. Just before the next pin arrives,
the approaching pin presses it against the still-ringing tine, so the tine is
quieted before it is re-plucked. Turn dampers off and you hear the pin chatter
against a vibrating tine, the squeak that dampers were invented to stop.

## 5. The drive train

**Cylinder.** A brass tube (with end caps and arbor) gives the inertia. Contact
reaction torque, $\tau = -\,\mathbf r\times\mathbf F$, is fed back every sample.
A pluck costs about 10⁻⁴ J of work, a noticeable fraction of the mechanism's
kinetic energy, so **dense chords momentarily slow a spring-driven box**, just as
real ones do.

**Hand crank.** Your finger angle (from the gesture pad) drives the crank through a
finger/wrist compliance (14 Hz, ζ = 0.9) and a gear ratio sized so that cranking at
≈ 1.15 turns/s plays the written tempo. A ratchet stops the train running backward.
Turning backward just clicks the pawl. Let go and it coasts on bearing friction.

**Wind-up.** The mainspring gives torque linear in turns wound, with a preload,
geared to the cylinder. A **governor** sets the speed: an endless screw driving a
two-bladed fan whose aerodynamic drag is

$$\tau_{fan} = \tfrac12\rho C_d A\,r^3\,\omega_f^2 \quad\Rightarrow\quad \tau_{cyl} = \frac{G^3 k_{air}}{\eta_{worm}}\,\omega_{cyl}^2 .$$

Quadratic drag makes the speed depend only on the square root of the spring torque,
which is why a governed box keeps fairly steady time as the spring runs down. The
gear ratio G (≈ 1000–2000) is solved so that the written tempo happens at 65 % wind.
The fan's reflected inertia, G²·I_fan, is thousands of times the cylinder's, which
is why the music starts with a short, smooth spin-up. Near the end of the spring the
tempo sags and the music winds down, the most music-box thing of all. The
"air brake" slider changes the blade area.

**Mechanism noise** goes into the bedplate as forces, so it sounds through the wood:
ratchet clicks while winding (plus the pawl spring's 5.6 kHz ping), worm-tooth
ticks, crank gear ticks, and the fan's aerodynamic whirr (band-limited noise
modulated at blade-passing frequency, scaling with ω³).

## 6. From comb to wood

### The pluck force cancels; only momentum leaks
The pin pushes the tine with F, but the pin's reaction goes into the cylinder,
which is mounted on the same bedplate. Those cancel. What reaches the structure is
the tine's change of momentum:

$$F_{base} = -\sum_k \Gamma_k\,\ddot q_k, \qquad \Gamma_k = \int \rho A\,\phi_k\,dx \;(+ m_{lead}\phi_k^{tip})$$
$$M_{base} = \mathbf r_{root}\times F_{base} + \hat x\sum_k \Lambda_k \ddot q_k,\qquad \Lambda_k = \int \rho A\,x\,\phi_k\,dx$$

Summed over all tines, this gives a vertical force plus moments about x and y on the
**bedplate**, a rigid body (comb bar, cylinder and cast bedplate) with three degrees
of freedom.

### Bedplate → soundboard: implicit screw coupling
Four screws (≈ 400 kN/m each) tie the bedplate to the soundboard. Explicitly coupled,
they pump energy into the soundboard, the forward-Euler problem again. So the four
screw forces are solved **implicitly** each sample with a precomputed 4×4 Schur
complement, $A = I + k(H_b+G_p) + c(H_b/\Delta t + G_v)$, where H_b is the
bedplate's response and G_p, G_v the plate's modal response at the screw points.
The feet coupling the box to the table uses the same idea in scalar form.

### Soundboard: orthotropic plate modes
Box floors are spruce, maple and similar woods, very stiff along the grain and soft
across it. Simply-supported orthotropic plate modes (Leissa):

$$f_{mn} = \frac{\pi}{2}\sqrt{\frac{D_1 (m/a)^4 + 2D_3 (m/a)^2(n/b)^2 + D_2 (n/b)^4}{\rho h}},\quad
\psi_{mn} = \frac{2}{\sqrt{\rho h ab}}\sin\frac{m\pi x}{a}\sin\frac{n\pi y}{b}$$

Up to 44 modes to 9 kHz. The bedplate sits off-centre, so it couples to modes a
centred one would miss.

### The cavity breathes
The floor panel's inner face compresses the air in the box. That air pushes back
on the panel (an air spring that stiffens the odd-odd modes) and vents through the
opening, forming a Helmholtz resonator:

$$\dot p = -\frac{\rho c^2}{V}(Q_{panel} + Q_{port}), \qquad \frac{\rho L_{eff}}{A}\dot Q_{port} = p - R Q_{port}$$

* Lid closed: only the keyhole and gaps leak, so f_H ≈ 200 Hz.
* Lid open: the opening is huge and f_H rises toward 900 Hz.

Below f_H the port flow cancels the panel's (the bass-reflex cancellation), and
near it they reinforce. The lid itself is a mass-law barrier (corner frequency
10^{47/20}/m″) in parallel with a leak path, so a closed lid mostly hides the
tines' direct sound.

### Box on the table
The box (frame plus panel mass) bounces on its feet: felt pads ≈ 30 kN/m and
lossy, hard wood ≈ 3 MN/m. Your hand is soft and very lossy, and it also damps the
panels. The feet force drives the **table top's** plate modes. This is the old
trick of putting a music box on a table to make it louder: a big plate radiates far
better than a small one, especially with hard feet. Felt isolates. A glass table
rings with very little damping. A marble counter is too stiff and heavy to help.

## 7. Radiation: monopoles and dipoles

At these sizes (box ≪ wavelength below a few kHz), every vibrating part is a
compact source. The model keeps first-order multipoles:

* **Monopole**, volume velocity Q: panel outer face + cavity port + table top.
  $p = \dfrac{\rho\,\dot Q(t-r/c)}{4\pi r}$
* **Dipoles**, moment **D** (m⁴/s):
  * the panel's in-plane first moments $\int (x-\bar x)\,v\,dA$ (even modes cancel as monopoles but not as dipoles),
  * the rigid box bouncing ($\mathbf D = 1.5\,V\,\mathbf v$, a sphere's volume plus added mass),
  * each tine's own sound: a thin strip moving through air is a dipole with
    $D' = \tfrac{\pi}{4}w^2 v$ per unit length (its added-mass area), so
    $\mathbf D_{tine} = \tfrac{\pi}{4}\,\mathbf n\int w^2 v\,dx$.

  $p = \dfrac{\rho}{4\pi}\,\hat{\mathbf r}\cdot\left[\dfrac{\ddot{\mathbf D}}{c\,r} + \dfrac{\dot{\mathbf D}}{r^2}\right]$,
  with near-field and far-field terms both kept, so putting your ear right at the
  box gives the near-field bass lift.
* **Unbaffled plates.** A table top radiates from both faces in antiphase, so it
  short-circuits at low frequency. It is modelled as a top monopole plus an opposite
  bottom monopole d_eff = 0.85·√(ab/π) lower, shadowed by the top. A bare movement's
  small base plate radiates as a dipole.

All radiators are written into 8 delay lines (Ṁ, Ḋ_xyz, D̈_xyz, table-bottom Ṁ).

## 8. You, in the room

* **Image sources.** Direct sound, the table plane right under the box, the floor
  (mostly shadowed by the table), the ceiling and four walls, with each image's
  dipoles mirrored. Each boundary has a low- and high-frequency absorption
  coefficient.
* **Propagation.** Fractional delays (cubic Hermite on the direct path) give the
  correct arrival time, so walking around produces real Doppler and comb filtering.
  1/r spreading, plus air absorption (≈ 0.1 dB/m at 8 kHz) and wall high-frequency
  loss folded into one first-order filter per path.
* **Your head.** The Woodworth spherical-head ITD per ear, plus the Brown–Duda
  head-shadow filter (one pole, one zero, α(θ) from the incidence angle on each ear).
  Turning your head swaps the shadowing.
* **Late reverb.** An 8-line feedback delay network with Householder mixing, line
  lengths scaled to the room's mean free path 4V/S, and two-band decay from Eyring
  T60. Its gain is calibrated numerically at load so that the reverberant energy is
  16π/R relative to the direct sound at 1 m (room constant R = Sᾱ/(1−ᾱ)), which
  sets the critical distance physically.
* **The SPL meter** in the header is the actual simulated sound pressure at your
  ears, in dB re 20 µPa. Expect roughly 45–70 dB at a metre, about what a real music
  box measures.

## 9. Melodies on a cylinder

* A tune is a list of onsets. One cylinder revolution plays it once.
* **Transposition** is chosen by scoring every shift from −36 to +36: exact tines
  score highest, octave folds less, near substitutions least.
* **Tune-matched combs** (18 and 72 tines) are built like a Swiss arrangement:
  every pitch the tune needs, plus duplicate tines for pitches that repeat inside
  0.4 s.
* **Duplicate tines** are used least-recently-plucked first.
* **A pin needs time to clear its tine.** It must slide past before the next pin
  can lift the same tine. A repeat that arrives too soon is moved to the octave,
  as real arrangers did; otherwise it is reported as lost.
* The cylinder may grow by up to 1.35× to give pins room.
* Chord notes are staggered by a few ms, bass first, which spreads the torque load.
* Tunes without accompaniment get one from a small harmoniser: a Krumhansl key
  profile or the given key, a dynamic-programming choice of diatonic triads, and a
  music-box broken-chord pattern.

## 10. What is not modelled (yet)

* Tine-to-tine coupling through the comb base (sympathetic ringing of neighbouring tines).
* Standing-wave modes inside the cavity (only its Helmholtz mode is modelled).
* Plate radiation efficiency beyond the compact-source limit, and coincidence effects in the table.
* Large-deflection nonlinearity of the tines; pin wear; temperature drift of E.
* Second-order image sources (the FDN stands in for them).

## References

* Leissa, *Vibration of Plates* (NASA SP-160) — orthotropic plate frequencies.
* Zener (1937), *Internal friction in solids* — thermoelastic damping.
* Hosaka, Itao & Kuroda (1995), *Damping characteristics of beam-shaped micro-oscillators* — air drag.
* Brown & Duda (1998), *A structural model for binaural sound synthesis* — head shadow.
* Jot & Chaigne (1991), feedback delay networks for artificial reverberation.
* Macklin, Müller & Chentanez (2016), *XPBD* — compliant constraints.
* Fletcher & Rossing, *The Physics of Musical Instruments* — radiation, Helmholtz resonators, bars.
