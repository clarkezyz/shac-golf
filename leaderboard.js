// Leaderboard System - Separate tracking for different modes
class LeaderboardSystem {
    constructor() {
        this.boards = {
            'pure-competitive': {
                name: 'Pure Mode - Global',
                icon: '🏆',
                scores: [],
                allowedHUD: ['strokes', 'hole', 'timer'],
                description: 'No assistance - pure spatial audio navigation'
            },
            'assisted-competitive': {
                name: 'Assisted Mode - Competitive',
                icon: '📊',
                scores: [],
                allowedHUD: ['strokes', 'hole', 'timer', 'compass', 'distance'],
                description: 'Compass and distance assistance allowed'
            },
            'local-only': {
                name: 'Training Mode - Local',
                icon: '🎓',
                scores: [],
                allowedHUD: 'all',
                description: 'All HUD elements allowed - practice mode'
            }
        };
        
        this.currentBoard = 'assisted-competitive';
        this.loadScores();
    }
    
    loadScores() {
        // Load from localStorage for now (would be server API later)
        Object.keys(this.boards).forEach(boardType => {
            const saved = localStorage.getItem(`shacgolf_leaderboard_${boardType}`);
            if (saved) {
                try {
                    this.boards[boardType].scores = JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to load leaderboard:', e);
                }
            }
        });
    }
    
    saveScores() {
        Object.keys(this.boards).forEach(boardType => {
            localStorage.setItem(
                `shacgolf_leaderboard_${boardType}`,
                JSON.stringify(this.boards[boardType].scores)
            );
        });
    }
    
    submitScore(score, boardType, playerName = 'Anonymous') {
        if (!this.boards[boardType]) return false;
        
        const entry = {
            player: playerName,
            score: score.totalScore,
            strokes: score.totalStrokes,
            course: score.courseName,
            holes: score.holes,
            date: new Date().toISOString(),
            hudMode: boardType,
            details: score.holeScores || []
        };
        
        // Add to appropriate board
        this.boards[boardType].scores.push(entry);
        
        // Sort by score (lower is better in golf)
        this.boards[boardType].scores.sort((a, b) => {
            if (a.score === b.score) {
                return a.strokes - b.strokes; // Tie-breaker
            }
            return a.score - b.score;
        });
        
        // Keep only top 100
        this.boards[boardType].scores = this.boards[boardType].scores.slice(0, 100);
        
        this.saveScores();
        
        // Return rank
        const rank = this.boards[boardType].scores.findIndex(s => 
            s.date === entry.date && s.player === entry.player
        ) + 1;
        
        return { rank, total: this.boards[boardType].scores.length };
    }
    
    getTopScores(boardType, course = null, limit = 10) {
        if (!this.boards[boardType]) return [];
        
        let scores = this.boards[boardType].scores;
        
        if (course) {
            scores = scores.filter(s => s.course === course);
        }
        
        return scores.slice(0, limit);
    }
    
    getPersonalBest(boardType, playerName, course = null) {
        if (!this.boards[boardType]) return null;
        
        let scores = this.boards[boardType].scores.filter(s => s.player === playerName);
        
        if (course) {
            scores = scores.filter(s => s.course === course);
        }
        
        return scores[0] || null; // Already sorted by score
    }
    
    createLeaderboardUI() {
        const container = document.createElement('div');
        container.id = 'leaderboard-panel';
        container.className = 'leaderboard-panel';
        container.innerHTML = `
            <h2>Leaderboards</h2>
            
            <div class="leaderboard-tabs">
                <button class="lb-tab active" data-board="pure-competitive">
                    🏆 Pure Mode
                </button>
                <button class="lb-tab" data-board="assisted-competitive">
                    📊 Assisted
                </button>
                <button class="lb-tab" data-board="local-only">
                    🎓 Training
                </button>
            </div>
            
            <div class="board-description">
                <p id="board-desc">No assistance - pure spatial audio navigation</p>
            </div>
            
            <div class="course-filter">
                <label>Course:</label>
                <select id="course-filter">
                    <option value="">All Courses</option>
                    <option value="beginner">Starter Greens</option>
                    <option value="intermediate">Echo Valley</option>
                    <option value="expert">Phantom Peaks</option>
                    <option value="daily">Daily Challenge</option>
                </select>
            </div>
            
            <div class="leaderboard-list">
                <table id="scores-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                            <th>Strokes</th>
                            <th>Course</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="scores-body">
                        <!-- Scores will be inserted here -->
                    </tbody>
                </table>
            </div>
            
            <div class="personal-stats">
                <h3>Your Best</h3>
                <div id="personal-best">
                    <p>No scores yet in this mode</p>
                </div>
            </div>
            
            <div class="leaderboard-footer">
                <button id="close-leaderboard">Close</button>
                <button id="clear-local-scores">Clear Local Scores</button>
            </div>
        `;
        
        return container;
    }
    
    updateLeaderboardDisplay(boardType, course = null) {
        const scores = this.getTopScores(boardType, course, 20);
        const tbody = document.getElementById('scores-body');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No scores yet</td></tr>';
            return;
        }
        
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            
            // Highlight top 3
            if (index < 3) {
                row.className = `rank-${index + 1}`;
            }
            
            // Format score display
            const scoreDisplay = score.score >= 0 ? `+${score.score}` : score.score.toString();
            
            // Format date
            const date = new Date(score.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.escapeHtml(score.player)}</td>
                <td class="score-cell">${scoreDisplay}</td>
                <td>${score.strokes}</td>
                <td>${this.getCourseDisplayName(score.course)}</td>
                <td>${dateStr}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update description
        const desc = document.getElementById('board-desc');
        if (desc) {
            desc.textContent = this.boards[boardType].description;
        }
        
        // Update personal best
        this.updatePersonalBest(boardType, course);
    }
    
    updatePersonalBest(boardType, course = null) {
        const playerName = localStorage.getItem('shacgolf_player_name') || 'Anonymous';
        const best = this.getPersonalBest(boardType, playerName, course);
        const container = document.getElementById('personal-best');
        
        if (!container) return;
        
        if (best) {
            const scoreDisplay = best.score >= 0 ? `+${best.score}` : best.score.toString();
            container.innerHTML = `
                <div class="personal-best-score">
                    <span class="label">Score:</span>
                    <span class="value">${scoreDisplay}</span>
                </div>
                <div class="personal-best-strokes">
                    <span class="label">Strokes:</span>
                    <span class="value">${best.strokes}</span>
                </div>
                <div class="personal-best-course">
                    <span class="label">Course:</span>
                    <span class="value">${this.getCourseDisplayName(best.course)}</span>
                </div>
                <div class="personal-best-rank">
                    <span class="label">Rank:</span>
                    <span class="value">#${this.getPlayerRank(boardType, playerName, course)}</span>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No scores yet in this mode</p>';
        }
    }
    
    getPlayerRank(boardType, playerName, course = null) {
        let scores = this.boards[boardType].scores;
        
        if (course) {
            scores = scores.filter(s => s.course === course);
        }
        
        const playerScores = scores.filter(s => s.player === playerName);
        if (playerScores.length === 0) return '-';
        
        const bestScore = playerScores[0];
        return scores.findIndex(s => s === bestScore) + 1;
    }
    
    getCourseDisplayName(courseKey) {
        const names = {
            'beginner': 'Starter Greens',
            'intermediate': 'Echo Valley',
            'expert': 'Phantom Peaks',
            'randomDaily': 'Daily Challenge'
        };
        return names[courseKey] || courseKey;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const boardType = e.target.dataset.board;
                const course = document.getElementById('course-filter')?.value;
                this.updateLeaderboardDisplay(boardType, course);
            });
        });
        
        // Course filter
        document.getElementById('course-filter')?.addEventListener('change', (e) => {
            const activeTab = document.querySelector('.lb-tab.active');
            const boardType = activeTab?.dataset.board || 'assisted-competitive';
            this.updateLeaderboardDisplay(boardType, e.target.value || null);
        });
        
        // Close button
        document.getElementById('close-leaderboard')?.addEventListener('click', () => {
            document.getElementById('leaderboard-panel')?.remove();
        });
        
        // Clear local scores
        document.getElementById('clear-local-scores')?.addEventListener('click', () => {
            if (confirm('Clear all local scores? This cannot be undone.')) {
                Object.keys(this.boards).forEach(boardType => {
                    this.boards[boardType].scores = [];
                });
                this.saveScores();
                this.updateLeaderboardDisplay('assisted-competitive');
            }
        });
    }
}

// Leaderboard CSS
const leaderboardStyle = document.createElement('style');
leaderboardStyle.textContent = `
    .leaderboard-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 20px;
        width: 700px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
    }
    
    .leaderboard-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .lb-tab {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        border-radius: 5px;
        transition: all 0.2s;
    }
    
    .lb-tab.active {
        background: rgba(0, 255, 136, 0.2);
        border-color: #00ff88;
    }
    
    .board-description {
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
        margin-bottom: 15px;
        font-style: italic;
        color: #aaa;
    }
    
    .course-filter {
        margin-bottom: 15px;
    }
    
    .course-filter select {
        padding: 5px 10px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 5px;
    }
    
    .leaderboard-list {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
    }
    
    #scores-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    #scores-table th {
        padding: 8px;
        text-align: left;
        border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        color: #00ff88;
    }
    
    #scores-table td {
        padding: 6px 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .rank-1 { background: rgba(255, 215, 0, 0.1); }
    .rank-2 { background: rgba(192, 192, 192, 0.1); }
    .rank-3 { background: rgba(205, 127, 50, 0.1); }
    
    .score-cell {
        font-weight: bold;
        color: #00ff88;
    }
    
    .personal-stats {
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
    }
    
    .personal-stats h3 {
        margin-bottom: 10px;
        color: #00ff88;
    }
    
    #personal-best {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    #personal-best > div {
        display: flex;
        flex-direction: column;
    }
    
    #personal-best .label {
        font-size: 12px;
        color: #888;
    }
    
    #personal-best .value {
        font-size: 18px;
        font-weight: bold;
        color: white;
    }
    
    .leaderboard-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
`;
document.head.appendChild(leaderboardStyle);