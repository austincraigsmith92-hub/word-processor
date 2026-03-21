import { UI } from './ui.js';
import { AudioController } from './audio.js';
import { Monitor } from './monitor.js';
import { StorageManager } from './storage.js';
import { DriveManager } from './drive.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const audio = new AudioController();
    const storage = new StorageManager();
    const drive = new DriveManager();

    // Load saved text
    ui.editor.value = storage.loadText();
    ui.updateWordCount();

    // Load saved settings
    const settings = storage.loadSettings();
    if (settings.vol !== undefined) ui.volSlider.value = settings.vol;
    if (settings.audioMode) ui.selectAudioMode.value = settings.audioMode;
    if (settings.noiseType) ui.selectNoiseType.value = settings.noiseType;
    if (settings.activeTone) ui.selectActiveTone.value = settings.activeTone;
    if (settings.idleTone) ui.selectIdleTone.value = settings.idleTone;
    if (settings.autosaveInterval) ui.selectAutosaveInterval.value = settings.autosaveInterval;
    if (settings.autosaveChime) ui.selectAutosaveChime.value = settings.autosaveChime;
    if (settings.wordGoal) ui.wordGoalInput.value = settings.wordGoal;

    ui.updateSoundSettingsVisibility();
    audio.setVolume(ui.volSlider.value);

    const saveSettings = () => {
        storage.saveSettings({
            vol: ui.volSlider.value,
            audioMode: ui.selectAudioMode.value,
            noiseType: ui.selectNoiseType.value,
            activeTone: ui.selectActiveTone.value,
            idleTone: ui.selectIdleTone.value,
            autosaveInterval: ui.selectAutosaveInterval.value,
            autosaveChime: ui.selectAutosaveChime.value,
            wordGoal: ui.wordGoalInput.value,
        });
    };

    // Monitor callbacks — noise runs continuously; tones fire at heartbeat events
    const monitor = new Monitor({
        onActive: () => {
            ui.setStatus('active');
            const text = ui.editor.value;
            storage.saveText(text);
            drive.saveDraft(text);
            const mode = ui.selectAudioMode.value;
            if (mode === 'tones' || mode === 'both') {
                audio.playActive(ui.selectActiveTone.value);
            }
        },
        onIdle: () => {
            ui.setStatus('idle');
            const mode = ui.selectAudioMode.value;
            if (mode === 'tones' || mode === 'both') {
                audio.playIdle(ui.selectIdleTone.value);
            }
        },
        onError: () => {
            ui.setStatus('error');
            audio.playError();
        }
    });

    // Start / Stop monitoring
    ui.btnStart.addEventListener('click', () => {
        if (!monitor.isActive) {
            monitor.start();
            ui.btnStart.textContent = 'Stop Monitoring';
            ui.btnStart.classList.replace('primary', 'danger');
            ui.startSessionTimer();
            const mode = ui.selectAudioMode.value;
            if (mode === 'noise' || mode === 'both') {
                audio.startNoise(ui.selectNoiseType.value);
            }
        } else {
            monitor.stop();
            audio.stopNoise();
            ui.btnStart.textContent = 'Start Monitoring';
            ui.btnStart.classList.replace('danger', 'primary');
            ui.setStatus('inactive');
            ui.stopSessionTimer();
            ui.setTextVisible(false);
        }
    });

    // Editor input: jjj = manual save, fff = status check
    ui.editor.addEventListener('input', () => {
        let text = ui.editor.value;

        if (text.endsWith('jjj')) {
            text = text.slice(0, -3);
            ui.editor.value = text;
            ui.updateWordCount();
            drive.saveDraft(text).then(success => {
                if (success) { audio.playChime(); ui.setStatus('active'); }
            });
        }

        if (text.endsWith('fff')) {
            text = text.slice(0, -3);
            ui.editor.value = text;
            ui.updateWordCount();
            drive.saveDraft(text).then(success => {
                success ? audio.playChime() : audio.playError();
            });
        }

        monitor.registerKeypress();
        storage.saveText(text);
    });

    // Mute toggle
    ui.btnMute.addEventListener('click', () => {
        const muted = !audio.muted;
        audio.setMuted(muted);
        ui.btnMute.textContent = muted ? '🔇' : '🔊';
        ui.btnMute.classList.toggle('muted', muted);
    });

    // Volume
    ui.volSlider.addEventListener('input', () => {
        audio.setVolume(ui.volSlider.value);
        saveSettings();
    });

    // Audio mode change: start/stop noise, show/hide settings sections
    ui.selectAudioMode.addEventListener('change', () => {
        const mode = ui.selectAudioMode.value;
        if (mode === 'tones' || mode === 'silent') {
            audio.stopNoise();
        } else if (monitor.isActive) {
            audio.startNoise(ui.selectNoiseType.value);
        }
        ui.updateSoundSettingsVisibility();
        saveSettings();
    });

    // Noise type change: restart noise if monitoring
    ui.selectNoiseType.addEventListener('change', () => {
        if (monitor.isActive) {
            const mode = ui.selectAudioMode.value;
            if (mode === 'noise' || mode === 'both') {
                audio.stopNoise();
                audio.startNoise(ui.selectNoiseType.value);
            }
        }
        saveSettings();
    });

    // Other settings
    [ui.selectActiveTone, ui.selectIdleTone, ui.selectAutosaveInterval, ui.selectAutosaveChime].forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    ui.wordGoalInput.addEventListener('input', () => {
        ui.updateWordCount();
        saveSettings();
    });

    // Test buttons
    ui.btnTestActive.addEventListener('click', () => audio.playActive(ui.selectActiveTone.value));
    ui.btnTestIdle.addEventListener('click', () => audio.playIdle(ui.selectIdleTone.value));
    ui.btnTestError.addEventListener('click', () => audio.playError());

    // Drive auth
    ui.btnAuth.addEventListener('click', () => drive.authorize(false));

    // Download draft
    ui.btnDownload.addEventListener('click', () => {
        const text = ui.editor.value;
        const date = new Date().toISOString().slice(0, 10);
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `draft-${date}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // Drive init + auto-authorize silently if previously connected
    setTimeout(() => {
        drive.init((isReady) => {
            if (isReady) {
                const driveStatus = document.getElementById('drive-status');
                driveStatus.textContent = 'Connected';
                driveStatus.style.color = 'var(--success)';
                storage.saveDriveAuthorized();
            }
        });
        if (storage.wasDriveAuthorized()) {
            drive.authorize(true);
        }
    }, 1000);

    // Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('SW registered', reg))
                .catch(err => console.error('SW failed', err));
        });
    }

    // Auto-save loop
    let lastSavedText = storage.loadText();
    let lastSaveTime = Date.now();

    setInterval(() => {
        const intervalMs = parseInt(ui.selectAutosaveInterval.value, 10);
        if (Date.now() - lastSaveTime < intervalMs) return;

        if (ui.selectAutosaveChime.value === 'on' && ui.selectAudioMode.value !== 'silent') {
            audio.playChime();
        }

        const currentText = ui.editor.value;
        if (currentText !== lastSavedText && currentText.trim().length > 0) {
            drive.saveDraft(currentText).then(success => {
                if (success) {
                    lastSavedText = currentText;
                    lastSaveTime = Date.now();
                }
            });
        } else {
            lastSaveTime = Date.now();
        }
    }, 5000);
});
