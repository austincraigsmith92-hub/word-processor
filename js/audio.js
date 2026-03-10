export class AudioController {
    constructor() {
        this.audioCtx = null;
        this.volume = 0.5;
        this.currentNoiseType = null;
        this.noiseSource = null;
        this.noiseGain = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    setVolume(val) {
        this.volume = parseFloat(val);
        if (this.noiseGain) {
            this.noiseGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
    }

    // --- HELPER FUNC ---
    playSynth(type, frequency, attack, decay, filterFreq = null, envelopeType = 'exponential') {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        let finalNode = osc;
        if (filterFreq) {
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterFreq, this.audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(Math.max(filterFreq / 4, 20), this.audioCtx.currentTime + decay);
            osc.connect(filter);
            finalNode = filter;
        }

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume, this.audioCtx.currentTime + attack);
        if (envelopeType === 'exponential') {
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + attack + decay);
        } else {
            gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + attack + decay);
        }

        finalNode.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + attack + decay);
    }

    // --- ACTIVE TONES (10) ---
    playHarp() { this.playSynth('sine', 440, 0.05, 1.5, 2000); }
    playPiano() { this.playSynth('triangle', 392, 0.01, 1.2, 1000); }
    playWoodblock() { this.playSynth('square', 800, 0.005, 0.1, 1500, 'linear'); }
    playMarimba() { this.playSynth('sine', 523, 0.01, 0.3, 800); }
    playGuitar() { this.playSynth('triangle', 330, 0.02, 1.0, 3000); }
    playBell() { this.playSynth('sine', 1200, 0.01, 2.0); }
    playSynthBlip() { this.playSynth('sawtooth', 600, 0.05, 0.2, 2000); }
    playWater() {
        this.playSynth('sine', 600, 0.01, 0.15);
        this.playSynth('sine', 800, 0.05, 0.1);
    }
    playTypewriter() { this.playSynth('square', 2000, 0.001, 0.05, 4000, 'linear'); }
    playShaker() {
        if (!this.audioCtx) this.init();
        const bufferSize = this.audioCtx.sampleRate * 0.1;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        noiseSource.start();
    }

    // --- IDLE TONES (10) ---
    playThunder() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        filter.frequency.linearRampToValueAtTime(300, this.audioCtx.currentTime + 0.5);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 2.0);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 1.5, this.audioCtx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 2.0);
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        noiseSource.start();
    }

    playWind() {
        if (!this.audioCtx) this.init();
        const bufferSize = 3 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 1.5);
        filter.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 3.0);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.8, this.audioCtx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 3.0);
        noiseSource.connect(filter).connect(gain).connect(this.audioCtx.destination);
        noiseSource.start();
    }

    playPad() {
        this.playSynth('sine', 220, 1.0, 2.0);
        this.playSynth('triangle', 330, 1.2, 1.8);
    }

    playOcean() {
        this.playWind(); // Reusing the wind filter sweep for a wave crash
    }

    playGong() {
        this.playSynth('sine', 150, 0.1, 3.0);
        this.playSynth('square', 150, 0.1, 1.0, 400);
        this.playSynth('triangle', 300, 0.1, 2.5);
    }

    playBass() {
        this.playSynth('triangle', 110, 0.05, 1.0, 300);
    }

    playRiser() {
        if (!this.audioCtx) this.init();
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 2.0);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume, this.audioCtx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 2.0);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 2.0);
    }

    playDrone() {
        this.playSynth('sawtooth', 80, 2.0, 2.0, 200);
    }

    playDidge() {
        this.playSynth('square', 65, 0.5, 2.0, 150);
        this.playSynth('triangle', 65, 0.5, 2.0, 300);
    }

    playThud() {
        if (!this.audioCtx) this.init();
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.3);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume, this.audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    createNoise(type) {
        if (!this.audioCtx) this.init();
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;

            if (type === 'pink') {
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            } else if (type === 'brown' || type === 'deep') {
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            } else {
                output[i] = white;
            }
        }
        return noiseBuffer;
    }

    startNoise(type) {
        if (this.currentNoiseType === type) return;
        this.stopNoise();

        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        this.noiseSource = this.audioCtx.createBufferSource();
        this.noiseSource.buffer = this.createNoise(type);
        this.noiseSource.loop = true;

        this.noiseGain = this.audioCtx.createGain();
        this.noiseGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

        let finalNode = this.noiseSource;

        // Deep brown adds a lowpass filter constraint
        if (type === 'deep') {
            const lowpass = this.audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 200; // heavily muffle the brown noise
            finalNode.connect(lowpass);
            finalNode = lowpass;
        }

        finalNode.connect(this.noiseGain);
        this.noiseGain.connect(this.audioCtx.destination);
        this.noiseSource.start();
        this.currentNoiseType = type;
    }

    stopNoise() {
        if (this.noiseSource) {
            this.noiseSource.stop();
            this.noiseSource.disconnect();
            this.noiseSource = null;
        }
        if (this.noiseGain) {
            this.noiseGain.disconnect();
            this.noiseGain = null;
        }
        this.currentNoiseType = null;
    }

    playChime() {
        this.playHarp();
        setTimeout(() => this.playSynth('sine', 659.25, 0.05, 1.5, 2000), 150); // E5
        setTimeout(() => this.playSynth('sine', 783.99, 0.05, 1.5, 2000), 300); // G5
    }

    playActive(type = 'harp') {
        switch (type) {
            case 'harp': this.playHarp(); break;
            case 'piano': this.playPiano(); break;
            case 'woodblock': this.playWoodblock(); break;
            case 'marimba': this.playMarimba(); break;
            case 'guitar': this.playGuitar(); break;
            case 'bell': this.playBell(); break;
            case 'synth': this.playSynthBlip(); break;
            case 'water': this.playWater(); break;
            case 'typewriter': this.playTypewriter(); break;
            case 'shaker': this.playShaker(); break;
            default: this.playHarp();
        }
    }

    playIdle(type = 'thunder') {
        switch (type) {
            case 'thunder': this.playThunder(); break;
            case 'wind': this.playWind(); break;
            case 'pad': this.playPad(); break;
            case 'ocean': this.playOcean(); break;
            case 'gong': this.playGong(); break;
            case 'bass': this.playBass(); break;
            case 'riser': this.playRiser(); break;
            case 'drone': this.playDrone(); break;
            case 'didge': this.playDidge(); break;
            case 'thud': this.playThud(); break;
            default: this.playThunder();
        }
    }

    playError() {
        this.playThunder();
        setTimeout(() => this.playThunder(), 400);
    }
}
