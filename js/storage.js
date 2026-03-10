export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'eyes_closed_wp_draft';
        this.SETTINGS_KEY = 'eyes_closed_wp_settings';
    }

    saveText(text) {
        localStorage.setItem(this.STORAGE_KEY, text);
    }

    loadText() {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    }

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
}
