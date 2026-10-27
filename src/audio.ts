import type { Settings } from './types';

type MusicMode = 'stealth' | 'debate' | 'off';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicMode: MusicMode = 'off';
  private musicStep = 0;
  private volume = 0.65;
  private muted = false;
  private unlocked = false;
  private lastStep = 0;
  private lastAlert = 0;

  init(settings: Settings): void {
    this.volume = settings.volume;
    this.muted = settings.muted;
    this.ensureContext();
    this.applyVolume();
  }

  setSettings(settings: Settings): void {
    this.volume = settings.volume;
    this.muted = settings.muted;
    this.applyVolume();
    if (this.muted && this.ctx?.state === 'running') {
      this.stopMusic();
    }
  }

  unlock(): void {
    this.ensureContext();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      this.startHum();
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.master);
    }
    return this.ctx;
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.03);
  }

  private startHum(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (this.humOsc) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.018;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 118;
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 59;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc2.start();
    this.humOsc = osc;
    this.humGain = gain;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue = 0.1,
    slide = 0,
    when = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.04);
  }

  private noise(duration = 0.16, gainValue = 0.06, lowpass = 1200): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.muted) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
  }

  click(): void {
    this.tone(420, 0.06, 'square', 0.035, 80);
  }

  card(): void {
    this.tone(280, 0.08, 'triangle', 0.045, -40);
    this.tone(620, 0.1, 'sine', 0.025, 120, 0.04);
  }

  counter(): void {
    this.tone(660, 0.12, 'triangle', 0.07, 220);
    this.tone(990, 0.16, 'sine', 0.04, 220, 0.07);
  }

  wrong(): void {
    this.tone(180, 0.16, 'sawtooth', 0.04, -60);
    this.noise(0.08, 0.04, 500);
  }

  hurt(): void {
    this.noise(0.13, 0.1, 700);
    this.tone(110, 0.14, 'square', 0.03, -40);
  }

  pickup(): void {
    this.tone(520, 0.08, 'sine', 0.04, 200);
    this.tone(780, 0.1, 'sine', 0.03, 120, 0.06);
  }

  throw(): void {
    this.noise(0.06, 0.035, 2600);
    this.tone(700, 0.05, 'triangle', 0.025, -200);
  }

  hide(): void {
    this.tone(220, 0.12, 'sine', 0.025, -90);
    this.noise(0.05, 0.02, 500);
  }

  step(soft = false): void {
    const now = performance.now();
    if (now - this.lastStep < (soft ? 320 : 190)) return;
    this.lastStep = now;
    this.noise(0.035, soft ? 0.012 : 0.022, soft ? 300 : 900);
  }

  alert(intensity = 0.5): void {
    const now = performance.now();
    if (now - this.lastAlert < 700) return;
    this.lastAlert = now;
    this.tone(520 + intensity * 200, 0.12, 'square', 0.022, 110);
  }

  debateStart(): void {
    this.tone(120, 0.5, 'sawtooth', 0.045, 30);
    this.tone(240, 0.35, 'triangle', 0.035, 40, 0.1);
    this.noise(0.3, 0.025, 420);
  }

  bossWin(): void {
    [392, 523, 659, 784].forEach((freq, i) => this.tone(freq, 0.24, 'triangle', 0.055, 20, i * 0.1));
  }

  caught(): void {
    this.tone(300, 0.45, 'sawtooth', 0.06, -220);
    this.tone(140, 0.6, 'square', 0.035, -100, 0.08);
    this.noise(0.3, 0.06, 400);
  }

  ending(): void {
    [262, 330, 392, 523, 659].forEach((freq, i) => this.tone(freq, 0.5, 'sine', 0.045, 5, i * 0.15));
  }

  startMusic(mode: MusicMode): void {
    if (!this.ctx || !this.unlocked) return;
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.stopMusicTimer();
    if (mode === 'off' || this.muted) {
      this.stopMusic();
      return;
    }
    const pattern = mode === 'debate' ? [55, 55, 82, 55, 73, 55, 65, 49] : [55, 46, 65, 46, 55, 73, 65, 49];
    const tick = () => {
      if (this.muted || this.musicMode === 'off') return;
      const note = pattern[this.musicStep % pattern.length];
      const ctx = this.ctx;
      if (!ctx || !this.musicGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = mode === 'debate' ? 500 : 300;
      osc.type = mode === 'debate' ? 'triangle' : 'sine';
      osc.frequency.value = note;
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(mode === 'debate' ? 0.08 : 0.045, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (mode === 'debate' ? 0.3 : 0.7));
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.8);
      if (mode === 'debate' && this.musicStep % 2 === 0) this.noise(0.03, 0.008, 1800);
      this.musicStep += 1;
    };
    tick();
    this.musicTimer = window.setInterval(tick, mode === 'debate' ? 420 : 760);
  }

  stopMusic(): void {
    this.stopMusicTimer();
    this.musicMode = 'off';
  }

  private stopMusicTimer(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  stopAll(): void {
    this.stopMusic();
    if (this.humOsc) {
      try {
        this.humOsc.stop();
      } catch {
        /* noop */
      }
      this.humOsc = null;
    }
    if (this.humGain) {
      this.humGain.disconnect();
      this.humGain = null;
    }
  }
}

export const audio = new AudioManager();
