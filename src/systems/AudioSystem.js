export default class AudioSystem {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.master = null;
    this.started = false;
  }

  unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.settings.muted ? 0 : this.settings.volume;
      this.master.connect(this.context.destination);
      this.music = this.context.createGain();
      this.music.gain.value = this.settings.musicVolume;
      this.music.connect(this.master);
    }
    if (this.context.state === 'suspended') {
      this.context.resume().catch((error) => console.warn('Could not resume game audio.', error));
    }
    if (!this.started) {
      this.started = true;
      this.playDrone();
    }
  }

  playDrone() {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    [55, 82.4].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = index ? 0.025 : 0.018;
      oscillator.connect(gain);
      gain.connect(this.music);
      oscillator.start(now);
    });
  }

  setMuted(muted) {
    this.settings.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.settings.volume, this.context.currentTime, 0.08);
    }
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    if (this.master && this.context && !this.settings.muted) {
      this.master.gain.setTargetAtTime(this.settings.volume, this.context.currentTime, 0.08);
    }
  }

  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music && this.context) {
      this.music.gain.setTargetAtTime(this.settings.musicVolume, this.context.currentTime, 0.08);
    }
  }

  setSfxVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  play(kind = 'tick') {
    if (!this.context || this.settings.muted || !this.master) return;
    const presets = {
      tick: [440, .045, 'sine'],
      collect: [720, .14, 'sine'],
      hit: [115, .2, 'triangle'],
      clone: [540, .3, 'sine'],
      death: [90, .32, 'sawtooth'],
      win: [880, .45, 'sine']
    };
    const [frequency, duration, type] = presets[kind] || presets.tick;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(38, frequency * .56), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    const peak = .16 * this.settings.sfxVolume;
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, peak), now + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
  }
}
