// UI and course management functions for Game class
// This extends the Game class with UI methods

Game.prototype.showCourseSelect = function(mode) {
    this.gameMode = mode;
    
    // Hide menu, show course select
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('course-select').classList.add('active');
    
    // Build course list
    const courseList = document.getElementById('course-list');
    courseList.innerHTML = '';
    
    for (const [key, course] of Object.entries(COURSES)) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-name">${course.name}</div>
            <div class="course-info">
                Difficulty: ${course.difficulty}<br>
                Holes: ${course.holes ? course.holes.length : 9}<br>
                ${key === 'randomDaily' ? 'Changes daily!' : ''}
            </div>
        `;
        card.addEventListener('click', () => this.startCourse(key));
        courseList.appendChild(card);
    }
    
    // Back button
    document.querySelector('.back-btn').addEventListener('click', () => {
        document.getElementById('course-select').classList.remove('active');
        document.getElementById('menu-screen').classList.add('active');
    });
};

Game.prototype.startCourse = function(courseKey) {
    const course = COURSES[courseKey];
    
    // Generate holes if needed (for daily challenge)
    if (course.generateHoles) {
        course.holes = course.generateHoles();
    }
    
    this.currentCourse = course;
    this.currentHole = 0;
    this.totalStrokes = 0;
    this.score = 0;
    this.scores = [];
    
    // Check if sound preview is enabled
    if (this.settings.get('soundPreview')) {
        // Hide course select, show sound preview
        document.getElementById('course-select').classList.remove('active');
        document.getElementById('sound-preview').classList.add('active');
        this.setupSoundPreview();
    } else {
        // Skip preview, go directly to game
        document.getElementById('course-select').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        this.startHole();
    }
};

Game.prototype.setupSoundPreview = function() {
    const hole = this.currentCourse.holes[this.currentHole];
    
    // Get the sound that will be used for this hole
    const soundNames = this.soundManager.getSoundList();
    const soundIndex = (hole.number - 1) % soundNames.length;
    const soundBuffer = this.soundManager.getSound(soundNames[soundIndex]);
    
    // Setup preview button
    const previewBtn = document.getElementById('preview-sound-btn');
    const startBtn = document.getElementById('start-hole-btn');
    
    previewBtn.onclick = () => {
        // Play sound at listener position (0,0,0) - no spatial positioning
        const source = this.audioEngine.audioContext.createBufferSource();
        source.buffer = soundBuffer;
        
        // Connect directly to destination (no spatial processing)
        const gainNode = this.audioEngine.audioContext.createGain();
        gainNode.gain.value = 0.3; // Reasonable volume
        source.connect(gainNode);
        gainNode.connect(this.audioEngine.audioContext.destination);
        
        source.start();
        
        // Update button text during playback
        previewBtn.textContent = '🔊 Playing...';
        previewBtn.disabled = true;
        
        setTimeout(() => {
            previewBtn.textContent = '🔊 Play Preview Sound';
            previewBtn.disabled = false;
        }, 3000); // Duration of our enhanced sounds
    };
    
    startBtn.onclick = () => {
        // Hide preview, show game, start hole
        document.getElementById('sound-preview').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        this.startHole();
    };
    
    // Back button
    document.querySelector('#sound-preview .back-btn').onclick = () => {
        document.getElementById('sound-preview').classList.remove('active');
        document.getElementById('course-select').classList.add('active');
    };
};

Game.prototype.startHole = function() {
    const hole = this.currentCourse.holes[this.currentHole];

    // Reset player position
    this.player = { x: 0, y: 0, z: 0 };
    this.audioEngine.updateListenerPosition(this.player);

    // Reset strokes
    this.strokes = 0;

    // Create audio source at target position
    const soundNames = this.soundManager.getSoundList();
    const soundIndex = (hole.number - 1) % soundNames.length;
    const soundBuffer = this.soundManager.getSound(soundNames[soundIndex]);
    this.audioEngine.currentSource = this.audioEngine.createSource(soundBuffer, hole.target);

    // Show golf mode controls (in case coming from time trial)
    const gameControls = document.getElementById('game-controls');
    if (gameControls) {
        gameControls.style.display = 'flex';
    }

    // Restore golf HUD if it was replaced by time trial
    const gameHud = document.getElementById('game-hud');
    if (!gameHud.querySelector('#current-hole')) {
        gameHud.innerHTML = `
            <div class="hud-left">
                <div>Hole <span id="current-hole">1</span> / <span id="total-holes">9</span></div>
                <div>Par <span id="hole-par">3</span></div>
            </div>
            <div class="hud-center">
            </div>
            <div class="hud-right">
                <div>Score: <span id="score">0</span></div>
            </div>
        `;
    }

    // Update UI
    document.getElementById('current-hole').textContent = hole.number;
    document.getElementById('total-holes').textContent = this.currentCourse.holes.length;
    document.getElementById('hole-par').textContent = hole.par;
    
    // Reset visualization
    this.visualization.resetTrail();
    
    // Initialize HUD if not already created
    if (!document.getElementById('enhanced-hud')) {
        const hud = this.hudSystem.createHUD();
        document.getElementById('game-screen').appendChild(hud);

        // Setup mode button event listeners
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const newMode = e.target.dataset.mode;
                this.hudSystem.setMode(newMode);
            });
        });
    }
    
    this.state = 'playing';
    this.updateDisplay();
    
    // Play initial sound after short delay
    setTimeout(() => {
        this.audioEngine.playSource(this.audioEngine.currentSource, this.clipDuration);
    }, 500);
};

Game.prototype.nextHole = function() {
    document.getElementById('hole-complete').classList.add('hidden');
    
    this.currentHole++;
    
    if (this.currentHole >= this.currentCourse.holes.length) {
        this.completeCourse();
    } else {
        this.startHole();
    }
};

Game.prototype.completeCourse = function() {
    // Build scorecard
    const scorecard = document.getElementById('scorecard');
    scorecard.innerHTML = '';
    
    for (const score of this.scores) {
        const div = document.createElement('div');
        div.className = 'scorecard-hole';
        div.innerHTML = `
            <div>Hole ${score.hole}</div>
            <div>${score.strokes}/${score.par}</div>
        `;
        scorecard.appendChild(div);
    }
    
    // Show final score
    document.getElementById('final-score').textContent = 
        this.score >= 0 ? `+${this.score}` : this.score;
    document.getElementById('total-strokes').textContent = this.totalStrokes;
    
    // Submit to leaderboard
    const leaderboardType = this.hudSystem.getLeaderboardType();
    const playerName = localStorage.getItem('shacgolf_player_name') || prompt('Enter your name:') || 'Anonymous';
    localStorage.setItem('shacgolf_player_name', playerName);
    
    const scoreData = {
        totalScore: this.score,
        totalStrokes: this.totalStrokes,
        courseName: Object.keys(COURSES).find(key => COURSES[key] === this.currentCourse),
        holes: this.currentCourse.holes.length,
        holeScores: this.scores
    };
    
    const result = this.leaderboard.submitScore(scoreData, leaderboardType, playerName);
    
    // Show rank if submitted to competitive board
    if (result && leaderboardType !== 'local-only') {
        const rankDisplay = document.createElement('div');
        rankDisplay.className = 'rank-display';
        rankDisplay.innerHTML = `
            <h3>Leaderboard Rank</h3>
            <p>You placed #${result.rank} out of ${result.total} in ${leaderboardType}</p>
        `;
        document.querySelector('.final-stats').appendChild(rankDisplay);
    }
    
    document.getElementById('course-complete').classList.remove('hidden');
    this.state = 'complete';
};

Game.prototype.restartCourse = function() {
    document.getElementById('course-complete').classList.add('hidden');
    this.currentHole = 0;
    this.totalStrokes = 0;
    this.score = 0;
    this.scores = [];
    this.startHole();
};

Game.prototype.returnToMenu = function() {
    // Hide all overlays
    document.getElementById('hole-complete').classList.add('hidden');
    document.getElementById('course-complete').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('menu-screen').classList.add('active');

    // Stop any playing audio
    this.audioEngine.stopCurrentSource();

    // Stop time trial if running
    if (this.timeTrial && this.timeTrial.isRunning) {
        this.timeTrial.stop();
    }

    // Close all external windows
    if (this.windowManager) {
        this.windowManager.closeAll();
    }

    // Remove HUD
    const hud = document.getElementById('enhanced-hud');
    if (hud) {
        hud.remove();
    }

    // Restore game controls visibility (might have been hidden by time trial)
    const gameControls = document.getElementById('game-controls');
    if (gameControls) {
        gameControls.style.display = 'flex';
    }

    // Restore original golf HUD structure
    const gameHud = document.getElementById('game-hud');
    gameHud.innerHTML = `
        <div class="hud-left">
            <div>Hole <span id="current-hole">1</span> / <span id="total-holes">9</span></div>
            <div>Par <span id="hole-par">3</span></div>
        </div>
        <div class="hud-center">
        </div>
        <div class="hud-right">
            <div>Score: <span id="score">0</span></div>
        </div>
    `;

    this.state = 'menu';
};

Game.prototype.toggleVisualization = function() {
    this.visualization.toggle();
    const btn = document.getElementById('toggle-visual');
    if (btn) {
        btn.textContent = this.visualization.visible ? 'Hide Map' : 'Show Map';
    }
};

Game.prototype.updateDisplay = function() {
    // Position display is handled by HUD system
    
    // Stroke count and score display handled by HUD system
    // Legacy support for old HUD elements
    const strokesElement = document.getElementById('strokes');
    if (strokesElement) {
        strokesElement.textContent = this.strokes;
    }
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        const currentScore = this.score + Math.max(0, this.strokes - this.currentCourse.holes[this.currentHole].par);
        scoreElement.textContent = currentScore >= 0 ? `+${currentScore}` : currentScore;
    }
    
    // Distance display is handled by HUD system
    
    // Update visualization
    if (this.audioEngine.currentSource) {
        this.visualization.draw(
            this.player,
            this.audioEngine.currentSource.position,
            this.strokes
        );
    }
    
    // Update HUD system
    if (this.hudSystem) {
        this.hudSystem.update();
    }
    
    // Update external windows
    if (this.windowManager) {
        this.windowManager.updateAll();
    }
};

Game.prototype.showSettings = function() {
    // Remove existing settings panel if any
    const existing = document.getElementById('settings-panel');
    if (existing) {
        existing.remove();
        return;
    }
    
    // Create and show settings UI
    const settingsPanel = this.settings.createUI();
    document.body.appendChild(settingsPanel);
    this.settings.attachEventListeners();
};

Game.prototype.showLeaderboard = function() {
    // Remove existing leaderboard panel if any
    const existing = document.getElementById('leaderboard-panel');
    if (existing) {
        existing.remove();
        return;
    }
    
    // Create and show leaderboard UI
    const leaderboardPanel = this.leaderboard.createLeaderboardUI();
    document.body.appendChild(leaderboardPanel);
    this.leaderboard.attachEventListeners();
    this.leaderboard.updateLeaderboardDisplay('assisted-competitive');
};

Game.prototype.startTimeTrial = function() {
    // Hide menu
    document.getElementById('menu-screen').classList.remove('active');

    // Setup time trial UI
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.add('active');

    // Hide golf mode controls (swing button and main menu button)
    const gameControls = document.getElementById('game-controls');
    if (gameControls) {
        gameControls.style.display = 'none';
    }

    // Modify HUD for time trial
    document.getElementById('game-hud').innerHTML = `
        <div class="hud-left">
            <div id="timer-display">0:00.0</div>
        </div>
        <div class="hud-center">
            <div id="targets-progress">Target 1 / 5</div>
            <div id="distance-indicator"></div>
        </div>
        <div class="hud-right">
            <button id="toggle-visual">Show Map</button>
            <button id="stop-trial">Stop</button>
        </div>
    `;
    
    // Re-attach visualization toggle
    document.getElementById('toggle-visual').addEventListener('click', () => this.toggleVisualization());
    document.getElementById('stop-trial').addEventListener('click', () => {
        this.timeTrial.stop();
        this.returnToMenu();
    });
    
    // Generate targets and start
    this.timeTrial.generateTargets(this.settings.get('difficulty'));
    this.state = 'playing';
    this.timeTrial.start();
};

// Load additional UI scripts
document.addEventListener('DOMContentLoaded', () => {
    // Start the game
    window.game = new Game();
});