// SHAC Golf - Main Game Logic

// Mobile Detection and Warning
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
           window.innerWidth < 1024;
}

// Show appropriate screen on load
document.addEventListener('DOMContentLoaded', function() {
    if (isMobileDevice()) {
        document.getElementById('mobile-warning').classList.add('active');
        document.getElementById('menu-screen').classList.remove('active');

        // Allow bypass for persistent users
        document.getElementById('continue-anyway').addEventListener('click', function() {
            document.getElementById('mobile-warning').classList.remove('active');
            document.getElementById('menu-screen').classList.add('active');
        });
    } else {
        document.getElementById('menu-screen').classList.add('active');
    }
});

class Game {
    constructor() {
        this.audioEngine = new SpatialAudioEngine();
        this.soundManager = null;
        this.visualization = null;
        this.settings = new Settings();
        this.timeTrial = null;
        this.hudSystem = null;
        this.leaderboard = null;
        this.windowManager = null;
        this.state = 'menu'; // menu, playing, paused, complete
        this.currentCourse = null;
        this.currentHole = 0;
        this.strokes = 0;
        this.totalStrokes = 0;
        this.score = 0;
        this.scores = [];
        
        // Player position and facing
        this.player = { x: 0, y: 0, z: 0 };
        this.playerFacing = 0; // Direction player is facing in degrees (0 = north)
        this.lastMovement = { x: 0, z: 0 }; // Track last movement for facing direction
        this.moveSpeed = this.settings.get('moveSpeed');
        this.fastMoveSpeed = this.moveSpeed * this.settings.get('fastMoveMultiplier');
        
        // Audio settings
        this.clipDuration = this.settings.get('clipDuration');
        this.holeRadius = this.settings.get('holeRadius');
        
        // Input state
        this.keys = {};
        this.gamepadIndex = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize audio
            const audioInitialized = await this.audioEngine.init();
            if (!audioInitialized) {
                console.warn('Audio initialization pending user interaction');
            }
            
            // Initialize enhanced sound manager
            this.soundManager = new EnhancedSoundManager(this.audioEngine.audioContext);
            
            // Initialize time trial
            this.timeTrial = new TimeTrial(this);
            
            // Initialize HUD system
            this.hudSystem = new HUDSystem(this);
            
            // Initialize leaderboard
            this.leaderboard = new LeaderboardSystem();
            
            // Initialize window manager
            this.windowManager = new WindowManager(this);
            
            // Setup visualization
            const canvas = document.getElementById('visualization');
            if (canvas) {
                this.visualization = new Visualization(canvas);
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup settings callbacks
            this.setupSettingsCallbacks();
            
            // Hide loading
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // Still hide loading screen
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }
        }
    }
    
    setupSettingsCallbacks() {
        // Audio settings
        this.settings.onChange('masterVolume', (value) => {
            // Will apply to gain nodes when we add them
        });
        
        this.settings.onChange('soundPack', (value) => {
            this.soundManager.setSoundPack(value);
        });
        
        // Control settings
        this.settings.onChange('moveSpeed', (value) => {
            this.moveSpeed = value;
            this.fastMoveSpeed = value * this.settings.get('fastMoveMultiplier');
        });
        
        this.settings.onChange('fastMoveMultiplier', (value) => {
            this.fastMoveSpeed = this.moveSpeed * value;
        });
        
        // Gameplay settings
        this.settings.onChange('holeRadius', (value) => {
            this.holeRadius = value;
        });
        
        this.settings.onChange('clipDuration', (value) => {
            this.clipDuration = value;
        });
        
        // Visual settings
        this.settings.onChange('showVisualization', (value) => {
            if (value && this.state === 'playing') {
                this.visualization.visible = true;
                this.visualization.canvas.classList.add('visible');
            }
        });
    }
    
    createChimeSound() {
        const sampleRate = this.audioEngine.audioContext.sampleRate;
        const duration = this.clipDuration;
        const length = sampleRate * duration;
        const buffer = this.audioEngine.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            const freq = 523.25 * (channel + 1); // C5 and C6
            
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 2) * 0.3;
                data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
            }
        }
        
        return buffer;
    }
    
    createBellSound() {
        const sampleRate = this.audioEngine.audioContext.sampleRate;
        const duration = this.clipDuration;
        const length = sampleRate * duration;
        const buffer = this.audioEngine.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Bell harmonics
        const fundamentals = [261.63, 523.25, 784.88]; // C4, C5, G5
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5) * 0.2;
            let sample = 0;
            
            for (const freq of fundamentals) {
                sample += Math.sin(2 * Math.PI * freq * t);
            }
            
            data[i] = sample * envelope / fundamentals.length;
        }
        
        return buffer;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Gamepad support
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log('Gamepad connected:', e.gamepad.id);
        });
        
        window.addEventListener('gamepaddisconnected', () => {
            this.gamepadIndex = null;
        });
        
        // UI buttons
        document.getElementById('start-golf').addEventListener('click', () => this.showCourseSelect('golf'));
        document.getElementById('start-timetrial').addEventListener('click', () => this.startTimeTrial());
        // document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        // document.getElementById('tutorial-btn').addEventListener('click', () => this.showTutorial());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('swing-btn').addEventListener('click', () => this.swing());
        // toggle-visual is added dynamically in time trial mode
        const toggleVisualBtn = document.getElementById('toggle-visual');
        if (toggleVisualBtn) {
            toggleVisualBtn.addEventListener('click', () => this.toggleVisualization());
        }
        document.getElementById('next-hole-btn').addEventListener('click', () => this.nextHole());
        document.getElementById('restart-course').addEventListener('click', () => this.restartCourse());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('course-complete-menu-btn').addEventListener('click', () => this.returnToMenu());
        
        // Animation loop for gamepad
        this.updateGamepad();
        
        // Setup HUD mode switching (will be added when HUD is created)
        this.setupHUDEventListeners();
    }
    
    setupHUDEventListeners() {
        // This will be called again when HUD is created in-game
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                const mode = e.target.dataset.mode;
                if (mode && this.hudSystem) {
                    // Remove active class from all buttons
                    document.querySelectorAll('.mode-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Set the new mode
                    this.hudSystem.setMode(mode);
                }
            }
        });
    }
    
    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        if (this.state !== 'playing') return;
        
        const shift = e.shiftKey;
        const speed = shift ? this.fastMoveSpeed : this.moveSpeed;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.movePlayer(0, 0, speed);
                break;
            case 's':
            case 'arrowdown':
                this.movePlayer(0, 0, -speed);
                break;
            case 'a':
            case 'arrowleft':
                this.movePlayer(-speed, 0, 0);
                break;
            case 'd':
            case 'arrowright':
                this.movePlayer(speed, 0, 0);
                break;
            case 'q':
                this.movePlayer(0, speed, 0);
                break;
            case 'e':
                this.movePlayer(0, -speed, 0);
                break;
            case ' ':
            case 'enter':
                this.swing();
                e.preventDefault();
                break;
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    updateGamepad() {
        if (this.gamepadIndex !== null && this.state === 'playing') {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                // Left stick for movement
                const deadzone = 0.15;
                const lx = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
                const ly = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
                
                if (lx || ly) {
                    this.movePlayer(lx * this.moveSpeed, 0, -ly * this.moveSpeed);
                }
                
                // Right stick for elevation
                const ry = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;
                if (ry) {
                    this.movePlayer(0, -ry * this.moveSpeed, 0);
                }
                
                // A button (0) for swing
                if (gamepad.buttons[0].pressed && !this.gamepadButtonPressed) {
                    this.swing();
                    this.gamepadButtonPressed = true;
                } else if (!gamepad.buttons[0].pressed) {
                    this.gamepadButtonPressed = false;
                }
            }
        }
        
        requestAnimationFrame(() => this.updateGamepad());
    }
    
    movePlayer(dx, dy, dz) {
        this.player.x += dx;
        this.player.y += dy;
        this.player.z += dz;
        
        // Track movement direction for compass orientation
        if (dx !== 0 || dz !== 0) {
            this.lastMovement.x = dx;
            this.lastMovement.z = dz;
            // Calculate facing direction based on movement
            // 0° = north (positive z), 90° = east (positive x), 180° = south, 270° = west
            this.playerFacing = Math.atan2(dx, dz) * (180 / Math.PI);
            if (this.playerFacing < 0) this.playerFacing += 360;
        }
        
        // Update audio listener position
        this.audioEngine.updateListenerPosition(this.player);
        
        // Update visualization
        this.updateDisplay();
        
        // Add to trail
        this.visualization.addToTrail(this.player);
    }
    
    swing() {
        if (this.state !== 'playing') return;
        if (this.audioEngine.isPlaying) return;
        
        this.strokes++;
        this.totalStrokes++;
        
        // Play the hole's sound for 2 seconds
        const hole = this.currentCourse.holes[this.currentHole];
        
        this.audioEngine.playSource(
            this.audioEngine.currentSource || this.createHoleSource(hole),
            this.clipDuration
        );
        
        // Check if player is within hole radius
        const distance = this.audioEngine.getDistanceToCurrentSource();
        if (distance <= this.holeRadius) {
            setTimeout(() => this.completeHole(), this.clipDuration * 1000);
        }
        
        // UI feedback
        const clickSound = this.audioEngine.createClick();
        this.audioEngine.playUISound(clickSound, 0.3);
        
        this.updateDisplay();
    }
    
    createHoleSource(hole) {
        // Use different sounds based on hole number for variety
        const soundNames = this.soundManager.getSoundList();
        const soundIndex = (hole.number - 1) % soundNames.length;
        const soundBuffer = this.soundManager.getSound(soundNames[soundIndex]);
        
        return this.audioEngine.createSource(soundBuffer, hole.target);
    }
    
    completeHole() {
        const hole = this.currentCourse.holes[this.currentHole];
        const holeScore = this.strokes - hole.par;
        
        this.scores.push({
            hole: hole.number,
            strokes: this.strokes,
            par: hole.par,
            score: holeScore
        });
        
        this.score += holeScore;
        
        // Show completion overlay
        document.getElementById('final-strokes').textContent = this.strokes;
        document.getElementById('final-par').textContent = hole.par;
        document.getElementById('hole-score').textContent = holeScore >= 0 ? `+${holeScore}` : holeScore;
        document.getElementById('hole-complete').classList.remove('hidden');
        
        this.state = 'paused';
    }
    
    nextHole() {
        this.currentHole++;
        
        if (this.currentHole >= this.currentCourse.holes.length) {
            this.completeCourse();
        } else {
            document.getElementById('hole-complete').classList.add('hidden');
            this.startHole();
        }
    }
    
    completeCourse() {
        this.totalStrokes = this.scores.reduce((sum, s) => sum + s.strokes, 0);
        
        // Save score to leaderboard
        const leaderboardType = this.hudSystem.getLeaderboardType();
        if (leaderboardType) {
            this.leaderboard.addScore(this.currentCourse.name, leaderboardType, {
                strokes: this.totalStrokes,
                score: this.score,
                date: new Date().toISOString(),
                holes: this.scores
            });
        }
        
        // Show completion screen
        document.getElementById('final-score').textContent = this.score >= 0 ? `+${this.score}` : this.score;
        document.getElementById('total-strokes').textContent = this.totalStrokes;
        
        // Build scorecard
        const scorecard = document.getElementById('scorecard');
        scorecard.innerHTML = '<h3>Scorecard</h3>';
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Hole</th>
                <th>Par</th>
                <th>Strokes</th>
                <th>Score</th>
            </tr>
        `;
        
        this.scores.forEach(s => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${s.hole}</td>
                <td>${s.par}</td>
                <td>${s.strokes}</td>
                <td>${s.score >= 0 ? '+' + s.score : s.score}</td>
            `;
        });
        
        scorecard.appendChild(table);
        document.getElementById('course-complete').classList.remove('hidden');
        
        this.state = 'complete';
    }
    
    returnToMenu() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
        
        // Show menu
        document.getElementById('menu-screen').classList.add('active');
        
        // Reset state
        this.state = 'menu';
        this.audioEngine.stopCurrentSource();
        
        // Close any open windows
        if (this.windowManager) {
            this.windowManager.closeAll();
        }
    }
    
    toggleVisualization() {
        const showViz = !this.visualization.visible;
        this.visualization.visible = showViz;
        
        if (showViz) {
            this.visualization.canvas.classList.add('visible');
            document.getElementById('toggle-visual').textContent = 'Hide Map';
        } else {
            this.visualization.canvas.classList.remove('visible');
            document.getElementById('toggle-visual').textContent = 'Show Map';
        }
        
        this.settings.set('showVisualization', showViz);
    }
    
    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.audioEngine.stopCurrentSource();
        }
    }
    
    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
        }
    }
}