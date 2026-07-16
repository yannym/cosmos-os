/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthEngine {
  private ctx: AudioContext | null = null;
  private muted = typeof window !== "undefined" ? localStorage.getItem("cosmos_os_muted") === "true" : false;

  public setMuted(val: boolean) {
    this.muted = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("cosmos_os_muted", val ? "true" : "false");
    }
  }

  public isMuted() {
    return this.muted;
  }

  public init() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (e) {
        console.warn("AudioContext init blocked or unsupported in sandbox:", e);
        this.ctx = null;
      }
    }
  }

  public resumeContext() {
    this.init();
    try {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    } catch (e) {
      // Ignored
    }
  }

  public playBeep(freq = 600, duration = 0.05, type: OscillatorType = "sine") {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  }

  public playLaser() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.start();
      osc.stop(now + 0.35);
    } catch (e) {
      // Ignored
    }
  }

  public playTorpedo() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.5);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);

      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {
      // Ignored
    }
  }

  public playDeflect() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

      osc.start();
      osc.stop(now + 0.2);
    } catch (e) {
      // Ignored
    }
  }

  public playExplosion() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(10, now + 0.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(now + 0.8);
    } catch (e) {
      // Ignored
    }
  }

  public playAlarm() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.25);
      
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.45);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);

      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {
      // Ignored
    }
  }

  public playCriticalAlarm() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.15);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

      osc.start();
      osc.stop(now + 0.2);
    } catch (e) {
      // Ignored
    }
  }

  public playWarp() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.start();
      osc.stop(now + 1.2);
    } catch (e) {
      // Ignored
    }
  }

  public playBeaconPing() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.setValueAtTime(1400, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignored
    }
  }

  public playUIConfirm() {
    this.playBeep(880, 0.05, "sine");
    setTimeout(() => this.playBeep(1320, 0.05, "sine"), 50);
  }

  public playUIError() {
    this.playBeep(220, 0.1, "sawtooth");
    setTimeout(() => this.playBeep(110, 0.2, "sawtooth"), 100);
  }

  public playEnginePowerUp() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 1.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start();
      osc.stop(now + 1.5);
    } catch (e) {}
  }

  public playShieldDown() {
    this.playBeep(440, 0.2, "sine");
    setTimeout(() => this.playBeep(220, 0.4, "sawtooth"), 200);
  }

  public playShieldUp() {
    this.playBeep(220, 0.2, "sine");
    setTimeout(() => this.playBeep(440, 0.4, "sine"), 200);
  }

  public playResourcePickup() {
    this.playBeep(1200, 0.05, "sine");
    setTimeout(() => this.playBeep(1800, 0.05, "sine"), 30);
  }

  public playShieldRecharge() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  public playGlitchHit() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // High pitch crackle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.setValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.setValueAtTime(0.01, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start();
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  public playSolarRadiationHum() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(65, now + 0.4);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start();
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  public playTransaction() {
    if (this.muted) return;
    try {
      this.resumeContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

export const AudioEngine = new SoundSynthEngine();
