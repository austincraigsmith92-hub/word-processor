import { UI } from './ui.js';
import { AudioController } from './audio.js';
import { Monitor } from './monitor.js';
import { StorageManager } from './storage.js';
import { DriveManager } from './drive.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const audio = new AudioController();
    const storage = new StorageManager();
    const drive = new DriveManager(); // Can inject client ID from settings

    // Load initial data
    ui.editor.value = storage.loadText();
    ui.updateWordCount();

    const settings = storage.loadSettings();
    if (settings.vol !== undefined) ui.volSlider.value = settings.vol;
    if (settings.audioMode) ui.selectAudioMode.value = settings.audioMode;
    if (settings.noiseMode) ui.selectNoiseMode.value = settings.noiseMode;
    if (settings.activeTone) ui.selectActiveTone.value = settings.activeTone;
    if (settings.idleTone) ui.selectIdleTone.value = settings.idleTone;
    if (settings.autosaveInterval) ui.selectAutosaveInterval.value = settings.autosaveInterval;
    if (settings.autosaveChime) ui.selectAutosaveChime.value = settings.autosaveChime;

    audio.setVolume(ui.volSlider.value);

    // Initialize the monitor
    const monitor = new Monitor({
        onActive: (msg) => {
            ui.setStatus('active');

            // Try backup to Drive and save locally
            const text = ui.editor.value;
            storage.saveText(text);
            drive.saveDraft(text);

            const noiseMode = ui.selectNoiseMode.value || 'pink-brown';
            const activeNoise = noiseMode.split('-')[0]; // 'pink' or 'brown'

            const mode = ui.selectAudioMode.value;
            if (mode === 'noise' || mode === 'both') {
                audio.startNoise(activeNoise);
            }
            if (mode === 'tones' || mode === 'both') {
                audio.playActive(ui.selectActiveTone.value);
            }
            console.log(msg);
        },
        onIdle: (msg) => {
            ui.setStatus('idle');

            const noiseMode = ui.selectNoiseMode.value || 'pink-brown';
            const parts = noiseMode.split('-');
            const idleNoise = parts.length > 1 ? parts[1] : parts[0];
            // e.g. 'brown' or 'deep'

            const mode = ui.selectAudioMode.value;
            if (mode === 'noise' || mode === 'both') {
                audio.startNoise(idleNoise);
            }
            if (mode === 'tones' || mode === 'both') {
                audio.playIdle(ui.selectIdleTone.value);
            }
            console.log(msg);
        },
        onError: (msg) => {
            ui.setStatus('error');
            audio.playError();
            console.warn(msg);
        }
    });

    // Wire UI events
    ui.btnStart.addEventListener('click', () => {
        if (!monitor.isActive) {
            monitor.start();
            ui.btnStart.textContent = 'Stop Monitoring';
            ui.btnStart.classList.remove('primary');
            ui.btnStart.classList.add('danger');
        } else {
            monitor.stop();
            audio.stopNoise();
            ui.btnStart.textContent = 'Start Monitoring';
            ui.btnStart.classList.remove('danger');
            ui.btnStart.classList.add('primary');
            ui.setStatus('inactive');
        }
    });

    ui.editor.addEventListener('input', () => {
        let text = ui.editor.value;
        if (text.endsWith('jjj')) {
            text = text.slice(0, -3);
            ui.editor.value = text;
            ui.updateWordCount();

            drive.saveDraft(text).then((success) => {
                if (success) {
                    audio.playChime();
                    ui.setStatus('active');
                }
            });
        }

        monitor.registerKeypress();
        storage.saveText(text);
    });

    ui.volSlider.addEventListener('input', (e) => {
        audio.setVolume(e.target.value);
        storage.saveSettings({
            vol: ui.volSlider.value,
            audioMode: ui.selectAudioMode.value,
            noiseMode: ui.selectNoiseMode.value,
            activeTone: ui.selectActiveTone.value,
            idleTone: ui.selectIdleTone.value,
            autosaveInterval: ui.selectAutosaveInterval.value,
            autosaveChime: ui.selectAutosaveChime.value
        });
    });

    [ui.selectAudioMode, ui.selectNoiseMode, ui.selectActiveTone, ui.selectIdleTone, ui.selectAutosaveInterval, ui.selectAutosaveChime].forEach(el => {
        el.addEventListener('change', () => {
            if (ui.selectAudioMode.value === 'tones') {
                audio.stopNoise();
            }
            storage.saveSettings({
                vol: ui.volSlider.value,
                audioMode: ui.selectAudioMode.value,
                noiseMode: ui.selectNoiseMode.value,
                activeTone: ui.selectActiveTone.value,
                idleTone: ui.selectIdleTone.value,
                autosaveInterval: ui.selectAutosaveInterval.value,
                autosaveChime: ui.selectAutosaveChime.value
            });
        });
    });

    ui.btnTestActive.addEventListener('click', () => audio.playActive(ui.selectActiveTone.value));
    ui.btnTestIdle.addEventListener('click', () => audio.playIdle(ui.selectIdleTone.value));
    ui.btnTestError.addEventListener('click', () => audio.playError());

    // Drive events
    ui.btnAuth.addEventListener('click', () => drive.authorize());

    // Allow gapi to init
    setTimeout(() => {
        drive.init((isReady) => {
            if (isReady) {
                const driveStatus = document.getElementById('drive-status');
                driveStatus.textContent = 'Connected & Authenticated';
                driveStatus.style.color = '#22c55e';
            }
        });
    }, 1000); // Give CDN scripts a moment if loading async

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('SW registered!', reg))
                .catch(err => console.error('SW registration failed', err));
        });
    }

    // Auto-save to Drive loop (configurable interval)
    let lastSavedText = storage.loadText();
    let lastSaveTime = Date.now();
    
    setInterval(() => {
        const intervalMs = parseInt(ui.selectAutosaveInterval.value, 10);
        if (Date.now() - lastSaveTime >= intervalMs) {
            const currentText = ui.editor.value;
            if (currentText !== lastSavedText && currentText.trim().length > 0) {
                drive.saveDraft(currentText).then(success => {
                    if (success) {
                        lastSavedText = currentText;
                        lastSaveTime = Date.now();
                        if (ui.selectAutosaveChime.value === 'on') {
                            audio.playChime(); 
                        }
                        console.log('Autosaved to Drive.');
                    }
                });
            } else {
                lastSaveTime = Date.now();
            }
        }
    }, 5000); // Check every 5 seconds
});
