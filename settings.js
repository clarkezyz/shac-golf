// Settings and Customization System
class Settings {
    constructor() {
        this.defaults = {
            // Audio
            masterVolume: 0.8,
            soundPack: 'enhanced',
            customSounds: {},
            
            // Controls
            moveSpeed: 0.5,
            fastMoveMultiplier: 4,
            mouseSensitivity: 1,
            gamepadDeadzone: 0.15,
            invertY: false,
            
            // Visual
            showVisualization: false,
            visualizationOpacity: 0.8,
            showTrail: true,
            showDistance: true,
            colorScheme: 'swimming_pool',
            showElevationColors: true,
            
            // Gameplay
            difficulty: 'medium',
            holeRadius: 1.0,
            clipDuration: 3.0,
            autoPlaySound: true,
            hapticFeedback: true,
            soundPreview: true,
            compassIndicator: false,
            
            // Accessibility
            visualIndicators: false,
            highContrast: false,
            largerText: false,
            reducedMotion: false,
            enhancedSounds: true
        };
        
        this.current = this.load();
        this.callbacks = new Map();
    }
    
    load() {
        const saved = localStorage.getItem('shacgolf_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...this.defaults, ...parsed };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
        return { ...this.defaults };
    }
    
    save() {
        try {
            localStorage.setItem('shacgolf_settings', JSON.stringify(this.current));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }
    
    get(key) {
        return this.current[key] ?? this.defaults[key];
    }
    
    set(key, value) {
        const oldValue = this.current[key];
        this.current[key] = value;
        
        // Trigger callbacks
        if (this.callbacks.has(key)) {
            this.callbacks.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }
        
        this.save();
        return true;
    }
    
    reset() {
        this.current = { ...this.defaults };
        this.save();
        this.applyAll();
    }
    
    onChange(key, callback) {
        if (!this.callbacks.has(key)) {
            this.callbacks.set(key, []);
        }
        this.callbacks.get(key).push(callback);
    }
    
    applyAll() {
        // Apply all settings to game
        Object.keys(this.current).forEach(key => {
            if (this.callbacks.has(key)) {
                this.callbacks.get(key).forEach(callback => {
                    callback(this.current[key], this.current[key]);
                });
            }
        });
    }
    
    createUI() {
        const container = document.createElement('div');
        container.id = 'settings-panel';
        container.className = 'settings-panel';
        container.innerHTML = `
            <h2>Settings</h2>
            
            <div class="settings-tabs">
                <button class="tab-btn active" data-tab="audio">Audio</button>
                <button class="tab-btn" data-tab="controls">Controls</button>
                <button class="tab-btn" data-tab="visual">Visual</button>
                <button class="tab-btn" data-tab="gameplay">Gameplay</button>
                <button class="tab-btn" data-tab="accessibility">Accessibility</button>
            </div>
            
            <div class="settings-content">
                <!-- Audio Tab -->
                <div class="tab-content active" id="audio-tab">
                    <div class="setting-group">
                        <label>Master Volume</label>
                        <input type="range" id="master-volume" min="0" max="100" value="${this.get('masterVolume') * 100}">
                        <span class="value-display">${Math.round(this.get('masterVolume') * 100)}%</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>Sound Pack</label>
                        <select id="sound-pack">
                            <option value="enhanced" ${this.get('soundPack') === 'enhanced' ? 'selected' : ''}>Enhanced Dynamic Sounds (Recommended)</option>
                            <option value="default" ${this.get('soundPack') === 'default' ? 'selected' : ''}>Simple Tones</option>
                            <option value="custom" ${this.get('soundPack') === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                        <small>Enhanced sounds use rich harmonics for better spatial navigation and accessibility</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>Sound Duration</label>
                        <input type="range" id="clip-duration" min="1" max="5" step="0.5" value="${this.get('clipDuration')}">
                        <span class="value-display">${this.get('clipDuration').toFixed(1)}s</span>
                        <small>Longer sounds give your brain more time to locate the source</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>Sound Preview</label>
                        <input type="checkbox" id="sound-preview" ${this.get('soundPreview') ? 'checked' : ''}>
                        <span>Play sound at zero distance before each hole</span>
                        <small>Helps you know exactly what to listen for</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>Upload Custom Sound</label>
                        <input type="file" id="custom-sound-upload" accept="audio/*">
                        <small>Audio will be trimmed/looped to ${this.get('clipDuration')} seconds</small>
                    </div>
                </div>
                
                <!-- Controls Tab -->
                <div class="tab-content" id="controls-tab">
                    <div class="setting-group">
                        <label>Move Speed</label>
                        <input type="range" id="move-speed" min="10" max="200" value="${this.get('moveSpeed') * 100}">
                        <span class="value-display">${Math.round(this.get('moveSpeed') * 100)}%</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>Fast Move Multiplier</label>
                        <input type="range" id="fast-move" min="2" max="10" value="${this.get('fastMoveMultiplier')}">
                        <span class="value-display">${this.get('fastMoveMultiplier')}x</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>Gamepad Deadzone</label>
                        <input type="range" id="gamepad-deadzone" min="5" max="30" value="${this.get('gamepadDeadzone') * 100}">
                        <span class="value-display">${Math.round(this.get('gamepadDeadzone') * 100)}%</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="invert-y" ${this.get('invertY') ? 'checked' : ''}>
                            Invert Y Axis
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <button id="reset-controls">Reset Controls</button>
                    </div>
                </div>
                
                <!-- Visual Tab -->
                <div class="tab-content" id="visual-tab">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="show-visualization" ${this.get('showVisualization') ? 'checked' : ''}>
                            Show Map by Default
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="show-trail" ${this.get('showTrail') ? 'checked' : ''}>
                            Show Movement Trail
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="show-distance" ${this.get('showDistance') ? 'checked' : ''}>
                            Show Distance Indicator
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="show-elevation-colors" ${this.get('showElevationColors') ? 'checked' : ''}>
                            3D Swimming Pool Colors
                        </label>
                        <small>Red = higher elevation, Blue = lower elevation, Size = height</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>Color Scheme</label>
                        <select id="color-scheme">
                            <option value="swimming_pool" ${this.get('colorScheme') === 'swimming_pool' ? 'selected' : ''}>Swimming Pool 3D (Recommended)</option>
                            <option value="default" ${this.get('colorScheme') === 'default' ? 'selected' : ''}>Classic Flat</option>
                            <option value="high_contrast" ${this.get('colorScheme') === 'high_contrast' ? 'selected' : ''}>High Contrast</option>
                            <option value="colorblind" ${this.get('colorScheme') === 'colorblind' ? 'selected' : ''}>Colorblind Friendly</option>
                        </select>
                        <small>Swimming Pool mode uses depth colors and size for intuitive 3D navigation</small>
                    </div>
                </div>
                
                <!-- Gameplay Tab -->
                <div class="tab-content" id="gameplay-tab">
                    <div class="setting-group">
                        <label>Default Difficulty</label>
                        <select id="difficulty">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="extreme">Extreme</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label>Hole Radius</label>
                        <input type="range" id="hole-radius" min="50" max="200" value="${this.get('holeRadius') * 100}">
                        <span class="value-display">${this.get('holeRadius').toFixed(1)}m</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>Sound Clip Duration</label>
                        <input type="range" id="clip-duration" min="10" max="50" value="${this.get('clipDuration') * 10}">
                        <span class="value-display">${this.get('clipDuration').toFixed(1)}s</span>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="auto-play-sound" ${this.get('autoPlaySound') ? 'checked' : ''}>
                            Auto-play Sound on New Hole
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="haptic-feedback" ${this.get('hapticFeedback') ? 'checked' : ''}>
                            Gamepad Haptic Feedback
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="compass-indicator" ${this.get('compassIndicator') ? 'checked' : ''}>
                            Show Compass Direction Indicator
                        </label>
                        <small>Green dot pointing to target - helpful but reduces challenge</small>
                    </div>
                </div>
                
                <!-- Accessibility Tab -->
                <div class="tab-content" id="accessibility-tab">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="visual-indicators" ${this.get('visualIndicators') ? 'checked' : ''}>
                            Visual Sound Indicators
                        </label>
                        <small>Shows visual cues for sound direction</small>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="high-contrast" ${this.get('highContrast') ? 'checked' : ''}>
                            High Contrast Mode
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="larger-text" ${this.get('largerText') ? 'checked' : ''}>
                            Larger Text
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="reduced-motion" ${this.get('reducedMotion') ? 'checked' : ''}>
                            Reduced Motion
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="settings-footer">
                <button id="reset-all-settings">Reset All</button>
                <button id="close-settings">Close</button>
            </div>
        `;
        
        return container;
    }
    
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(`${e.target.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Range inputs
        const rangeInputs = [
            { id: 'master-volume', key: 'masterVolume', scale: 0.01 },
            { id: 'move-speed', key: 'moveSpeed', scale: 0.01 },
            { id: 'fast-move', key: 'fastMoveMultiplier', scale: 1 },
            { id: 'gamepad-deadzone', key: 'gamepadDeadzone', scale: 0.01 },
            { id: 'hole-radius', key: 'holeRadius', scale: 0.01 },
            { id: 'clip-duration', key: 'clipDuration', scale: 1 }
        ];
        
        rangeInputs.forEach(input => {
            const element = document.getElementById(input.id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value) * input.scale;
                    this.set(input.key, value);
                    
                    // Update display
                    const display = e.target.nextElementSibling;
                    if (display) {
                        if (input.scale === 1) {
                            display.textContent = `${value}x`;
                        } else if (input.key.includes('Radius')) {
                            display.textContent = `${value.toFixed(1)}m`;
                        } else if (input.key.includes('Duration')) {
                            display.textContent = `${value.toFixed(1)}s`;
                        } else {
                            display.textContent = `${Math.round(value * 100)}%`;
                        }
                    }
                });
            }
        });
        
        // Checkboxes
        const checkboxes = [
            'invert-y', 'show-visualization', 'show-trail', 'show-distance', 'show-elevation-colors',
            'auto-play-sound', 'haptic-feedback', 'sound-preview', 'compass-indicator', 'visual-indicators',
            'high-contrast', 'larger-text', 'reduced-motion', 'enhanced-sounds'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const key = id.replace(/-/g, '');
                element.addEventListener('change', (e) => {
                    this.set(key, e.target.checked);
                });
            }
        });
        
        // Close button
        document.getElementById('close-settings')?.addEventListener('click', () => {
            document.getElementById('settings-panel')?.remove();
        });
        
        // Reset all
        document.getElementById('reset-all-settings')?.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                this.reset();
                location.reload(); // Easiest way to refresh everything
            }
        });
    }
}

// Settings panel CSS
const settingsStyle = document.createElement('style');
settingsStyle.textContent = `
    .settings-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 20px;
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
    }
    
    .settings-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .tab-btn {
        background: none;
        border: none;
        color: #888;
        padding: 10px 15px;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .tab-btn.active {
        color: #00ff88;
        border-bottom: 2px solid #00ff88;
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .setting-group {
        margin-bottom: 15px;
    }
    
    .setting-group label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
    }
    
    .setting-group input[type="range"] {
        width: 70%;
        vertical-align: middle;
    }
    
    .value-display {
        display: inline-block;
        width: 60px;
        text-align: right;
        color: #00ff88;
    }
    
    .settings-footer {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
    }
`;
document.head.appendChild(settingsStyle);