class SpatialAudioEngine {
    constructor() {
        this.audioContext = null;
        this.listener = { x: 0, y: 0, z: 0 };
        this.sources = [];
        this.currentSource = null;
        this.isPlaying = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context on user interaction if needed
            if (this.audioContext.state === 'suspended') {
                // Don't await here, let it resume when user interacts
                document.addEventListener('click', async () => {
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                        console.log('AudioContext resumed after user interaction');
                    }
                }, { once: true });
                
                document.addEventListener('keydown', async () => {
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                        console.log('AudioContext resumed after user interaction');
                    }
                }, { once: true });
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            this.initialized = false;
            return false;
        }
    }

    async loadSound(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }

    createSource(audioBuffer, position = { x: 0, y: 0, z: 0 }) {
        const source = {
            buffer: audioBuffer,
            position: position,
            node: null,
            panner: null
        };
        
        this.sources.push(source);
        return source;
    }

    playSource(source, duration = null) {
        if (!source || !this.audioContext) return;
        
        // Stop any currently playing source
        this.stopCurrentSource();
        
        // Create new audio nodes
        const bufferSource = this.audioContext.createBufferSource();
        bufferSource.buffer = source.buffer;
        
        // Create panner for 3D positioning
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        // Set position
        this.updateSourcePosition(panner, source.position);
        
        // Connect nodes
        bufferSource.connect(panner);
        panner.connect(this.audioContext.destination);
        
        // Store references
        source.node = bufferSource;
        source.panner = panner;
        this.currentSource = source;
        
        // Start playback
        if (duration) {
            bufferSource.start(0, 0, duration);
            // Set flag to false after duration
            setTimeout(() => {
                this.isPlaying = false;
            }, duration * 1000);
        } else {
            bufferSource.start(0);
        }
        
        this.isPlaying = true;
        
        // Handle end of playback
        bufferSource.onended = () => {
            this.isPlaying = false;
            this.currentSource = null;
        };
    }

    stopCurrentSource() {
        if (this.currentSource && this.currentSource.node) {
            try {
                this.currentSource.node.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentSource.node = null;
            this.currentSource.panner = null;
            this.currentSource = null;
            this.isPlaying = false;
        }
    }

    updateListenerPosition(position) {
        this.listener = { ...position };

        // Update all active source positions relative to listener
        if (this.currentSource && this.currentSource.panner) {
            this.updateSourcePosition(this.currentSource.panner, this.currentSource.position);
        }
    }

    updateListenerOrientation(yaw = 0, pitch = 0) {
        if (!this.audioContext || !this.audioContext.listener) return;

        // Convert yaw (horizontal rotation, degrees) and pitch (vertical rotation, degrees) to radians
        const yawRad = yaw * (Math.PI / 180);
        const pitchRad = pitch * (Math.PI / 180);

        // Calculate forward vector based on yaw and pitch
        // In Web Audio: +X is right, +Y is up, +Z is backwards (towards listener)
        // We want 0° yaw = looking forward (-Z direction in Web Audio)
        const forwardX = Math.sin(yawRad) * Math.cos(pitchRad);
        const forwardY = Math.sin(pitchRad);
        const forwardZ = -Math.cos(yawRad) * Math.cos(pitchRad);

        // Up vector (slightly affected by pitch, but generally pointing up)
        const upX = 0;
        const upY = 1;
        const upZ = 0;

        // Use modern API if available
        if (this.audioContext.listener.forwardX) {
            this.audioContext.listener.forwardX.value = forwardX;
            this.audioContext.listener.forwardY.value = forwardY;
            this.audioContext.listener.forwardZ.value = forwardZ;
            this.audioContext.listener.upX.value = upX;
            this.audioContext.listener.upY.value = upY;
            this.audioContext.listener.upZ.value = upZ;
        } else if (this.audioContext.listener.setOrientation) {
            // Fallback to deprecated API
            this.audioContext.listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
        }
    }

    updateSourcePosition(panner, sourcePosition) {
        // Calculate relative position from listener
        const relativeX = sourcePosition.x - this.listener.x;
        const relativeY = sourcePosition.y - this.listener.y;
        const relativeZ = sourcePosition.z - this.listener.z;
        
        if (panner.positionX) {
            // Use new API if available
            panner.positionX.value = relativeX;
            panner.positionY.value = relativeY;
            panner.positionZ.value = relativeZ;
        } else {
            // Fallback to old API
            panner.setPosition(relativeX, relativeY, relativeZ);
        }
    }

    getDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    getDistanceToCurrentSource() {
        if (!this.currentSource) return Infinity;
        return this.getDistance(this.listener, this.currentSource.position);
    }

    // Get angle to source in degrees (0-360)
    getAngleToSource(source) {
        if (!source) return 0;
        
        const dx = source.position.x - this.listener.x;
        const dz = source.position.z - this.listener.z;
        
        let angle = Math.atan2(dx, dz) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        
        return angle;
    }

    // Get elevation angle to source in degrees (-90 to 90)
    getElevationToSource(source) {
        if (!source) return 0;
        
        const dx = source.position.x - this.listener.x;
        const dy = source.position.y - this.listener.y;
        const dz = source.position.z - this.listener.z;
        
        const horizontalDist = Math.sqrt(dx * dx + dz * dz);
        const elevation = Math.atan2(dy, horizontalDist) * (180 / Math.PI);
        
        return elevation;
    }

    // Create a test tone for calibration
    createTestTone(frequency = 440, duration = 1) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
        }
        
        return buffer;
    }

    // Create white noise for wind/ambient effects
    createWhiteNoise(duration = 1) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        return buffer;
    }

    // Create a click sound for UI feedback
    createClick() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 0.01; // 10ms
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            data[i] = Math.sin(2 * Math.PI * 1000 * i / sampleRate) * 
                     Math.exp(-i / (length * 0.1));
        }
        
        return buffer;
    }

    // Play a simple UI sound
    playUISound(buffer, volume = 0.5) {
        if (!this.audioContext || !buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = volume;
        
        source.connect(gain);
        gain.connect(this.audioContext.destination);
        
        source.start(0);
    }
}