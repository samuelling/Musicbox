// Thin wrapper around the AudioContext + physical-model worklet.
export class Engine {
  constructor() {
    this.ctx = null; this.node = null; this.onState = null; this.pending = []; this.ready = false;
  }
  // Must be called synchronously inside a click / touchend handler: iOS only lets
  // audio start from a completed tap, and only for work done before the first await.
  unlock() {
    if (!this.ctx) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: 'interactive', sampleRate: 48000 });
      this.ctx.onstatechange = () => this.onRunning && this.onRunning(this.ctx.state === 'running');
      this.loading = this.load();
    }
    if (this.ctx.state !== 'running') {
      try { this.ctx.resume(); } catch (e) { /* ignored */ }
      // a one-sample silent buffer started inside the gesture unlocks older iOS
      try { const b = this.ctx.createBuffer(1, 1, this.ctx.sampleRate); const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); } catch (e) { /* ignored */ }
    }
    return this.loading;
  }
  get running() { return !!this.ctx && this.ctx.state === 'running'; }
  async load() {
    await this.ctx.audioWorklet.addModule(new URL('./musicbox-worklet.js', import.meta.url));
    this.node = new AudioWorkletNode(this.ctx, 'musicbox', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    this.node.port.onmessage = (e) => { if (e.data.type === 'state' && this.onState) this.onState(e.data); };
    this.node.connect(this.ctx.destination);
    this.ready = true;
    for (const [m, t] of this.pending) this.node.port.postMessage(m, t);
    this.pending = [];
  }
  start() { return this.unlock(); }
  get sampleRate() { return this.ctx ? this.ctx.sampleRate : 48000; }
  send(msg, transfer = []) {
    if (this.ready) this.node.port.postMessage(msg, transfer);
    else {
      // keep only the latest of each message type while waiting (except winding deltas)
      if (msg.type !== 'wind') this.pending = this.pending.filter(([m]) => m.type !== msg.type);
      this.pending.push([msg, transfer]);
    }
  }
}
