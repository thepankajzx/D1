export let audioCtx = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

export const playTick = () => {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        // A sharp high-to-low pitch drop for a "tick" sound
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) { console.error("Audio error", e); }
};

export const playSuccess = () => {
    try {
        initAudio();
        const t = audioCtx.currentTime;
        
        const playTone = (freq, startOffset, duration) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, t + startOffset);
            gain.gain.linearRampToValueAtTime(0.2, t + startOffset + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + startOffset + duration);
            
            osc.start(t + startOffset);
            osc.stop(t + startOffset + duration);
        };
        
        // A soft chime: D6 to F#6 (pleasant interval)
        playTone(1174.66, 0, 0.15); // D6
        playTone(1479.98, 0.1, 0.3); // F#6
    } catch (e) { console.error("Audio error", e); }
};
