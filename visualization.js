class Visualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.visible = false;
        this.trail = [];
        this.maxTrailLength = 10;
    }

    toggle() {
        this.visible = !this.visible;
        this.canvas.classList.toggle('visible', this.visible);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(listener, target, strokes) {
        if (!this.visible) return;
        
        this.clear();
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 20; // pixels per meter
        
        // Create 3D effect with slight perspective shift
        const perspectiveShift = 0.15; // Small shift to show depth without confusion
        
        // Helper function to get depth-based color (swimming pool effect)
        const getDepthColor = (y, baseColor) => {
            const normalizedY = Math.max(-10, Math.min(10, y)) / 10; // Clamp and normalize
            if (normalizedY > 0) {
                // Above water level - warmer colors (red tint)
                const warmth = Math.floor(normalizedY * 100);
                return baseColor.replace('255, 68, 68', `${255}, ${Math.max(68, 68 + warmth)}, ${Math.max(68, 68 - warmth)}`);
            } else {
                // Below water level - cooler colors (blue tint) 
                const coolness = Math.floor(Math.abs(normalizedY) * 100);
                return baseColor.replace('255, 68, 68', `${Math.max(68, 255 - coolness)}, ${Math.max(68, 68 + coolness/2)}, ${255}`);
            }
        };
        
        // Draw grid with perspective
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
            // Vertical lines (slightly angled for depth)
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + i * scale - i * perspectiveShift, 0);
            this.ctx.lineTo(centerX + i * scale + i * perspectiveShift, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines (slightly compressed for perspective)
            this.ctx.beginPath();
            const yOffset = i * scale * (1 - Math.abs(i) * perspectiveShift * 0.02);
            this.ctx.moveTo(0, centerY + yOffset);
            this.ctx.lineTo(this.canvas.width, centerY + yOffset);
            this.ctx.stroke();
        }
        
        // Draw trail with depth colors
        if (this.trail.length > 1) {
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < this.trail.length; i++) {
                const pos = this.trail[i];
                const x = centerX + pos.x * scale;
                const y = centerY - pos.z * scale;
                
                // Color based on elevation
                const alpha = Math.max(0.2, 1 - i / this.trail.length); // Fade trail
                if (pos.y > 0) {
                    this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`; // Green base
                } else {
                    this.ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`; // Blue for below
                }
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Calculate target circle size based on elevation (your brilliant idea!)
        const targetElevation = target.y;
        const baseTargetSize = 12;
        const targetSize = baseTargetSize + Math.max(-8, Math.min(8, targetElevation * 2)); // Size varies with height
        
        // Draw target with depth color
        const targetX = centerX + target.x * scale;
        const targetY = centerY - target.z * scale;
        
        // Target color based on elevation (swimming pool effect)
        let targetColor = '#ff4444';
        if (targetElevation > 0) {
            // Above - more red/warm
            const warmth = Math.min(100, targetElevation * 20);
            targetColor = `rgb(255, ${Math.max(68, 68 - warmth)}, ${Math.max(68, 68 - warmth)})`;
        } else if (targetElevation < 0) {
            // Below - more blue/cool
            const coolness = Math.min(100, Math.abs(targetElevation) * 20);
            targetColor = `rgb(${Math.max(68, 255 - coolness)}, ${Math.max(68, 68 + coolness/3)}, 255)`;
        }
        
        this.ctx.fillStyle = targetColor;
        this.ctx.beginPath();
        this.ctx.arc(targetX, targetY, targetSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hole radius (also colored by depth)
        this.ctx.strokeStyle = targetColor.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(targetX, targetY, scale, 0, Math.PI * 2); // 1 meter radius
        this.ctx.stroke();
        
        // Calculate listener circle size based on elevation
        const listenerElevation = listener.y;
        const baseListenerSize = 10;
        const listenerSize = baseListenerSize + Math.max(-6, Math.min(6, listenerElevation * 1.5));
        
        // Draw listener with depth color
        const listenerX = centerX + listener.x * scale;
        const listenerY = centerY - listener.z * scale;
        
        let listenerColor = '#00ff88';
        if (listenerElevation > 0) {
            // Above - warmer green
            listenerColor = `rgb(${Math.min(255, Math.abs(listenerElevation) * 10)}, 255, 136)`;
        } else if (listenerElevation < 0) {
            // Below - cooler green/blue
            const coolness = Math.min(100, Math.abs(listenerElevation) * 15);
            listenerColor = `rgb(0, ${255 - coolness/2}, ${136 + coolness})`;
        }
        
        this.ctx.fillStyle = listenerColor;
        this.ctx.beginPath();
        this.ctx.arc(listenerX, listenerY, listenerSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced elevation indicators
        if (Math.abs(target.y) > 0.2) {
            this.ctx.fillStyle = targetColor;
            this.ctx.font = 'bold 12px monospace';
            const elevText = target.y > 0 ? `▲${target.y.toFixed(1)}m` : `▼${Math.abs(target.y).toFixed(1)}m`;
            this.ctx.fillText(elevText, targetX + targetSize + 5, targetY - 5);
        }
        
        if (Math.abs(listener.y) > 0.2) {
            this.ctx.fillStyle = listenerColor;
            this.ctx.font = 'bold 11px monospace';
            const elevText = listener.y > 0 ? `▲${listener.y.toFixed(1)}m` : `▼${Math.abs(listener.y).toFixed(1)}m`;
            this.ctx.fillText(elevText, listenerX + listenerSize + 5, listenerY + 15);
        }
        
        // Distance and info
        const dx = target.x - listener.x;
        const dy = target.y - listener.y;
        const dz = target.z - listener.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText(`Distance: ${distance.toFixed(1)}m`, 10, 25);
        this.ctx.fillText(`Strokes: ${strokes}`, 10, 45);
        
        // 3D coordinates display
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText(`You: (${listener.x.toFixed(1)}, ${listener.y.toFixed(1)}, ${listener.z.toFixed(1)})`, 10, this.canvas.height - 35);
        this.ctx.fillText(`Target: (${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)})`, 10, this.canvas.height - 20);
        
        // Legend
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('🔴 Higher = Bigger + Redder  🔵 Lower = Smaller + Bluer', 10, 65);
    }

    addToTrail(position) {
        this.trail.push({ ...position });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    resetTrail() {
        this.trail = [];
    }
}