export class UI {
    constructor() {
        this.appContainer = document.getElementById('app-container');
        this.btnPrivacy = document.getElementById('btn-privacy');
        this.btnStopFloating = document.getElementById('btn-stop-floating');
        this.editor = document.getElementById('editor');
        this.wordCountDisplay = document.getElementById('word-count');

        // Status indicator
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');

        // Buttons
        this.btnStart = document.getElementById('btn-start');
        this.btnAuth = document.getElementById('btn-auth');

        // Settings
        this.selectAudioMode = document.getElementById('select-audio-mode');
        this.selectNoiseMode = document.getElementById('select-noise-mode');
        this.selectActiveTone = document.getElementById('select-active-tone');
        this.selectIdleTone = document.getElementById('select-idle-tone');
        this.volSlider = document.getElementById('vol-slider');

        // Test Buttons
        this.btnTestActive = document.getElementById('btn-test-active');
        this.btnTestIdle = document.getElementById('btn-test-idle');
        this.btnTestError = document.getElementById('btn-test-error');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.btnPrivacy.addEventListener('click', () => this.togglePrivacyMode(true));
        const handleStop = (e) => {
            e.preventDefault();
            this.togglePrivacyMode(false);
        };
        this.btnStopFloating.addEventListener('click', handleStop);
        this.btnStopFloating.addEventListener('touchstart', handleStop, {passive: false});

        this.editor.addEventListener('input', () => this.updateWordCount());
    }

    togglePrivacyMode(enable) {
        if (enable) {
            document.body.classList.add('privacy-mode');
            this.btnStopFloating.classList.remove('hidden');
            this.editor.focus();
        } else {
            document.body.classList.remove('privacy-mode');
            this.btnStopFloating.classList.add('hidden');
        }
    }

    updateWordCount() {
        const text = this.editor.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        this.wordCountDisplay.textContent = `${words} words`;
    }

    setStatus(state) {
        // state: 'inactive', 'active', 'idle', 'error'
        this.statusDot.className = `dot ${state}`;
        this.statusText.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    }
}
