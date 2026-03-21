export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'eyes_closed_wp_draft';
        this.SETTINGS_KEY = 'eyes_closed_wp_settings';
        this.DRIVE_AUTH_KEY = 'eyes_closed_wp_drive_authed';
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

    saveDriveAuthorized() {
        localStorage.setItem(this.DRIVE_AUTH_KEY, '1');
    }

    wasDriveAuthorized() {
        return localStorage.getItem(this.DRIVE_AUTH_KEY) === '1';
    }
}
