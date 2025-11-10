// Enhanced Sound Generation using BackRoom Instruments
// Converts Python instrument concepts to JavaScript Web Audio API

class EnhancedSoundGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.duration = 3.0; // Extended to 3 seconds as requested
    }

    // Create analog synthesizer sounds with rich harmonics
    createAnalogSound(frequency, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            
            // Main oscillator (sawtooth with harmonics)
            let sample = 0;
            const harmonics = Math.min(8, Math.floor(sampleRate / (2 * frequency)));
            
            for (let h = 1; h <= harmonics; h++) {
                sample += Math.sin(2 * Math.PI * frequency * h * t) / h;
            }
            sample *= 0.6;
            
            // LFO modulation for vibrato
            const lfo = Math.sin(2 * Math.PI * 5 * t) * 0.02;
            sample *= (1 + lfo);
            
            // Filter envelope - starts bright, gets warm
            const cutoffEnv = Math.exp(-t * 1.5);
            const lowpass = 0.3 + cutoffEnv * 0.7;
            sample *= lowpass;
            
            // Amplitude envelope
            const attack = Math.min(1, t * 50);
            const decay = Math.max(0.3, Math.exp(-t * 0.8));
            const envelope = attack * decay;
            
            data[i] = sample * envelope * 0.25;
        }
        
        return buffer;
    }

    // Create kick drum inspired percussion tones
    createPercussionTone(baseFreq, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            
            // Pitch envelope - starts high, drops to base
            const pitchEnv = baseFreq * (1 + 2 * Math.exp(-15 * t));
            
            // Main tone
            let sample = Math.sin(2 * Math.PI * pitchEnv * t / sampleRate * i);
            
            // Add punch harmonics
            sample += Math.sin(2 * Math.PI * pitchEnv * 2 * t / sampleRate * i) * 0.3 * Math.exp(-10 * t);
            sample += Math.sin(2 * Math.PI * pitchEnv * 3 * t / sampleRate * i) * 0.15 * Math.exp(-20 * t);
            
            // Amplitude envelope
            const envelope = Math.exp(-t * 1.2);
            
            data[i] = sample * envelope * 0.3;
        }
        
        return buffer;
    }

    // Create bell-like tones with inharmonic partials
    createBellTone(fundamental, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Bell frequency ratios (inharmonic)
        const ratios = [1.0, 2.76, 5.18, 8.23, 11.34];
        const amplitudes = [1.0, 0.6, 0.4, 0.25, 0.15];

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Sum inharmonic partials
            for (let p = 0; p < ratios.length; p++) {
                const freq = fundamental * ratios[p];
                const decay = Math.exp(-t * (0.8 + p * 0.3));
                sample += Math.sin(2 * Math.PI * freq * t) * amplitudes[p] * decay;
            }
            
            // Add slight detuning for richness
            const detune = Math.sin(2 * Math.PI * 3.1 * t) * 0.003;
            sample *= (1 + detune);
            
            data[i] = sample * 0.2;
        }
        
        return buffer;
    }

    // Create plucked string sounds
    createPluckedString(frequency, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Harmonic series with natural decay
            const harmonics = Math.min(12, Math.floor(sampleRate / (2 * frequency)));
            
            for (let h = 1; h <= harmonics; h++) {
                const amplitude = 1 / (h * h); // Natural harmonic decay
                const decay = Math.exp(-t * h * 0.5);
                sample += Math.sin(2 * Math.PI * frequency * h * t) * amplitude * decay;
            }
            
            // Pluck attack
            const attack = Math.exp(-t * 25);
            const sustain = Math.exp(-t * 0.7);
            const envelope = Math.max(attack * 0.7, sustain * 0.3);
            
            data[i] = sample * envelope * 0.2;
        }
        
        return buffer;
    }

    // Create wind/breath-like tones
    createBreathTone(frequency, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            
            // Base sine wave
            let sample = Math.sin(2 * Math.PI * frequency * t);
            
            // Add breathiness (filtered noise)
            const noise = (Math.random() - 0.5) * 0.1;
            const breathiness = noise * Math.exp(-Math.abs(t - duration/2) * 3);
            sample += breathiness;
            
            // Vibrato
            const vibrato = Math.sin(2 * Math.PI * 4.5 * t) * 0.02;
            sample *= (1 + vibrato);
            
            // Natural attack and decay
            const attack = Math.min(1, t * 8);
            const decay = Math.max(0.2, Math.exp(-Math.pow(t - duration * 0.3, 2) * 2));
            const envelope = attack * decay;
            
            data[i] = sample * envelope * 0.25;
        }
        
        return buffer;
    }

    // Create metallic/gong-like sounds
    createMetallicTone(fundamental, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Complex inharmonic partials typical of metal
            const partials = [
                {freq: fundamental, amp: 1.0, decay: 0.3},
                {freq: fundamental * 1.61, amp: 0.7, decay: 0.5},
                {freq: fundamental * 2.41, amp: 0.4, decay: 0.8},
                {freq: fundamental * 3.83, amp: 0.25, decay: 1.2},
                {freq: fundamental * 5.67, amp: 0.15, decay: 1.8}
            ];
            
            for (const partial of partials) {
                const envelope = Math.exp(-t * partial.decay);
                sample += Math.sin(2 * Math.PI * partial.freq * t) * partial.amp * envelope;
            }
            
            // Add shimmer (high frequency modulation)
            const shimmer = Math.sin(2 * Math.PI * fundamental * 8 * t) * 0.1 * Math.exp(-t * 5);
            sample += shimmer;
            
            data[i] = sample * 0.15;
        }
        
        return buffer;
    }

    // Create pad-like sustained tones
    createPadTone(frequency, duration = this.duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Multiple detuned oscillators for richness
            const detunes = [-0.05, 0, 0.03, 0.07];
            
            for (const detune of detunes) {
                const freq = frequency * (1 + detune);
                sample += Math.sin(2 * Math.PI * freq * t) * 0.25;
                
                // Add octave for fullness
                sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.1;
            }
            
            // Slow filter modulation
            const filterMod = Math.sin(2 * Math.PI * 0.3 * t) * 0.3 + 0.7;
            sample *= filterMod;
            
            // Gentle attack and sustain
            const attack = Math.min(1, t * 3);
            const sustain = Math.max(0.4, Math.exp(-t * 0.2));
            const envelope = attack * sustain;
            
            data[i] = sample * envelope * 0.2;
        }
        
        return buffer;
    }
}

// Enhanced Sound Manager that uses the new generator
class EnhancedSoundManager extends SoundManager {
    constructor(audioContext) {
        super(audioContext);
        this.enhancedGenerator = new EnhancedSoundGenerator(audioContext);
        this.initEnhancedSounds();
    }

    initEnhancedSounds() {
        // Replace default sounds with enhanced versions
        const enhancedPack = {
            name: 'Enhanced Dynamic Sounds',
            description: 'Rich, multi-dimensional audio designed for spatial navigation',
            sounds: {
                'analog_bass': this.enhancedGenerator.createAnalogSound(110), // A2
                'analog_mid': this.enhancedGenerator.createAnalogSound(220),  // A3
                'analog_high': this.enhancedGenerator.createAnalogSound(440), // A4
                'percussion_low': this.enhancedGenerator.createPercussionTone(80),
                'percussion_mid': this.enhancedGenerator.createPercussionTone(120),
                'bell_warm': this.enhancedGenerator.createBellTone(261.63), // C4
                'bell_bright': this.enhancedGenerator.createBellTone(523.25), // C5
                'plucked_string': this.enhancedGenerator.createPluckedString(329.63), // E4
                'breath_tone': this.enhancedGenerator.createBreathTone(392), // G4
                'metallic_shimmer': this.enhancedGenerator.createMetallicTone(174.61), // F3
                'pad_warm': this.enhancedGenerator.createPadTone(196) // G3
            }
        };

        this.soundPacks.set('enhanced', enhancedPack);
        this.setSoundPack('enhanced');
    }
}