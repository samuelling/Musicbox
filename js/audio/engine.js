// Thin wrapper around the AudioContext + physical-model worklet.
export class Engine {
  constructor() {
    this.ctx = null; this.node = null; this.onState = null; this.pending = []; this.ready = false;
  }
  async start() {
    if (this.ctx) { if (this.ctx.state !== 'running') await this.ctx.resume(); return; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive', sampleRate: 48000 });
    await this.ctx.audioWorklet.addModule(new URL('./musicbox-worklet.js', import.meta.url));
    this.node = new AudioWorkletNode(this.ctx, 'musicbox', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
    this.node.port.onmessage = (e) => { if (e.data.type === 'state' && this.onState) this.onState(e.data); };
    this.node.connect(this.ctx.destination);
    this.ready = true;
    for (const [m, t] of this.pending) this.node.port.postMessage(m, t);
    this.pending = [];
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }
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
