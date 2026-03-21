export class UI {
    constructor() {
        this.appContainer = document.getElementById('app-container');
        this.btnPrivacy = document.getElementById('btn-privacy');
        this.btnStopFloating = document.getElementById('btn-stop-floating');
        this.editor = document.getElementById('editor');
        this.wordCountDisplay = document.getElementById('word-count');

        // Status
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.sessionTimer = document.getElementById('session-timer');

        // Buttons
        this.btnStart = document.getElementById('btn-start');
        this.btnAuth = document.getElementById('btn-auth');
        this.btnMute = document.getElementById('btn-mute');
        this.btnDownload = document.getElementById('btn-download');
        this.btnToggleText = document.getElementById('btn-toggle-text');

        // Settings
        this.selectAudioMode = document.getElementById('select-audio-mode');
        this.selectNoiseType = document.getElementById('select-noise-type');
        this.selectActiveTone = document.getElementById('select-active-tone');
        this.selectIdleTone = document.getElementById('select-idle-tone');
        this.selectAutosaveInterval = document.getElementById('select-autosave-interval');
        this.selectAutosaveChime = document.getElementById('select-autosave-chime');
        this.volSlider = document.getElementById('vol-slider');
        this.wordGoalInput = document.getElementById('word-goal-input');

        // Test buttons
        this.btnTestActive = document.getElementById('btn-test-active');
        this.btnTestIdle = document.getElementById('btn-test-idle');
        this.btnTestError = document.getElementById('btn-test-error');

        // Word goal
        this.wordGoalBar = document.getElementById('word-goal-bar');
        this.goalBarFill = document.getElementById('goal-bar-fill');
        this.goalBarLabel = document.getElementById('goal-bar-label');

        // State
        this.textVisible = true;
        this._timerInterval = null;

        this.setupEventListeners();
        this.updateSoundSettingsVisibility();
    }

    setupEventListeners() {
        this.btnPrivacy.addEventListener('click', () => this.togglePrivacyMode(true));

        const handleStop = (e) => {
            e.preventDefault();
            this.togglePrivacyMode(false);
        };
        this.btnStopFloating.addEventListener('click', handleStop);
        this.btnStopFloating.addEventListener('touchstart', handleStop, { passive: false });

        this.editor.addEventListener('input', () => this.updateWordCount());
        this.btnToggleText.addEventListener('click', () => this.setTextVisible(!this.textVisible));
        this.selectAudioMode.addEventListener('change', () => this.updateSoundSettingsVisibility());

        // ESC exits privacy mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('privacy-mode')) {
                this.togglePrivacyMode(false);
            }
        });
    }

    updateSoundSettingsVisibility() {
        const mode = this.selectAudioMode.value;
        document.getElementById('noise-settings').classList.toggle('hidden', mode === 'silent' || mode === 'tones');
        document.getElementById('tone-settings').classList.toggle('hidden', mode === 'silent' || mode === 'noise');
    }

    togglePrivacyMode(enable) {
        if (enable) {
            document.body.classList.add('privacy-mode');
            this.btnStopFloating.classList.remove('hidden');
            this.editor.focus();
        } else {
            document.body.classList.remove('privacy-mode');
            this.btnStopFloating.classList.add('hidden');
            // Keep text hidden when exiting privacy mode
        }
    }

    setTextVisible(visible) {
        this.textVisible = visible;
        this.editor.classList.toggle('text-hidden', !visible);
        this.btnToggleText.textContent = visible ? 'Hide Text' : 'Show Text';
    }

    updateWordCount() {
        const text = this.editor.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        this.wordCountDisplay.textContent = `${words} words`;
        this.updateWordGoalProgress(words);
        return words;
    }

    updateWordGoalProgress(words) {
        const goal = parseInt(this.wordGoalInput.value, 10);
        if (!goal || goal <= 0) {
            this.wordGoalBar.classList.add('hidden');
            return;
        }
        this.wordGoalBar.classList.remove('hidden');
        const pct = Math.min(words / goal * 100, 100);
        this.goalBarFill.style.width = `${pct}%`;
        this.goalBarLabel.textContent = `${words}/${goal}`;
        const done = pct >= 100;
        this.goalBarFill.style.background = done ? 'var(--success)' : 'var(--accent)';
        this.goalBarFill.style.boxShadow = done ? '0 0 6px var(--success)' : '0 0 6px var(--accent)';
    }

    setStatus(state) {
        this.statusDot.className = `dot ${state}`;
        this.statusText.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    }

    startSessionTimer() {
        this.sessionStart = Date.now();
        this.sessionTimer.classList.remove('hidden');
        this._timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            this.sessionTimer.textContent = h > 0
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${m}:${String(s).padStart(2, '0')}`;
        }, 1000);
    }

    stopSessionTimer() {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
        this.sessionTimer.classList.add('hidden');
    }
}
