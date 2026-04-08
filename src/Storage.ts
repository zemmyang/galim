const PREFERENCES_KEY = 'galim-preferences';

interface Preferences {
    favorites: string[];
    userTypes: number[];
    theme: 'light' | 'dark';
}

export function loadPreferences(): Preferences {
    try {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        return stored ? { theme: 'dark', ...JSON.parse(stored) } : { favorites: [], userTypes: [1], theme: 'dark' };
    } catch (error) {
        console.error('Error loading preferences:', error);
        return { favorites: [], userTypes: [1], theme: 'dark' };
    }
}

function savePreferences(preferences: Preferences): void {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

export function toggleFavoriteInPreferences(slug: string): boolean {
    const preferences = loadPreferences();
    const index = preferences.favorites.indexOf(slug);
    
    if (index > -1) {
        preferences.favorites.splice(index, 1);
    } else {
        preferences.favorites.push(slug);
    }
    
    savePreferences(preferences);
    return index === -1;
}

export function saveUserTypes(userTypes: number[]): void {
    const preferences = loadPreferences();
    preferences.userTypes = userTypes;
    savePreferences(preferences);
}

export function saveTheme(theme: 'light' | 'dark'): void {
    const preferences = loadPreferences();
    preferences.theme = theme;
    savePreferences(preferences);
}
