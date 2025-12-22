<template>
    <div class="birthday-container">
        <canvas ref="canvasRef"></canvas>
        <div class="space-overlay"></div>

        <Transition name="fade">
            <div v-if="!started" class="overlay">
                <div class="start-btn" @click="startNarrative">
                    <span>点此 进入属于你的璀璨星空</span>
                </div>
            </div>
        </Transition>

        <!-- 这里可以放播放结束后的额外 UI 元件 -->
        <div v-if="showFinalUI" class="final-content">
            <!-- 例如：出现一封信 -->
            <p class="final-hint">（星空已为你定格）</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const canvasRef = ref(null);
const started = ref(false);
const showFinalUI = ref(false); // 控制结束后显示的额外UI

let ctx = null;
let width = 0;
let height = 0;
let particles = [];
let animationFrame = null;
let currentTextLines = [];
let currentAudio = null;

/**
 * 核心配置：文字、音频、及后续逻辑
 */
const phraseConfig = [
    {
        text: "我想给你所有的爱",
        audio: "", // 填入你的录音文件路径, 如 "/audio/record1.mp3"
        duration: 5000 // 该段文字停留时长
    },
    {
        text: "给你 太古至永劫的思念",
        audio: "", // 不传则不播放音频
        duration: 5500
    },
    {
        text: "生日快乐 我的女孩",
        audio: "",
        duration: 5000,
    },
    {
        text: "生日快乐 陈晓滢",
        audio: "",
        duration: 8000,
        keepLast: true // 结束后不消失，星星永远聚拢
    }
];

// 自定义结束事件
const onAllFinished = () => {
    console.log("所有文案播放完毕");
    showFinalUI.value = true;
    // 你可以在这里写更多逻辑，比如跳转、弹出对话框等
};

const config = {
    particleCount: 2800,
    colors: ['#FFFFFF', '#E1F5FE', '#B3E5FC', '#81D4FA', '#E0F7FA'],
    fontSize: 0,
    lineHeight: 0,
    startY: 0
};

const mouse = { x: -1000, y: -1000, active: false };
let mouseTimer = null;

class Particle {
    constructor() {
        this.init();
    }
    init() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.destX = this.x;
        this.destY = this.y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 1.4 + 0.2;
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.alpha = Math.random() * 0.6 + 0.4;
        this.isTargeting = false;
        this.ease = 0.06 + Math.random() * 0.03;
    }
    update() {
        if (this.isTargeting) {
            this.x += (this.destX - this.x) * this.ease;
            this.y += (this.destY - this.y) * this.ease;
        } else {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        if (mouse.active) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                const angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * 5;
                this.y -= Math.sin(angle) * 5;
            }
        }
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 获取文字采样点
const getPixelPoints = (text) => {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const isMobile = width < 768;
    const fontSize = isMobile ? Math.floor(width / 9.2) : 75;
    config.fontSize = fontSize;
    tCtx.textBaseline = "middle";
    tCtx.textAlign = "center";
    tCtx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;

    const lines = text.split(' ').filter(i => i.trim() !== '');
    currentTextLines = lines;
    const lineHeight = fontSize * 1.5;
    config.lineHeight = lineHeight;
    const totalH = lines.length * lineHeight;
    const startY = (height / 2) - (totalH / 2) + (lineHeight / 2);
    config.startY = startY;

    lines.forEach((line, index) => {
        tCtx.strokeText(line, width / 2, startY + (index * lineHeight));
        tCtx.fillText(line, width / 2, startY + (index * lineHeight));
    });

    const imgData = tCtx.getImageData(0, 0, width, height).data;
    const points = [];
    const step = isMobile ? 2 : 3;
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            if (imgData[(y * width + x) * 4 + 3] > 110) {
                points.push({ x, y });
            }
        }
    }
    return points;
};

// 绘制底层描边底影
const drawTextGhost = () => {
    if (!started.value || currentTextLines.length === 0) return;
    ctx.save();
    ctx.font = `bold ${config.fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(129, 212, 250, 0.12)";
    ctx.lineWidth = 1;
    currentTextLines.forEach((line, index) => {
        ctx.strokeText(line, width / 2, config.startY + (index * config.lineHeight));
    });
    ctx.restore();
};

const animate = () => {
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);
    drawTextGhost();
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    animationFrame = requestAnimationFrame(animate);
};

// 音频播放逻辑
const playVoice = (path) => {
    if (!path) return;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    currentAudio = new Audio(path);
    currentAudio.play().catch(e => console.warn("音频播放被拦截:", e));
};

// 核心叙事流程
const startNarrative = async () => {
    started.value = true;

    for (let i = 0; i < phraseConfig.length; i++) {
        const item = phraseConfig[i];

        // 1. 播放音频
        playVoice(item.audio);

        // 2. 汇聚粒子
        const targetPoints = getPixelPoints(item.text);
        const shuffledPoints = targetPoints.sort(() => 0.5 - Math.random());
        particles.forEach((p, idx) => {
            if (idx < shuffledPoints.length) {
                p.destX = shuffledPoints[idx].x;
                p.destY = shuffledPoints[idx].y;
                p.isTargeting = true;
            } else {
                p.isTargeting = false;
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
            }
        });

        // 3. 等待展示时长
        await new Promise(r => setTimeout(r, item.duration || 5000));

        // 4. 判断是否是最后一句且需要保留
        if (i === phraseConfig.length - 1 && item.keepLast) {
            onAllFinished();
            return; // 流程终止，不执行下方的散开逻辑
        }

        // 5. 散开逻辑
        particles.forEach(p => {
            p.isTargeting = false;
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
        });
        await new Promise(r => setTimeout(r, 1500));
        currentTextLines = [];
    }
};

const handleInteraction = (e) => {
    mouse.active = true;
    const pos = e.touches ? e.touches[0] : e;
    mouse.x = pos.clientX;
    mouse.y = pos.clientY;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => { mouse.active = false; }, 800);
};

const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvasRef.value) {
        canvasRef.value.width = width;
        canvasRef.value.height = height;
    }
};

onMounted(() => {
    nextTick(() => {
        ctx = canvasRef.value.getContext('2d');
        resize();
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
        animate();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('touchstart', handleInteraction, { passive: false });
        window.addEventListener('touchmove', handleInteraction, { passive: false });
    });
});

onUnmounted(() => {
    cancelAnimationFrame(animationFrame);
    if (currentAudio) currentAudio.pause();
});
</script>

<style scoped>
.birthday-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #020408;
    overflow: hidden;
    touch-action: none;
}

canvas {
    display: block;
}

.space-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, rgba(0, 150, 255, 0.08) 0%, transparent 75%);
    z-index: 1;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.start-btn {
    padding: 16px 45px;
    color: #fff;
    font-weight: 200;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 40px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    letter-spacing: 6px;
    cursor: pointer;
}

.final-content {
    position: absolute;
    bottom: 15%;
    width: 100%;
    text-align: center;
    z-index: 10;
    animation: fadeIn 3s ease forwards;
}

.final-hint {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    letter-spacing: 2px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-leave-active {
    transition: opacity 2.5s ease;
}

.fade-leave-to {
    opacity: 0;
}
</style>
