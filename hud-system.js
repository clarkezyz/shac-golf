// HUD System - Toggleable elements and competitive modes
class HUDSystem {
    constructor(game) {
        this.game = game;
        this.elements = {
            compass: { enabled: true, pure: false },
            distance: { enabled: true, pure: false },
            strokes: { enabled: true, pure: true },
            hole: { enabled: true, pure: true },
            position: { enabled: false, pure: false },
            elevation: { enabled: false, pure: false },
            timer: { enabled: true, pure: true },
            trail: { enabled: false, pure: false },
            graph: { enabled: false, pure: false }
        };

        this.mode = 'assisted'; // 'pure', 'assisted', 'training'
        this.compassRotation = 0;
        this.frozenDistance = null; // Store frozen distance during swing playback
    }
    
    setMode(mode) {
        this.mode = mode;
        
        switch(mode) {
            case 'pure':
                // Minimal HUD - only essential info
                Object.keys(this.elements).forEach(key => {
                    this.elements[key].enabled = this.elements[key].pure;
                });
                this.elements.graph.enabled = false;
                this.game.visualization.visible = false;
                break;
                
            case 'streamer':
                // Pure gameplay but opens audience window
                Object.keys(this.elements).forEach(key => {
                    this.elements[key].enabled = this.elements[key].pure;
                });
                this.elements.graph.enabled = false;
                this.game.visualization.visible = false;
                // Open audience window automatically
                this.game.windowManager.openWindow('audience', 'SHAC Golf - Audience View');
                break;
                
            case 'assisted':
                // Standard HUD with helpers
                this.elements.compass.enabled = true;
                this.elements.distance.enabled = true;
                this.elements.strokes.enabled = true;
                this.elements.hole.enabled = true;
                this.elements.position.enabled = false;
                this.elements.elevation.enabled = true;
                this.elements.timer.enabled = true;
                this.elements.trail.enabled = false;
                this.elements.graph.enabled = false;
                break;
                
            case 'training':
                // Everything enabled + training window
                Object.keys(this.elements).forEach(key => {
                    this.elements[key].enabled = true;
                });
                this.game.visualization.visible = true;
                // Open training window automatically
                this.game.windowManager.openWindow('training', 'SHAC Golf - Training View');
                break;
                
            case 'rally':
                // Blind mode - only essential info, navigator window
                Object.keys(this.elements).forEach(key => {
                    this.elements[key].enabled = this.elements[key].pure;
                });
                this.elements.graph.enabled = false;
                this.game.visualization.visible = false;
                // Open navigator window
                this.game.windowManager.openWindow('navigator', 'SHAC Golf - Navigator View');
                break;
        }
        
        this.updateDisplay();
        return this.getLeaderboardType();
    }
    
    getLeaderboardType() {
        if (this.mode === 'pure') return 'pure-competitive';
        if (this.mode === 'streamer') return 'pure-competitive'; // Same as pure for scoring
        if (this.mode === 'assisted') return 'assisted-competitive';
        if (this.mode === 'rally') return 'local-only'; // Co-op mode, local only
        if (this.mode === 'training' || this.elements.graph.enabled) return 'local-only';
        return 'local-only';
    }
    
    toggleElement(elementName) {
        if (this.elements[elementName]) {
            this.elements[elementName].enabled = !this.elements[elementName].enabled;
            
            // Special handling for graph
            if (elementName === 'graph') {
                this.game.visualization.visible = this.elements.graph.enabled;
                this.game.visualization.canvas.classList.toggle('visible', this.elements.graph.enabled);
            }
            
            this.updateDisplay();
            
            // Check if still eligible for competitive leaderboards
            return this.getLeaderboardType();
        }
    }
    
    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'enhanced-hud';
        hud.innerHTML = `
            <!-- Mode Selector -->
            <div id="mode-selector" class="hud-mode-selector">
                <button class="mode-btn" data-mode="pure">Pure</button>
                <button class="mode-btn" data-mode="streamer">Streamer</button>
                <button class="mode-btn active" data-mode="assisted">Assisted</button>
                <button class="mode-btn" data-mode="training">Training</button>
                <button class="mode-btn" data-mode="rally">Rally Car</button>
                <div class="leaderboard-status">
                    <span id="leaderboard-type">Assisted Competitive</span>
                </div>
            </div>
            
            <!-- Compass -->
            <div id="hud-compass" class="hud-element compass">
                <div class="compass-ring">
                    <div class="compass-needle"></div>
                    <div class="compass-directions">
                        <span class="north">N</span>
                        <span class="east">E</span>
                        <span class="south">S</span>
                        <span class="west">W</span>
                    </div>
                    <div class="sound-direction-indicator"></div>
                </div>
                <div class="compass-angle">0°</div>
            </div>
            
            <!-- Distance Meter -->
            <div id="hud-distance" class="hud-element distance-meter">
                <div class="distance-bar">
                    <div class="distance-fill"></div>
                </div>
                <div class="distance-text">-- m</div>
                <div class="distance-hints">
                    <span class="hot hidden">HOT</span>
                    <span class="warm hidden">WARM</span>
                    <span class="cold hidden">COLD</span>
                </div>
            </div>
            
            <!-- Elevation Indicator -->
            <div id="hud-elevation" class="hud-element elevation">
                <div class="elevation-meter">
                    <div class="elevation-marker"></div>
                </div>
                <div class="elevation-text">Level</div>
            </div>
            
            <!-- Core Info -->
            <div id="hud-core" class="hud-element core-info">
                <div class="hole-info">Hole <span id="hole-num">1</span>/<span id="hole-total">9</span></div>
                <div class="par-info">Par <span id="hole-par">3</span></div>
                <div class="stroke-info">Strokes: <span id="stroke-count">0</span></div>
                <div class="score-info">Score: <span id="score-display">E</span></div>
            </div>
            
            <!-- Position Display -->
            <div id="hud-position" class="hud-element position-display">
                X: <span id="pos-x">0.0</span>
                Y: <span id="pos-y">0.0</span>
                Z: <span id="pos-z">0.0</span>
            </div>
            
            <!-- Timer (for time trial) -->
            <div id="hud-timer" class="hud-element timer">
                <span id="timer-display">0:00.0</span>
            </div>
            
            <!-- HUD Toggle Menu -->
            <div id="hud-toggle-menu" class="hud-toggle-menu hidden">
                <h3>HUD Elements</h3>
                <label><input type="checkbox" data-element="compass" checked> Compass</label>
                <label><input type="checkbox" data-element="distance" checked> Distance Meter</label>
                <label><input type="checkbox" data-element="elevation"> Elevation</label>
                <label><input type="checkbox" data-element="position"> Position</label>
                <label><input type="checkbox" data-element="trail"> Movement Trail</label>
                <label><input type="checkbox" data-element="graph"> Visualization Map</label>
                <div class="warning-text hidden">
                    ⚠️ Graph enabled - Local leaderboard only
                </div>
            </div>
            
            <!-- Quick Toggle Button -->
            <button id="hud-toggle-btn" class="hud-toggle-btn">⚙️</button>
        `;
        
        return hud;
    }
    
    updateDisplay() {
        // Show/hide elements based on settings
        Object.keys(this.elements).forEach(key => {
            const element = document.getElementById(`hud-${key}`);
            if (element) {
                element.style.display = this.elements[key].enabled ? 'block' : 'none';
            }
        });
        
        // Update leaderboard status
        const leaderboardType = this.getLeaderboardType();
        const statusElement = document.getElementById('leaderboard-type');
        if (statusElement) {
            switch(this.mode) {
                case 'pure':
                    statusElement.textContent = '🏆 Pure Mode - Global Leaderboard';
                    statusElement.className = 'status-pure';
                    break;
                case 'streamer':
                    statusElement.textContent = '🎥 Streamer Mode - Global + Audience';
                    statusElement.className = 'status-pure';
                    break;
                case 'assisted':
                    statusElement.textContent = '📊 Assisted - Competitive Leaderboard';
                    statusElement.className = 'status-assisted';
                    break;
                case 'training':
                    statusElement.textContent = '🎓 Training Mode - Local + Window';
                    statusElement.className = 'status-local';
                    break;
                case 'rally':
                    statusElement.textContent = '🚗 Rally Car - Co-op Mode';
                    statusElement.className = 'status-local';
                    break;
                default:
                    statusElement.textContent = '📍 Local Mode';
                    statusElement.className = 'status-local';
                    break;
            }
        }
    }
    
    updateCompass() {
        if (!this.elements.compass.enabled) return;

        const target = this.game.audioEngine.currentSource;
        if (!target) return;

        console.log("Updating compass, target:", target);
        
        // Calculate angle to target
        const dx = target.position.x - this.game.player.x;
        const dz = target.position.z - this.game.player.z;
        let absoluteAngle = Math.atan2(dx, dz) * (180 / Math.PI);
        if (absoluteAngle < 0) absoluteAngle += 360;
        
        // Calculate relative angle based on player facing
        const playerFacing = this.game.playerFacing || 0;
        let relativeAngle = absoluteAngle - playerFacing;
        if (relativeAngle < 0) relativeAngle += 360;
        if (relativeAngle > 360) relativeAngle -= 360;
        
        // Keep compass ring stationary with N always at top
        const compassRing = document.querySelector('#hud-compass .compass-ring');
        if (compassRing) {
            // No rotation - compass stays oriented with North at top
            compassRing.style.transform = 'rotate(0deg)';
        }

        // Update compass needle to point to target
        const needle = document.querySelector('#hud-compass .compass-needle');
        if (needle) {
            // Needle shows absolute direction to target
            needle.style.transform = `rotate(${absoluteAngle}deg)`;
        }

        // Update angle display (show relative angle for easier navigation)
        const angleDisplay = document.querySelector('#hud-compass .compass-angle');
        if (angleDisplay) {
            // Show relative angle: 0° = straight ahead, 90° = right, 270° = left
            angleDisplay.textContent = `${Math.round(relativeAngle)}°`;
        }

        // Update sound direction indicator (only if enabled in settings)
        const indicator = document.querySelector('#hud-compass .sound-direction-indicator');
        if (indicator) {
            if (this.game.settings.get('compassIndicator')) {
                indicator.style.display = 'block';
                indicator.style.transform = `rotate(${absoluteAngle}deg) translateY(-40px)`;
            } else {
                indicator.style.display = 'none';
            }
        }
    }
    
    updateDistance() {
        if (!this.elements.distance.enabled) return;

        let distance;

        // Freeze distance reading during swing playback to prevent cheating
        if (this.game.audioEngine.isPlaying) {
            // If we're playing audio and don't have a frozen distance, capture it now
            if (this.frozenDistance === null) {
                this.frozenDistance = this.game.audioEngine.getDistanceToCurrentSource();
            }
            distance = this.frozenDistance;
        } else {
            // Audio not playing, use live distance and clear frozen value
            distance = this.game.audioEngine.getDistanceToCurrentSource();
            this.frozenDistance = null;
        }

        const maxDistance = 30; // Maximum expected distance
        const percentage = Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100));
        
        // Update distance bar
        const fill = document.querySelector('#hud-distance .distance-fill');
        if (fill) {
            fill.style.width = `${percentage}%`;

            // Color code
            if (distance < 2) {
                fill.style.background = 'linear-gradient(90deg, #00ff00, #00ff88)';
            } else if (distance < 5) {
                fill.style.background = 'linear-gradient(90deg, #88ff00, #ffff00)';
            } else if (distance < 10) {
                fill.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #ff4444, #ff0000)';
            }
        }

        // Update distance text
        const text = document.querySelector('#hud-distance .distance-text');
        if (text) {
            if (distance < this.game.holeRadius) {
                text.textContent = 'HOLE!';
                text.style.color = '#00ff00';
            } else {
                text.textContent = `${distance.toFixed(1)}m`;
                text.style.color = '#ffffff';
            }
        }

        // Update hints
        document.querySelectorAll('#hud-distance .distance-hints span').forEach(el => el.classList.add('hidden'));
        if (distance < 3) {
            document.querySelector('#hud-distance .hot')?.classList.remove('hidden');
        } else if (distance < 7) {
            document.querySelector('#hud-distance .warm')?.classList.remove('hidden');
        } else {
            document.querySelector('#hud-distance .cold')?.classList.remove('hidden');
        }
    }
    
    updateElevation() {
        if (!this.elements.elevation.enabled) return;
        
        const target = this.game.audioEngine.currentSource;
        if (!target) return;
        
        const elevation = target.position.y - this.game.player.y;
        const maxElevation = 20; // Maximum expected elevation difference
        const percentage = (elevation / maxElevation) * 50 + 50; // Center at 50%
        
        // Update elevation marker
        const marker = document.querySelector('#hud-elevation .elevation-marker');
        if (marker) {
            marker.style.top = `${100 - percentage}%`;
        }

        // Update elevation text
        const text = document.querySelector('#hud-elevation .elevation-text');
        if (text) {
            if (Math.abs(elevation) < 0.5) {
                text.textContent = 'Level';
            } else if (elevation > 0) {
                text.textContent = `↑ ${elevation.toFixed(1)}m`;
            } else {
                text.textContent = `↓ ${Math.abs(elevation).toFixed(1)}m`;
            }
        }
    }
    
    updateScore(strokes, par) {
        const diff = strokes - par;
        const display = document.getElementById('score-display');
        if (!display) return;
        
        if (strokes === 0) {
            display.textContent = 'E';
        } else if (diff <= -2) {
            display.textContent = `🦅 ${diff}`;
        } else if (diff === -1) {
            display.textContent = `🐦 -1`;
        } else if (diff === 0) {
            display.textContent = 'PAR';
        } else if (diff === 1) {
            display.textContent = '+1';
        } else {
            display.textContent = `+${diff}`;
        }
    }
    
    update() {
        this.updateCompass();
        this.updateDistance();
        this.updateElevation();

        // Update position if enabled
        if (this.elements.position.enabled) {
            document.getElementById('pos-x').textContent = this.game.player.x.toFixed(1);
            document.getElementById('pos-y').textContent = this.game.player.y.toFixed(1);
            document.getElementById('pos-z').textContent = this.game.player.z.toFixed(1);
        }

        // Update stroke count
        const strokeCountElement = document.getElementById('stroke-count');
        if (strokeCountElement) {
            strokeCountElement.textContent = this.game.strokes;
        }

        // Update score
        const hole = this.game.currentCourse?.holes[this.game.currentHole];
        if (hole) {
            const currentScore = this.game.score + Math.max(0, this.game.strokes - hole.par);
            const scoreDisplayElement = document.getElementById('score-display');
            if (scoreDisplayElement) {
                scoreDisplayElement.textContent = currentScore >= 0 ? `+${currentScore}` : currentScore;
            }
        }

        // Update hole information
        if (hole) {
            const holeNumElement = document.getElementById('hole-num');
            const holeTotalElement = document.getElementById('hole-total');
            const holeParElement = document.getElementById('hole-par');

            if (holeNumElement) holeNumElement.textContent = hole.number;
            if (holeTotalElement) holeTotalElement.textContent = this.game.currentCourse.holes.length;
            if (holeParElement) holeParElement.textContent = hole.par;
        }
    }
}

// HUD CSS
const hudStyle = document.createElement('style');
hudStyle.textContent = `
    #enhanced-hud {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 100;
    }
    
    #enhanced-hud button,
    #game-controls button {
        pointer-events: auto;
    }
    
    .hud-element {
        position: absolute;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 15px;
        color: white;
        font-family: monospace;
    }
    
    /* Mode Selector */
    .hud-mode-selector {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        align-items: center;
        pointer-events: auto;
    }
    
    .mode-btn {
        padding: 5px 15px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        cursor: pointer;
        border-radius: 5px;
        transition: all 0.2s;
    }
    
    .mode-btn.active {
        background: rgba(0, 255, 136, 0.3);
        border-color: #00ff88;
    }
    
    .leaderboard-status {
        margin-left: 20px;
        padding: 5px 10px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
    }
    
    .status-pure { color: #ffd700; }
    .status-assisted { color: #00ff88; }
    .status-local { color: #888888; }
    
    /* Compass */
    .compass {
        top: 80px;
        right: 20px;
        width: 120px;
        height: 120px;
    }
    
    .compass-ring {
        position: relative;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
    }
    
    .compass-needle {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 40%;
        background: linear-gradient(to top, transparent, #ff0000);
        transform-origin: bottom center;
        transform: translate(-50%, -100%) rotate(0deg);
        transition: transform 0.3s ease;
    }
    
    .compass-directions {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
    
    .compass-directions span {
        position: absolute;
        font-size: 12px;
        font-weight: bold;
    }
    
    .north { top: 5px; left: 50%; transform: translateX(-50%); }
    .south { bottom: 5px; left: 50%; transform: translateX(-50%); }
    .east { right: 5px; top: 50%; transform: translateY(-50%); }
    .west { left: 5px; top: 50%; transform: translateY(-50%); }
    
    .sound-direction-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        background: #00ff88;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px #00ff88;
    }
    
    .compass-angle {
        text-align: center;
        margin-top: 10px;
        font-size: 14px;
        color: #00ff88;
    }
    
    /* Distance Meter */
    .distance-meter {
        top: 80px;
        left: 20px;
        width: 200px;
    }
    
    .distance-bar {
        width: 100%;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 10px;
    }
    
    .distance-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #ff0000, #00ff00);
        transition: width 0.3s ease;
    }
    
    .distance-text {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
    }
    
    .distance-hints {
        display: flex;
        justify-content: space-around;
        margin-top: 5px;
    }
    
    .distance-hints span {
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
    }
    
    .hot { background: #ff0000; }
    .warm { background: #ffaa00; }
    .cold { background: #0088ff; }
    
    /* Elevation */
    .elevation {
        top: 250px;
        right: 20px;
        width: 60px;
        height: 150px;
    }
    
    .elevation-meter {
        position: relative;
        width: 20px;
        height: 120px;
        background: linear-gradient(to top, #0088ff, #888888 50%, #ff8800);
        border-radius: 10px;
        margin: 0 auto;
    }
    
    .elevation-marker {
        position: absolute;
        left: -5px;
        right: -5px;
        height: 2px;
        background: white;
        top: 50%;
    }
    
    .elevation-text {
        text-align: center;
        margin-top: 10px;
        font-size: 12px;
    }
    
    /* Core Info */
    .core-info {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
        padding: 10px 20px;
    }
    
    .core-info div {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    /* Position Display */
    .position-display {
        bottom: 80px;
        left: 20px;
        font-size: 12px;
        padding: 10px;
    }
    
    /* Timer */
    .timer {
        top: 20px;
        right: 20px;
        font-size: 24px;
        font-weight: bold;
        color: #00ff88;
    }
    
    /* HUD Toggle Menu */
    .hud-toggle-menu {
        position: absolute;
        top: 50px;
        right: 70px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        padding: 15px;
        pointer-events: auto;
    }
    
    .hud-toggle-menu label {
        display: block;
        margin: 5px 0;
        cursor: pointer;
    }
    
    .warning-text {
        margin-top: 10px;
        padding: 5px;
        background: rgba(255, 100, 0, 0.2);
        border-radius: 5px;
        font-size: 12px;
        color: #ffaa00;
    }
    
    .hud-toggle-btn {
        position: absolute;
        top: 50px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        pointer-events: auto;
    }
    
    .hidden {
        display: none !important;
    }
`;
document.head.appendChild(hudStyle);