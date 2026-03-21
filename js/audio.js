export class AudioController {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.volume = 0.5;
        this.muted = false;
        this.currentNoiseType = null;
        this.noiseSource = null;
        this.noiseGain = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : 1;
            this.masterGain.connect(this.audioCtx.destination);
        }
    }

    get destination() {
        if (!this.masterGain) this.init();
        return this.masterGain;
    }

    setVolume(val) {
        this.volume = parseFloat(val);
        if (this.noiseGain) {
            this.noiseGain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.05);
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.audioCtx.currentTime, 0.05);
        }
    }

    // --- HELPER ---
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
        gain.connect(this.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + attack + decay);
    }

    // --- ACTIVE TONES ---
    playHarp()      { this.playSynth('sine', 440, 0.05, 1.5, 2000); }
    playPiano()     { this.playSynth('triangle', 392, 0.01, 1.2, 1000); }
    playWoodblock() { this.playSynth('square', 800, 0.005, 0.1, 1500, 'linear'); }
    playMarimba()   { this.playSynth('sine', 523, 0.01, 0.3, 800); }
    playGuitar()    { this.playSynth('triangle', 330, 0.02, 1.0, 3000); }
    playBell()      { this.playSynth('sine', 1200, 0.01, 2.0); }
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
        const src = this.audioCtx.createBufferSource();
        src.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.destination);
        src.start();
    }

    // --- IDLE TONES ---
    playThunder() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
        const src = this.audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        filter.frequency.linearRampToValueAtTime(300, this.audioCtx.currentTime + 0.5);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 2.0);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 1.5, this.audioCtx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 2.0);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.destination);
        src.start();
    }

    playWind() {
        if (!this.audioCtx) this.init();
        const bufferSize = 3 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 1.5);
        filter.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 3.0);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.8, this.audioCtx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 3.0);
        src.connect(filter).connect(gain).connect(this.destination);
        src.start();
    }

    playPad()   { this.playSynth('sine', 220, 1.0, 2.0); this.playSynth('triangle', 330, 1.2, 1.8); }
    playOcean() { this.playWind(); }
    playGong()  {
        this.playSynth('sine', 150, 0.1, 3.0);
        this.playSynth('square', 150, 0.1, 1.0, 400);
        this.playSynth('triangle', 300, 0.1, 2.5);
    }
    playBass()  { this.playSynth('triangle', 110, 0.05, 1.0, 300); }
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
        osc.connect(gain).connect(this.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 2.0);
    }
    playDrone() { this.playSynth('sawtooth', 80, 2.0, 2.0, 200); }
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
        osc.connect(gain).connect(this.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    // --- AMBIENT NOISE ---
    createNoiseBuffer(type) {
        if (!this.audioCtx) this.init();
        const bufferSize = 3 * this.audioCtx.sampleRate;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0, lastOut=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'pink') {
                b0 = 0.99886*b0 + white*0.0555179;
                b1 = 0.99332*b1 + white*0.0750759;
                b2 = 0.96900*b2 + white*0.1538520;
                b3 = 0.86650*b3 + white*0.3104856;
                b4 = 0.55000*b4 + white*0.5329522;
                b5 = -0.7616*b5 - white*0.0168980;
                output[i] = (b0+b1+b2+b3+b4+b5+b6 + white*0.5362) * 0.11;
                b6 = white * 0.115926;
            } else if (type === 'brown') {
                output[i] = (lastOut + (0.02*white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            } else {
                output[i] = white; // white, rain, fan, fireplace all start from white
            }
        }
        return buffer;
    }

    startNoise(type) {
        if (this.currentNoiseType === type) return;
        this.stopNoise();
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const bufType = (type === 'rain' || type === 'fan' || type === 'white') ? 'white'
                      : (type === 'fireplace' || type === 'deep') ? 'brown'
                      : type; // pink, brown

        this.noiseSource = this.audioCtx.createBufferSource();
        this.noiseSource.buffer = this.createNoiseBuffer(bufType);
        this.noiseSource.loop = true;

        this.noiseGain = this.audioCtx.createGain();
        this.noiseGain.gain.value = this.volume;

        let chain = this.noiseSource;

        if (type === 'deep') {
            // Deep, rumbling brown noise
            const lp = this.audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 160;
            chain.connect(lp);
            chain = lp;
        } else if (type === 'rain') {
            // High-passed white noise for rain texture
            const hp = this.audioCtx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 1000;
            const lp = this.audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 12000;
            chain.connect(hp);
            hp.connect(lp);
            chain = lp;
        } else if (type === 'fan') {
            // Bandpass + gentle roll-off for a fan hum
            const bp = this.audioCtx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 800;
            bp.Q.value = 0.5;
            const lp = this.audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 3500;
            chain.connect(bp);
            bp.connect(lp);
            chain = lp;
        } else if (type === 'fireplace') {
            // Warm, muffled brown noise like a crackling fire
            const lp = this.audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 700;
            const hp = this.audioCtx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 60;
            chain.connect(hp);
            hp.connect(lp);
            chain = lp;
        }
        // pink, brown, white pass through with no extra filtering

        chain.connect(this.noiseGain);
        this.noiseGain.connect(this.destination);
        this.noiseSource.start();
        this.currentNoiseType = type;
    }

    stopNoise() {
        if (this.noiseSource) {
            try { this.noiseSource.stop(); } catch (e) {}
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
        this.playSynth('sine', 523.25, 0.05, 1.2, 2200); // C5
        setTimeout(() => this.playSynth('sine', 659.25, 0.05, 1.2, 2200), 120); // E5
        setTimeout(() => this.playSynth('sine', 783.99, 0.05, 1.6, 2200), 240); // G5
    }

    playActive(type = 'harp') {
        const map = {
            harp:       () => this.playHarp(),
            piano:      () => this.playPiano(),
            woodblock:  () => this.playWoodblock(),
            marimba:    () => this.playMarimba(),
            guitar:     () => this.playGuitar(),
            bell:       () => this.playBell(),
            synth:      () => this.playSynthBlip(),
            water:      () => this.playWater(),
            typewriter: () => this.playTypewriter(),
            shaker:     () => this.playShaker(),
        };
        (map[type] || map.harp)();
    }

    playIdle(type = 'thunder') {
        const map = {
            thunder: () => this.playThunder(),
            wind:    () => this.playWind(),
            pad:     () => this.playPad(),
            ocean:   () => this.playOcean(),
            gong:    () => this.playGong(),
            bass:    () => this.playBass(),
            riser:   () => this.playRiser(),
            drone:   () => this.playDrone(),
            didge:   () => this.playDidge(),
            thud:    () => this.playThud(),
        };
        (map[type] || map.thunder)();
    }

    playError() {
        this.playThunder();
        setTimeout(() => this.playThunder(), 500);
    }
}
