// Sound Manager - Handles custom audio loading and sound packs
class SoundManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.sounds = new Map();
        this.soundPacks = new Map();
        this.currentPack = 'default';
        
        // Initialize with default procedural sounds
        this.initDefaultSounds();
    }
    
    initDefaultSounds() {
        // Create default sound pack with procedural audio
        const defaultPack = {
            name: 'Default Tones',
            description: 'Pure sine wave tones',
            sounds: {
                'tone_low': this.createTone(220, 2),
                'tone_mid': this.createTone(440, 2),
                'tone_high': this.createTone(880, 2),
                'chime': this.createChime(2),
                'bell': this.createBell(2),
                'ping': this.createPing(2),
                'whistle': this.createWhistle(2),
                'gong': this.createGong(2),
                'harp': this.createHarp(2)
            }
        };
        
        this.soundPacks.set('default', defaultPack);
        this.setSoundPack('default');
    }
    
    createTone(frequency, duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.min(1, Math.min(t * 10, (duration - t) * 10)) * 0.3;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
        }
        
        return buffer;
    }
    
    createChime(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 2) * 0.25;
                let sample = 0;
                
                frequencies.forEach((freq, index) => {
                    const phase = channel * 0.01 * index; // Slight stereo spread
                    sample += Math.sin(2 * Math.PI * freq * (t + phase));
                });
                
                data[i] = sample * envelope / frequencies.length;
            }
        }
        
        return buffer;
    }
    
    createBell(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Bell harmonics with inharmonic partials
        const partials = [
            { freq: 261.63, amp: 1.0 },    // Fundamental
            { freq: 524.32, amp: 0.7 },    // Octave
            { freq: 786.48, amp: 0.5 },    // Fifth
            { freq: 1051.2, amp: 0.3 },    // Slightly sharp
            { freq: 1574.8, amp: 0.2 }     // Inharmonic
        ];
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5) * 0.3;
            let sample = 0;
            
            partials.forEach(partial => {
                sample += Math.sin(2 * Math.PI * partial.freq * t) * partial.amp;
            });
            
            data[i] = sample * envelope / partials.length;
        }
        
        return buffer;
    }
    
    createPing(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8) * 0.4;
            const freq = 1000 * Math.exp(-t * 0.5); // Pitch bend down
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
        }
        
        return buffer;
    }
    
    createWhistle(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.min(1, Math.min(t * 5, (duration - t) * 5)) * 0.25;
            // Whistle with slight vibrato
            const vibrato = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
            const freq = 800 * vibrato;
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
        }
        
        return buffer;
    }
    
    createGong(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        // Complex gong spectrum
        const partials = [
            { freq: 82.41, amp: 1.0 },     // Low E
            { freq: 123.47, amp: 0.8 },    // B
            { freq: 164.81, amp: 0.6 },    // E
            { freq: 207.65, amp: 0.5 },    // Ab
            { freq: 246.94, amp: 0.4 },    // B
            { freq: 293.66, amp: 0.3 },    // D
            { freq: 329.63, amp: 0.25 },   // E
            { freq: 392.00, amp: 0.2 }     // G
        ];
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 0.5) * 0.2;
                const shimmer = 1 + Math.sin(2 * Math.PI * 0.5 * t) * 0.1;
                let sample = 0;
                
                partials.forEach((partial, index) => {
                    const phase = channel * 0.05 * index;
                    sample += Math.sin(2 * Math.PI * partial.freq * shimmer * (t + phase)) * partial.amp;
                });
                
                data[i] = sample * envelope / partials.length;
            }
        }
        
        return buffer;
    }
    
    createHarp(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        // Harp glissando effect
        const baseFreq = 261.63; // C4
        const notes = [1, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2]; // Major scale ratios
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const noteIndex = Math.floor(t * 8) % notes.length;
                const freq = baseFreq * notes[noteIndex];
                const envelope = Math.exp(-(t % 0.25) * 8) * 0.2;
                
                data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
            }
        }
        
        return buffer;
    }
    
    async loadSoundPack(name, urls) {
        const pack = {
            name: name,
            description: '',
            sounds: {}
        };
        
        for (const [soundName, url] of Object.entries(urls)) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                pack.sounds[soundName] = audioBuffer;
            } catch (error) {
                console.error(`Failed to load ${soundName} from ${url}:`, error);
                // Fall back to default tone
                pack.sounds[soundName] = this.createTone(440, 2);
            }
        }
        
        this.soundPacks.set(name, pack);
        return pack;
    }
    
    async loadCustomSound(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    // Trim or loop to 2 seconds
                    const targetDuration = 2;
                    const targetLength = this.audioContext.sampleRate * targetDuration;
                    
                    if (audioBuffer.duration > targetDuration) {
                        // Trim to 2 seconds
                        const trimmedBuffer = this.audioContext.createBuffer(
                            audioBuffer.numberOfChannels,
                            targetLength,
                            audioBuffer.sampleRate
                        );
                        
                        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                            const sourceData = audioBuffer.getChannelData(channel);
                            const targetData = trimmedBuffer.getChannelData(channel);
                            for (let i = 0; i < targetLength; i++) {
                                targetData[i] = sourceData[i];
                            }
                        }
                        
                        resolve(trimmedBuffer);
                    } else if (audioBuffer.duration < targetDuration) {
                        // Loop to fill 2 seconds
                        const loopedBuffer = this.audioContext.createBuffer(
                            audioBuffer.numberOfChannels,
                            targetLength,
                            audioBuffer.sampleRate
                        );
                        
                        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                            const sourceData = audioBuffer.getChannelData(channel);
                            const targetData = loopedBuffer.getChannelData(channel);
                            const sourceLength = sourceData.length;
                            
                            for (let i = 0; i < targetLength; i++) {
                                targetData[i] = sourceData[i % sourceLength];
                            }
                        }
                        
                        resolve(loopedBuffer);
                    } else {
                        resolve(audioBuffer);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    setSoundPack(packName) {
        const pack = this.soundPacks.get(packName);
        if (pack) {
            this.currentPack = packName;
            this.sounds.clear();
            for (const [name, buffer] of Object.entries(pack.sounds)) {
                this.sounds.set(name, buffer);
            }
            return true;
        }
        return false;
    }
    
    getSound(name) {
        return this.sounds.get(name) || this.sounds.get('tone_mid');
    }
    
    getRandomSound() {
        const soundArray = Array.from(this.sounds.values());
        return soundArray[Math.floor(Math.random() * soundArray.length)];
    }
    
    getSoundList() {
        return Array.from(this.sounds.keys());
    }
    
    getPackList() {
        return Array.from(this.soundPacks.keys());
    }
}