const COURSES = {
    beginner: {
        name: "Starter Greens",
        difficulty: "Beginner",
        holes: [
            { 
                number: 1, 
                par: 2, 
                target: { x: 5, y: 0, z: 0 },
                audioFile: "sounds/tone_440.wav",
                description: "Straight ahead, 5 meters"
            },
            { 
                number: 2, 
                par: 2, 
                target: { x: 0, y: 0, z: 5 },
                audioFile: "sounds/tone_440.wav",
                description: "Forward, 5 meters"
            },
            { 
                number: 3, 
                par: 3, 
                target: { x: -4, y: 0, z: 3 },
                audioFile: "sounds/tone_440.wav",
                description: "Left and forward"
            },
            { 
                number: 4, 
                par: 3, 
                target: { x: 3, y: 2, z: 4 },
                audioFile: "sounds/tone_440.wav",
                description: "Right, forward, and up"
            },
            { 
                number: 5, 
                par: 3, 
                target: { x: -5, y: -1, z: -2 },
                audioFile: "sounds/tone_440.wav",
                description: "Left, back, and down"
            },
            { 
                number: 6, 
                par: 4, 
                target: { x: 6, y: 3, z: 5 },
                audioFile: "sounds/tone_440.wav",
                description: "Far corner, elevated"
            },
            { 
                number: 7, 
                par: 4, 
                target: { x: -7, y: 0, z: -4 },
                audioFile: "sounds/tone_440.wav",
                description: "Behind and left"
            },
            { 
                number: 8, 
                par: 4, 
                target: { x: 4, y: -2, z: -6 },
                audioFile: "sounds/tone_440.wav",
                description: "Back, right, and low"
            },
            { 
                number: 9, 
                par: 5, 
                target: { x: 8, y: 4, z: 7 },
                audioFile: "sounds/tone_440.wav",
                description: "Far elevated corner"
            }
        ]
    },
    
    intermediate: {
        name: "Echo Valley",
        difficulty: "Intermediate",
        holes: [
            { 
                number: 1, 
                par: 3, 
                target: { x: 7, y: 2, z: 3 },
                audioFile: "sounds/chime.wav",
                description: "Moderate distance with elevation"
            },
            { 
                number: 2, 
                par: 3, 
                target: { x: -6, y: -2, z: 5 },
                audioFile: "sounds/chime.wav",
                description: "Left depression"
            },
            { 
                number: 3, 
                par: 4, 
                target: { x: 5, y: 5, z: -6 },
                audioFile: "sounds/chime.wav",
                description: "High and behind"
            },
            { 
                number: 4, 
                par: 4, 
                target: { x: -8, y: 3, z: 7 },
                audioFile: "sounds/chime.wav",
                description: "Far left elevated"
            },
            { 
                number: 5, 
                par: 5, 
                target: { x: 10, y: -3, z: 8 },
                audioFile: "sounds/chime.wav",
                description: "Long distance with drop"
            },
            { 
                number: 6, 
                par: 5, 
                target: { x: -9, y: 6, z: -7 },
                audioFile: "sounds/chime.wav",
                description: "Behind, left, very high"
            },
            { 
                number: 7, 
                par: 5, 
                target: { x: 11, y: 4, z: 9 },
                audioFile: "sounds/chime.wav",
                description: "Maximum distance"
            },
            { 
                number: 8, 
                par: 6, 
                target: { x: -12, y: -5, z: -10 },
                audioFile: "sounds/chime.wav",
                description: "Far back corner, low"
            },
            { 
                number: 9, 
                par: 6, 
                target: { x: 15, y: 7, z: 12 },
                audioFile: "sounds/chime.wav",
                description: "Extreme distance challenge"
            }
        ]
    },
    
    expert: {
        name: "Phantom Peaks",
        difficulty: "Expert",
        holes: [
            { 
                number: 1, 
                par: 4, 
                target: { x: 10, y: 5, z: 7 },
                audioFile: "sounds/bell.wav",
                description: "Challenging start"
            },
            { 
                number: 2, 
                par: 5, 
                target: { x: -12, y: -6, z: 9 },
                audioFile: "sounds/bell.wav",
                description: "Deep valley left"
            },
            { 
                number: 3, 
                par: 5, 
                target: { x: 8, y: 10, z: -11 },
                audioFile: "sounds/bell.wav",
                description: "High altitude behind"
            },
            { 
                number: 4, 
                par: 6, 
                target: { x: -15, y: 8, z: 13 },
                audioFile: "sounds/bell.wav",
                description: "Extreme left elevation"
            },
            { 
                number: 5, 
                par: 6, 
                target: { x: 18, y: -7, z: 14 },
                audioFile: "sounds/bell.wav",
                description: "Far ravine"
            },
            { 
                number: 6, 
                par: 7, 
                target: { x: -17, y: 12, z: -15 },
                audioFile: "sounds/bell.wav",
                description: "Mountain peak behind"
            },
            { 
                number: 7, 
                par: 7, 
                target: { x: 20, y: 10, z: 18 },
                audioFile: "sounds/bell.wav",
                description: "Maximum range elevated"
            },
            { 
                number: 8, 
                par: 8, 
                target: { x: -22, y: -10, z: -19 },
                audioFile: "sounds/bell.wav",
                description: "Deep canyon behind"
            },
            { 
                number: 9, 
                par: 9, 
                target: { x: 25, y: 15, z: 20 },
                audioFile: "sounds/bell.wav",
                description: "Ultimate challenge"
            }
        ]
    },
    
    randomDaily: {
        name: "Daily Challenge",
        difficulty: "Random",
        generateHoles: function() {
            const holes = [];
            const seed = new Date().toDateString();
            const random = mulberry32(hashCode(seed));
            
            for (let i = 1; i <= 9; i++) {
                const difficulty = Math.floor(random() * 3) + 1; // 1-3
                const range = difficulty * 8; // 8, 16, or 24 meters max
                
                holes.push({
                    number: i,
                    par: Math.floor(random() * 3) + difficulty + 1, // 2-7
                    target: {
                        x: (random() - 0.5) * range * 2,
                        y: (random() - 0.5) * range,
                        z: (random() - 0.5) * range * 2
                    },
                    audioFile: "sounds/tone_440.wav",
                    description: `Random hole ${i}`
                });
            }
            
            return holes;
        }
    }
};

// Seeded random number generator for daily challenges
function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}