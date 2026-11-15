const KEY = 'furkanekim-save-v1';
const LEGACY_KEY = 'emberwing-save-v1';
const defaults = () => ({
  unlocked: 0,
  completed: [],
  best: {},
  orbs: 0,
  settings: { muted: false, volume: 0.65, musicVolume: 0.45, sfxVolume: 0.8 }
});

export default class SaveSystem {
  static load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? 'null');
      if (!parsed || typeof parsed !== 'object') return defaults();
      const initial = defaults();
      return {
        ...initial,
        ...parsed,
        unlocked: Number.isInteger(parsed.unlocked) ? Math.max(0, Math.min(4, parsed.unlocked)) : 0,
        completed: Array.isArray(parsed.completed) ? parsed.completed.filter(Number.isInteger) : [],
        best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
        orbs: Number.isFinite(parsed.orbs) ? Math.max(0, parsed.orbs) : 0,
        settings: {
          ...initial.settings,
          ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {}),
          muted: parsed.settings?.muted === true,
          volume: Number.isFinite(parsed.settings?.volume) ? Math.max(0, Math.min(1, parsed.settings.volume)) : initial.settings.volume,
          musicVolume: Number.isFinite(parsed.settings?.musicVolume) ? Math.max(0, Math.min(1, parsed.settings.musicVolume)) : initial.settings.musicVolume,
          sfxVolume: Number.isFinite(parsed.settings?.sfxVolume) ? Math.max(0, Math.min(1, parsed.settings.sfxVolume)) : initial.settings.sfxVolume
        }
      };
    } catch (error) {
      console.warn('Could not read furkanekim save data; starting a fresh journey.', error);
      return defaults();
    }
  }

  static store(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save furkanekim progress.', error);
    }
  }

  static reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      console.warn('Could not reset furkanekim save data.', error);
    }
    return defaults();
  }
}
