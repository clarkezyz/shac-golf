// Window Manager - Handles separate visualization windows
class WindowManager {
    constructor(game) {
        this.game = game;
        this.windows = {
            training: null,
            audience: null,
            navigator: null
        };
        
        this.modes = {
            training: { 
                name: 'Training View', 
                allowInput: false,
                showAll: true,
                description: 'See your progress while learning'
            },
            audience: { 
                name: 'Audience View', 
                allowInput: false,
                showAll: true,
                description: 'Perfect for streaming - viewers can see player progress'
            },
            navigator: { 
                name: 'Navigator View', 
                allowInput: true,
                showAll: true,
                description: 'Rally car mode - guide your teammate!'
            }
        };
    }
    
    openWindow(type, title = null) {
        if (this.windows[type] && !this.windows[type].closed) {
            this.windows[type].focus();
            return this.windows[type];
        }
        
        const mode = this.modes[type];
        if (!mode) return null;
        
        const windowTitle = title || mode.name;
        const width = 900;
        const height = 700;
        
        // Center the window
        const left = (screen.width / 2) - (width / 2);
        const top = (screen.height / 2) - (height / 2);
        
        const windowFeatures = `
            width=${width},
            height=${height},
            left=${left},
            top=${top},
            resizable=yes,
            scrollbars=no,
            status=no,
            menubar=no,
            toolbar=no,
            location=no
        `;
        
        this.windows[type] = window.open('', windowTitle, windowFeatures);
        
        if (this.windows[type]) {
            this.setupWindow(type);
            this.syncWindowData(type);
            
            // Handle window close
            this.windows[type].addEventListener('beforeunload', () => {
                this.windows[type] = null;
            });
            
            return this.windows[type];
        }
        
        return null;
    }
    
    setupWindow(type) {
        const win = this.windows[type];
        if (!win) return;
        
        const mode = this.modes[type];
        
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${mode.name} - SHAC Golf</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2a 100%);
                        color: white;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    .header {
                        background: rgba(0, 0, 0, 0.8);
                        padding: 15px 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .title {
                        font-size: 1.5rem;
                        background: linear-gradient(45deg, #00ff88, #00aaff);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    
                    .status {
                        display: flex;
                        gap: 20px;
                        font-size: 0.9rem;
                    }
                    
                    .game-info {
                        background: rgba(0, 0, 0, 0.6);
                        padding: 10px 15px;
                        border-radius: 5px;
                    }
                    
                    .canvas-container {
                        flex: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                        position: relative;
                    }
                    
                    #external-canvas {
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        background: rgba(0, 0, 0, 0.5);
                    }
                    
                    .controls {
                        background: rgba(0, 0, 0, 0.8);
                        padding: 15px 20px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .navigation-controls {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    
                    .nav-btn {
                        padding: 8px 16px;
                        background: rgba(0, 255, 136, 0.2);
                        border: 1px solid rgba(0, 255, 136, 0.5);
                        color: white;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.9rem;
                    }
                    
                    .nav-btn:hover {
                        background: rgba(0, 255, 136, 0.4);
                        transform: translateY(-1px);
                    }
                    
                    .nav-btn:active {
                        transform: translateY(0);
                    }
                    
                    .chat-container {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    
                    #chat-input {
                        padding: 8px 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 5px;
                        color: white;
                        width: 200px;
                    }
                    
                    #chat-input::placeholder {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    
                    .hidden {
                        display: none !important;
                    }
                    
                    .description {
                        font-style: italic;
                        color: #888;
                        font-size: 0.8rem;
                    }
                    
                    .distance-display {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #00ff88;
                    }
                    
                    .angle-display {
                        font-size: 1rem;
                        color: #00aaff;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">${mode.name}</div>
                        <div class="description">${mode.description}</div>
                    </div>
                    <div class="status">
                        <div class="game-info">
                            <span>Hole: </span><span id="hole-display">1/9</span>
                        </div>
                        <div class="game-info">
                            <span>Strokes: </span><span id="strokes-display">0</span>
                        </div>
                        <div class="game-info">
                            <span>Score: </span><span id="score-display">E</span>
                        </div>
                    </div>
                </div>
                
                <div class="canvas-container">
                    <canvas id="external-canvas" width="800" height="600"></canvas>
                    <div class="distance-display" id="distance-info">Distance: -- m</div>
                    <div class="angle-display" id="angle-info">Angle: --°</div>
                </div>
                
                <div class="controls">
                    <div class="navigation-controls ${type !== 'navigator' ? 'hidden' : ''}">
                        <span>Guide your teammate:</span>
                        <button class="nav-btn" data-direction="forward">Forward</button>
                        <button class="nav-btn" data-direction="back">Back</button>
                        <button class="nav-btn" data-direction="left">Left</button>
                        <button class="nav-btn" data-direction="right">Right</button>
                        <button class="nav-btn" data-direction="up">Up</button>
                        <button class="nav-btn" data-direction="down">Down</button>
                    </div>
                    
                    <div class="chat-container ${type !== 'navigator' ? 'hidden' : ''}">
                        <input type="text" id="chat-input" placeholder="Type directions..." maxlength="100">
                        <button class="nav-btn" id="send-chat">Send</button>
                    </div>
                    
                    <div class="window-controls">
                        <button class="nav-btn" id="close-window">Close Window</button>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        win.document.close();
        
        // Setup event listeners
        this.setupWindowEventListeners(type);
    }
    
    setupWindowEventListeners(type) {
        const win = this.windows[type];
        if (!win) return;
        
        const mode = this.modes[type];
        
        // Close button
        const closeBtn = win.document.getElementById('close-window');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                win.close();
                this.windows[type] = null;
            });
        }
        
        // Navigation controls for navigator mode
        if (type === 'navigator' && mode.allowInput) {
            const navButtons = win.document.querySelectorAll('.nav-btn[data-direction]');
            navButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.sendNavigationCommand(btn.dataset.direction);
                });
            });
            
            // Chat input
            const chatInput = win.document.getElementById('chat-input');
            const sendBtn = win.document.getElementById('send-chat');
            
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    this.sendChatMessage(message);
                    chatInput.value = '';
                }
            };
            
            if (sendBtn) sendBtn.addEventListener('click', sendMessage);
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });
            }
        }
    }
    
    syncWindowData(type) {
        const win = this.windows[type];
        if (!win || win.closed) return;
        
        try {
            // Update game info
            const holeDisplay = win.document.getElementById('hole-display');
            const strokesDisplay = win.document.getElementById('strokes-display');
            const scoreDisplay = win.document.getElementById('score-display');
            
            if (holeDisplay && this.game.currentCourse) {
                holeDisplay.textContent = `${this.game.currentHole + 1}/${this.game.currentCourse.holes.length}`;
            }
            
            if (strokesDisplay) {
                strokesDisplay.textContent = this.game.strokes;
            }
            
            if (scoreDisplay) {
                const score = this.game.score;
                scoreDisplay.textContent = score >= 0 ? `+${score}` : score;
            }
            
            // Draw the visualization
            this.drawExternalVisualization(type);
            
        } catch (e) {
            console.error('Error syncing window data:', e);
        }
    }
    
    drawExternalVisualization(type) {
        const win = this.windows[type];
        if (!win || win.closed) return;
        
        const canvas = win.document.getElementById('external-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 20;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = -20; i <= 20; i += 2) {
            ctx.beginPath();
            ctx.moveTo(centerX + i * scale, 0);
            ctx.lineTo(centerX + i * scale, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, centerY + i * scale);
            ctx.lineTo(canvas.width, centerY + i * scale);
            ctx.stroke();
        }
        
        // Draw coordinate labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '12px monospace';
        ctx.fillText('0,0', centerX + 5, centerY - 5);
        
        // Draw target if available
        if (this.game.audioEngine.currentSource) {
            const target = this.game.audioEngine.currentSource.position;
            
            // Target
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(
                centerX + target.x * scale,
                centerY - target.z * scale,
                12,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Hole radius
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                centerX + target.x * scale,
                centerY - target.z * scale,
                this.game.holeRadius * scale,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            
            // Target label
            ctx.fillStyle = 'white';
            ctx.font = '14px monospace';
            ctx.fillText(
                'HOLE',
                centerX + target.x * scale + 15,
                centerY - target.z * scale - 15
            );
        }
        
        // Draw player
        const player = this.game.player;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(
            centerX + player.x * scale,
            centerY - player.z * scale,
            10,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Player trail
        if (this.game.visualization.trail && this.game.visualization.trail.length > 1) {
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < this.game.visualization.trail.length; i++) {
                const pos = this.game.visualization.trail[i];
                const x = centerX + pos.x * scale;
                const y = centerY - pos.z * scale;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Update distance and angle displays
        if (this.game.audioEngine.currentSource) {
            const distance = this.game.audioEngine.getDistanceToCurrentSource();
            const angle = this.game.audioEngine.getAngleToSource(this.game.audioEngine.currentSource);
            
            const distanceInfo = win.document.getElementById('distance-info');
            const angleInfo = win.document.getElementById('angle-info');
            
            if (distanceInfo) {
                distanceInfo.textContent = `Distance: ${distance.toFixed(1)}m`;
                if (distance < this.game.holeRadius) {
                    distanceInfo.style.color = '#00ff00';
                    distanceInfo.textContent = 'IN THE HOLE!';
                } else {
                    distanceInfo.style.color = distance < 5 ? '#88ff00' : '#00ff88';
                }
            }
            
            if (angleInfo) {
                angleInfo.textContent = `Angle: ${Math.round(angle)}°`;
            }
        }
    }
    
    sendNavigationCommand(direction) {
        // Create a visual/audio cue in main window
        const directions = {
            forward: 'Go forward!',
            back: 'Go back!',
            left: 'Go left!',
            right: 'Go right!',
            up: 'Go up!',
            down: 'Go down!'
        };
        
        this.showNavigationCue(directions[direction]);
    }
    
    sendChatMessage(message) {
        this.showNavigationCue(`Navigator: ${message}`);
    }
    
    showNavigationCue(message) {
        // Show message in main game window
        const existing = document.getElementById('navigation-message');
        if (existing) existing.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'navigation-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 136, 0.9);
            color: black;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 10000;
            animation: navigationPulse 3s ease-out forwards;
        `;
        messageDiv.textContent = message;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes navigationPulse {
                0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
                20% { opacity: 1; transform: translateX(-50%) scale(1); }
                80% { opacity: 1; transform: translateX(-50%) scale(1); }
                100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after animation
        setTimeout(() => {
            messageDiv.remove();
            style.remove();
        }, 3000);
    }
    
    updateAll() {
        Object.keys(this.windows).forEach(type => {
            if (this.windows[type] && !this.windows[type].closed) {
                this.syncWindowData(type);
            }
        });
    }
    
    closeAll() {
        Object.keys(this.windows).forEach(type => {
            if (this.windows[type] && !this.windows[type].closed) {
                this.windows[type].close();
                this.windows[type] = null;
            }
        });
    }
    
    // Check if any windows are open
    hasOpenWindows() {
        return Object.values(this.windows).some(win => win && !win.closed);
    }
}