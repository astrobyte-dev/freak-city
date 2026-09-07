// Synthesised locally: no downloads, microphones, tracking, or autoplay.
export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }
    const ctx = new AudioContext();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.045;
    this.master.connect(ctx.destination);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * 0.45;
    const rain = ctx.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    rain.connect(filter);
    filter.connect(this.master);
    rain.start();
    this.nodes.push(rain);
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.value = 49;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    bass.connect(gain);
    gain.connect(this.master);
    bass.start();
    this.nodes.push(bass);
    await ctx.resume();
  }
  setLocation(location: string) {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(
      location === "apartment"
        ? 0.012
        : location === "upstairs"
          ? 0.018
          : 0.045,
      this.context.currentTime,
      0.8,
    );
  }
  async stop() {
    if (this.context) await this.context.suspend();
  }
  async dispose() {
    for (const n of this.nodes) n.stop();
    this.nodes = [];
    await this.context?.close();
    this.context = null;
  }
}
