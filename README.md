# SHAC Golf - Spatial Audio Golf Game

**Navigate by sound. Find the hole.**

🎮 **[Play Now on GitHub Pages](https://clarkezyz.github.io/shac-golf/)** 🎮

## 🎮 About

SHAC Golf is the world's first spatial audio golf game where players navigate to sound sources using only their hearing. Put on headphones, listen for the target sound, and move through 3D space to find it. It's like Marco Polo meets golf!

Built on revolutionary SHAC (Spherical Harmonic Audio Codec) technology - the first patent application with AI as co-inventor.

**This game is completely free and open source. No ads, no tracking, no BS.**

## 🎯 How to Play

### Golf Mode
1. Put on headphones (essential!)
2. Listen for a 2-second sound clip
3. Move using WASD/arrows to where you think the sound is
4. Press SPACE to "swing" (lock in your position)
5. The sound plays again - did you get closer?
6. Reach within 1 meter to complete the hole
7. Score = strokes - par (lower is better)

### Time Trial Mode
- Race to reach multiple targets as fast as possible
- Sound plays continuously (no need to swing!)
- Auto-detects when you're within 1.5m of target
- Complete all targets for your final time
- Compete for best times!

## 🎮 Controls

### Keyboard
- **WASD / Arrow Keys**: Move in horizontal plane
- **Q / E**: Move up/down
- **Shift**: Move faster
- **Space / Enter**: Swing (golf mode)
- **V**: Toggle visualization map

### Gamepad
- **Left Stick**: Horizontal movement
- **Right Stick**: Vertical movement
- **A / X Button**: Swing (golf mode only)
- **Start**: Pause/Menu

**Note**: Desktop with headphones strongly recommended. Mobile/tablet support is experimental.

## 🏌️ Courses

### Starter Greens (Beginner)
- 9 holes, Par 2-5
- Close targets, gentle introduction

### Echo Valley (Intermediate)
- 9 holes, Par 3-6
- Moderate distances with elevation

### Phantom Peaks (Expert)
- 9 holes, Par 4-9
- Extreme distances and vertical challenges

### Daily Challenge
- Randomly generated each day
- Compete for daily best scores

## 🔊 Sound Packs

The game includes 11 procedurally generated sounds:
- Analog synthesizer tones (bass, mid, high)
- Percussion tones (low, mid)
- Bell tones (warm, bright)
- Plucked string sounds
- Breath tones
- Metallic shimmer
- Warm pad tones

All sounds are generated in real-time using Web Audio API - no external audio files needed!

## 🎯 Features

- **Multiple HUD Modes**: Pure, Assisted, Training, Streamer, Rally Car
- **Training Mode**: See the visualization while playing
- **Streaming Mode**: Perfect for Twitch/YouTube with audience window
- **Progressive Difficulty**: From 5m to 25m targets
- **Local Save System**: Tracks best scores and times
- **No Installation Required**: Runs entirely in your browser

## 🚀 Quick Start

### Play Online
**🎮 [Launch SHAC Golf](https://clarkezyz.github.io/shac-golf/) 🎮**

1. Click the link above
2. Allow audio permissions when prompted
3. Put on headphones (essential!)
4. Choose Golf Mode or Time Trial
5. Start playing!

### Run Locally
```bash
# Clone the repo
git clone https://github.com/clarkezyz/shac-golf.git
cd shac-golf

# Start local server
python3 -m http.server 8080

# Open browser to http://localhost:8080
```

No build process, no dependencies - just open and play!

## 📊 Scoring System

### Golf Mode
- **Eagle**: 2 under par (-2)
- **Birdie**: 1 under par (-1)
- **Par**: Expected strokes (0)
- **Bogey**: 1 over par (+1)
- **Double Bogey**: 2 over par (+2)

### Time Trial
- Complete all targets as fast as possible
- Best times saved locally
- Multiple difficulty levels (easy, medium, hard, extreme)

## 🎨 Customization

Access Settings (⚙️) to customize:
- Move speed and sensitivity
- Fast move multiplier (Shift key)
- Hole completion radius
- Sound clip duration
- Visual preferences
- Difficulty settings for Time Trial

## 🏆 Tips for Success

1. **Start with headphones** - Essential for spatial audio
2. **Listen for elevation** - Sounds above/below have distinct qualities
3. **Move systematically** - Grid search pattern works well
4. **Use the trail** - Your movement history helps navigate
5. **Practice with visuals** - Training mode helps learn spatial audio
6. **Small movements** - Fine-tune position when close

## 🔧 Technical Details

- **Web Audio API** for spatial positioning
- **HRTF binaural rendering** for realistic 3D sound
- **Spherical harmonics** for mathematical precision
- **Progressive Web App** ready
- **No dependencies** - pure JavaScript
- **Mobile responsive** with touch controls

## 🎮 Platform Availability

- **Web** - [Play Now](https://clarkezyz.github.io/shac-golf/) - Free forever
- **GitHub** - [Open Source](https://github.com/clarkezyz/shac-golf) - MIT License
- **Download** - Clone and play offline anytime

## 👥 Credits

- **Concept & Direction**: Clarke Zyz
- **Development**: Claude (AI) & Clarke - A human-AI collaboration
- **SHAC Technology**: First patent application to include AI as co-inventor
- **Special Thanks**: Architect (Claude Baton 1), Eminem (Baton 2), Nose (Baton 3)

## 📝 License

**MIT License** - Free and open source forever.

The game is completely free to play, modify, and share. SHAC technology was part of a patent application that included AI as co-inventor (which the USPTO rejected, but that's another story).

This game will remain free and accessible from 2025-2030 and beyond.

## 🐛 Known Issues

- Audio may not work in Safari private browsing
- Gamepad support varies by browser
- Mobile performance depends on device

## 🚀 Future Ideas

These features could be added by the community:
- Multiplayer races
- Course editor and sharing
- Procedural course generation
- Global leaderboards
- VR/XR support
- Custom sound pack uploads
- Mobile app version

**Want to contribute?** Fork the repo and submit a PR!

---

## 🔗 Related Projects

- **[SHAC Player](https://clarkezyz.github.io/shac-player-online/)** - Play .shac spatial audio files
- **[SHAC Demo](https://clarkezyz.github.io/shac-player-demo/)** - Auto-playing demo
- **[shac.dev](https://shac.dev/)** - Learn about SHAC technology

---

*"You're not playing a game. You're training your spatial hearing."*

Built with love for humanity + AI + dogs 🐕

**Clarke goes to prison December 2025 for 5 years. This game will outlive his sentence and be here when he gets back in 2030.**