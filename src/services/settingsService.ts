import { httpClient } from './adapters/httpClient';

const isHttp = import.meta.env.VITE_API_MODE === 'http';
const storageKey = 'wip-settings';
const themeStorageKey = 'wip_theme';
const fontStorageKey = 'wip_font';
const densityStorageKey = 'wip_density';

function loadCachedTheme(): UserSettings['theme'] {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch { /* ignore */ }
  return 'light';
}

function loadCachedFont(): UserSettings['font'] {
  try {
    const saved = localStorage.getItem(fontStorageKey);
    if (saved === 'geist' || saved === 'inter' || saved === 'mono') return saved;
  } catch { /* ignore */ }
  return 'geist';
}

function loadCachedDensity(): UserSettings['density'] {
  try {
    const saved = localStorage.getItem(densityStorageKey);
    if (saved === 'compact' || saved === 'default' || saved === 'spacious') return saved;
  } catch { /* ignore */ }
  return 'compact';
}

const defaults: UserSettings = {
  theme: loadCachedTheme(),
  font: loadCachedFont(),
  density: loadCachedDensity(),
  notifications: {
    mention: true,
    reply: true,
    reaction: false,
    statusChange: true,
    dmNew: true,
    sound: false,
    desktop: false,
    email: false,
  },
};

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  font: 'geist' | 'inter' | 'mono';
  density: 'compact' | 'default' | 'spacious';
  notifications: {
    mention: boolean;
    reply: boolean;
    reaction: boolean;
    statusChange: boolean;
    dmNew: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
}

export const settingsService = {
  async get(): Promise<UserSettings> {
    if (!isHttp) {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<UserSettings>;
      return { ...defaults, ...stored, notifications: { ...defaults.notifications, ...stored.notifications } };
    }
    const response = await httpClient.get<{ settings: UserSettings }>('/settings');
    return response.settings;
  },

  async update(patch: Partial<UserSettings>): Promise<UserSettings> {
    if (!isHttp) {
      const current = await this.get();
      const settings = { ...current, ...patch, notifications: { ...current.notifications, ...patch.notifications } };
      localStorage.setItem(storageKey, JSON.stringify(settings));
      if (patch.theme) localStorage.setItem(themeStorageKey, patch.theme);
      if (patch.font) localStorage.setItem(fontStorageKey, patch.font);
      if (patch.density) localStorage.setItem(densityStorageKey, patch.density);
      return settings;
    }
    const response = await httpClient.put<{ settings: UserSettings }>('/settings', patch);
    return response.settings;
  },
};
