// Time Trial Mode - Continuous sound, race to the target
class TimeTrial {
    constructor(game) {
        this.game = game;
        this.startTime = null;
        this.endTime = null;
        this.currentTime = 0;
        this.isRunning = false;
        this.targets = [];
        this.currentTarget = 0;
        this.bestTimes = this.loadBestTimes();
    }
    
    loadBestTimes() {
        const saved = localStorage.getItem('shacgolf_timetrial_best');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveBestTime(courseName, time) {
        if (!this.bestTimes[courseName] || time < this.bestTimes[courseName]) {
            this.bestTimes[courseName] = time;
            localStorage.setItem('shacgolf_timetrial_best', JSON.stringify(this.bestTimes));
            return true; // New record!
        }
        return false;
    }
    
    generateTargets(difficulty = 'medium') {
        const configs = {
            easy: { count: 5, maxDistance: 10, minDistance: 3 },
            medium: { count: 7, maxDistance: 15, minDistance: 5 },
            hard: { count: 10, maxDistance: 20, minDistance: 7 },
            extreme: { count: 15, maxDistance: 25, minDistance: 10 }
        };
        
        const config = configs[difficulty] || configs.medium;
        this.targets = [];
        
        for (let i = 0; i < config.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = config.minDistance + Math.random() * (config.maxDistance - config.minDistance);
            const elevation = (Math.random() - 0.5) * 10;
            
            this.targets.push({
                x: Math.cos(angle) * distance,
                y: elevation,
                z: Math.sin(angle) * distance,
                reached: false
            });
        }
        
        return this.targets;
    }
    
    start() {
        this.startTime = Date.now();
        this.isRunning = true;
        this.currentTarget = 0;
        
        // Reset player position
        this.game.player = { x: 0, y: 0, z: 0 };
        this.game.audioEngine.updateListenerPosition(this.game.player);
        
        // Create continuous sound source at first target
        this.playTargetSound();
        
        // Start update loop
        this.update();
    }
    
    playTargetSound() {
        if (this.currentTarget >= this.targets.length) {
            this.complete();
            return;
        }

        const target = this.targets[this.currentTarget];
        const sound = this.game.soundManager.getSound('percussion_mid'); // Quick repeating sound

        // Store current target index for this loop
        const targetIndex = this.currentTarget;

        // Play continuously with short gaps
        const playLoop = () => {
            // Exit if trial stopped or moved to next target
            if (!this.isRunning || this.currentTarget !== targetIndex) return;

            // Create a new source each time (Web Audio API sources are one-shot)
            const source = this.game.audioEngine.createSource(sound, target);
            this.game.audioEngine.playSource(source, 0.5); // Play for 0.5 seconds

            // Schedule next play
            setTimeout(() => {
                if (this.isRunning && this.currentTarget === targetIndex) {
                    playLoop();
                }
            }, 600); // Small gap between plays
        };

        playLoop();
    }
    
    update() {
        if (!this.isRunning) return;
        
        this.currentTime = (Date.now() - this.startTime) / 1000;
        
        // Check if player reached current target
        const target = this.targets[this.currentTarget];
        const distance = this.game.audioEngine.getDistance(this.game.player, target);
        
        if (distance <= 1.5) { // Slightly larger radius for time trial
            this.reachTarget();
        }
        
        // Update display
        this.updateDisplay();
        
        // Continue update loop
        requestAnimationFrame(() => this.update());
    }
    
    reachTarget() {
        const target = this.targets[this.currentTarget];
        target.reached = true;
        
        // Play success sound
        this.game.audioEngine.playUISound(
            this.game.soundManager.getSound('bell_bright'),
            0.5
        );
        
        // Move to next target
        this.currentTarget++;
        
        if (this.currentTarget >= this.targets.length) {
            this.complete();
        } else {
            // Stop current sound
            this.game.audioEngine.stopCurrentSource();
            
            // Play next target sound
            this.playTargetSound();
            
            // Flash screen or other feedback
            this.showTargetReached();
        }
    }
    
    complete() {
        this.isRunning = false;
        this.endTime = Date.now();
        const totalTime = (this.endTime - this.startTime) / 1000;
        
        // Check for new record
        const isNewRecord = this.saveBestTime('current', totalTime);
        
        // Stop any playing sounds
        this.game.audioEngine.stopCurrentSource();
        
        // Show completion screen
        this.showCompletion(totalTime, isNewRecord);
    }
    
    stop() {
        this.isRunning = false;
        this.game.audioEngine.stopCurrentSource();
    }
    
    updateDisplay() {
        // Update timer
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = (this.currentTime % 60).toFixed(1);
        document.getElementById('timer-display').textContent = 
            `${minutes}:${seconds.padStart(4, '0')}`;
        
        // Update progress
        document.getElementById('targets-progress').textContent = 
            `Target ${this.currentTarget + 1} / ${this.targets.length}`;
        
        // Update distance to current target
        if (this.currentTarget < this.targets.length) {
            const target = this.targets[this.currentTarget];
            const distance = this.game.audioEngine.getDistance(this.game.player, target);
            
            const indicator = document.getElementById('distance-indicator');
            indicator.textContent = `Distance: ${distance.toFixed(1)}m`;
            
            // Color code by distance
            if (distance < 2) {
                indicator.style.color = '#00ff00';
            } else if (distance < 5) {
                indicator.style.color = '#88ff00';
            } else if (distance < 10) {
                indicator.style.color = '#ffff00';
            } else {
                indicator.style.color = '#ff8800';
            }
        }
        
        // Update visualization with all targets
        if (this.game.visualization.visible) {
            this.drawTimeTrialVisualization();
        }
    }
    
    drawTimeTrialVisualization() {
        const viz = this.game.visualization;
        viz.clear();
        
        const canvas = viz.canvas;
        const ctx = viz.ctx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 15; // Zoomed out more for time trial
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = -15; i <= 15; i += 3) {
            ctx.beginPath();
            ctx.moveTo(centerX + i * scale, 0);
            ctx.lineTo(centerX + i * scale, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, centerY + i * scale);
            ctx.lineTo(canvas.width, centerY + i * scale);
            ctx.stroke();
        }
        
        // Draw all targets
        this.targets.forEach((target, index) => {
            ctx.beginPath();
            ctx.arc(
                centerX + target.x * scale,
                centerY - target.z * scale,
                index === this.currentTarget ? 10 : 6,
                0,
                Math.PI * 2
            );
            
            if (target.reached) {
                ctx.fillStyle = '#00ff00'; // Green for reached
            } else if (index === this.currentTarget) {
                ctx.fillStyle = '#ffff00'; // Yellow for current
            } else {
                ctx.fillStyle = '#ff4444'; // Red for pending
            }
            
            ctx.fill();
            
            // Draw target number
            ctx.fillStyle = 'white';
            ctx.font = '10px monospace';
            ctx.fillText(
                (index + 1).toString(),
                centerX + target.x * scale - 3,
                centerY - target.z * scale + 3
            );
        });
        
        // Draw path between targets
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            const x = centerX + target.x * scale;
            const y = centerY - target.z * scale;
            
            if (i === 0) {
                ctx.moveTo(centerX, centerY); // Start from origin
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw player
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(
            centerX + this.game.player.x * scale,
            centerY - this.game.player.z * scale,
            8,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw timer and progress
        ctx.fillStyle = 'white';
        ctx.font = '16px monospace';
        ctx.fillText(`Time: ${Math.floor(this.currentTime)}s`, 10, 30);
        ctx.fillText(`Targets: ${this.currentTarget}/${this.targets.length}`, 10, 50);
    }
    
    showTargetReached() {
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(0,255,136,0.3), transparent);
            pointer-events: none;
            z-index: 1000;
            animation: flash 0.3s ease-out;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    }
    
    showCompletion(time, isNewRecord) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <h2>${isNewRecord ? 'NEW RECORD!' : 'Time Trial Complete!'}</h2>
            <div class="final-stats">
                <p>Total Time: ${time.toFixed(1)} seconds</p>
                <p>Targets Reached: ${this.targets.length}</p>
                ${isNewRecord ? '<p>🏆 New Personal Best!</p>' : ''}
            </div>
            <button onclick="game.timeTrial.start()">Play Again</button>
            <button onclick="game.returnToMenu()">Main Menu</button>
        `;
        
        document.getElementById('game-container').appendChild(overlay);
    }
}

// Add CSS animation for flash effect
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    #timer-display {
        font-size: 2rem;
        font-weight: bold;
        color: #00ff88;
        font-family: monospace;
    }
    
    #targets-progress {
        font-size: 1.2rem;
        color: #ffff00;
    }
`;
document.head.appendChild(style);