/**
 * @file Star.ts
 * @description 定义星空背景中的静态星星和流星类
 */

/**
 * 星星颜色配置 - 增加冷暖色调变化，更真实
 */
const STAR_COLORS = [
  "#ffffff", // 纯白
  "#f0f8ff", // AliceBlue (冷白)
  "#e0ffff", // LightCyan (微蓝)
  "#fffacd", // LemonChiffon (暖金)
  "#f0e68c", // Khaki (暗金)
];

/**
 * 背景静止星星类
 * 负责绘制那些微微闪烁的背景星光
 */
export class BgStar {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  speed: number;
  offset: number;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    // 增加星星大小的随机性，制造远近感
    this.size = Math.random() * 1.5 + 0.3;
    // 随机颜色
    this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

    // 基础透明度 0.1 ~ 0.7，越大的星星通常越亮
    this.baseAlpha = Math.random() * 0.6 + 0.1;
    this.alpha = this.baseAlpha;

    // 闪烁速度 - 不规则
    this.speed = Math.random() * 0.003 + 0.0005;
    this.offset = Math.random() * Math.PI * 2;
  }

  /**
   * 更新星星状态
   * 使用组合波形实现非线性闪烁，模拟真实大气的扰动
   */
  update() {
    const now = Date.now();
    // 主波 + 次波，打破单调的呼吸感
    const oscillation1 = Math.sin(now * this.speed + this.offset);
    const oscillation2 = Math.sin(now * (this.speed * 2.5) + this.offset);

    const combined = (oscillation1 + oscillation2 * 0.5) / 1.5; // webgl-like normalization

    // 透明度围绕基础值波动，幅度由 baseAlpha 决定
    // 基础越亮，闪烁幅度可能越明显
    this.alpha = this.baseAlpha + combined * 0.3 * this.baseAlpha;

    // 钳制范围
    if (this.alpha < 0) this.alpha = 0;
    if (this.alpha > 1) this.alpha = 1;
  }

  /**
   * 绘制星星
   * @param ctx Canvas 绘图上下文
   */
  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // 偶尔给大星星加一点点辉光
    if (this.size > 1.2 && this.alpha > 0.5) {
      ctx.shadowBlur = 4;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

/**
 * 流星类
 * 负责绘制划过天际的流星效果
 */
export class ShootingStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  size: number;
  active: boolean;
  dead: boolean;
  angle: number;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // 出现范围更广
    this.x = Math.random() * width * 1.2 - width * 0.1;
    this.y = Math.random() * height * 0.6; // 限制在上半部分区域

    this.len = Math.random() * 120 + 60; // 更长的拖尾
    this.speed = Math.random() * 15 + 10; // 更快的速度
    this.size = Math.random() * 1.5 + 0.5;

    this.active = false;
    this.dead = false;
    // 角度更统一，呈现流星雨的感觉 (-30度到-60度)
    // 注意 canvas y轴向下，所以往右下飞是正角度
    // 这里设为往左下飞 (PI - PI/4) 或 右下 (PI/4)
    // 还是保持原来的右下，但角度微调
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.1;
  }

  update() {
    if (this.dead) return;
    this.x -= this.speed * Math.cos(this.angle); // 向左下飘 (原逻辑是x减，那就是向左)
    this.y += this.speed * Math.sin(this.angle);

    if (this.x < -this.len || this.y > this.height + this.len) {
      this.dead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D | null) {
    if (this.dead || !ctx) return;

    // 头部是亮的，尾部渐隐
    const tailX = this.x + this.len * Math.cos(this.angle);
    const tailY = this.y - this.len * Math.sin(this.angle);

    // 优化的径向光晕（头部）
    const gradientHead = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
    gradientHead.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradientHead.addColorStop(0.4, "rgba(200, 220, 255, 0.4)");
    gradientHead.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.globalAlpha = 1;
    ctx.fillStyle = gradientHead;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // 优化的线性拖尾
    const gradientTail = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    gradientTail.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradientTail.addColorStop(0.3, "rgba(180, 200, 255, 0.2)");
    gradientTail.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.strokeStyle = gradientTail;
    ctx.lineWidth = this.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
  }
}

/**
 * 星球类
 * 绘制朦胧的背景星球，增加宇宙深邃感
 */
export class Planet {
  x: number;
  y: number;
  radius: number;
  color: string;
  gradient: CanvasGradient | null = null;
  width: number;
  height: number;
  type: "gas-giant" | "moon" | "terrestrial";

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    // 随机生成位置，避开心画面中心，通常在角落
    // 0: 左上, 1: 右下
    const corner = Math.random() > 0.5 ? 0 : 1;
    if (corner === 0) {
      this.x = Math.random() * width * 0.3;
      this.y = Math.random() * height * 0.3;
    } else {
      this.x = width - Math.random() * width * 0.3;
      this.y = height - Math.random() * height * 0.3;
    }

    this.radius = Math.random() * 80 + 40; // 40 ~ 120 大小

    const colors = [
      { start: "rgba(100, 149, 237, 0.2)", end: "rgba(100, 149, 237, 0)" }, // CornflowerBlue
      { start: "rgba(216, 191, 216, 0.2)", end: "rgba(216, 191, 216, 0)" }, // Thistle (Purple)
      { start: "rgba(255, 182, 193, 0.15)", end: "rgba(255, 182, 193, 0)" }, // LightPink
    ];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    this.color = randColor.start;
    this.type = Math.random() > 0.5 ? "gas-giant" : "terrestrial";
  }

  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;

    // 缓存渐变以优化性能
    if (!this.gradient) {
      this.gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        this.radius * 0.2,
        this.x,
        this.y,
        this.radius,
      );
      // 核心微亮
      this.gradient.addColorStop(0, this.color);
      // 边缘透明，融合背景
      this.gradient.addColorStop(1, "rgba(0,0,0,0)");
    }

    ctx.fillStyle = this.gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制光环 (如果类型匹配)
    if (this.type === "gas-giant") {
      const ringGradient = ctx.createRadialGradient(
        this.x,
        this.y,
        this.radius * 1.2,
        this.x,
        this.y,
        this.radius * 1.6,
      );
      ringGradient.addColorStop(0, "rgba(255,255,255,0)");
      ringGradient.addColorStop(0.5, "rgba(255,255,255,0.03)"); // 极低透明度
      ringGradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = ringGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 星云类
 * 绘制漂浮的云雾状色彩，增加背景层次
 */
export class Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 200 + 150; // 巨大

    // 深空色系：紫、蓝、品红
    const colors = [
      "rgba(75, 0, 130, 0.03)", // Indigo
      "rgba(138, 43, 226, 0.03)", // BlueViolet
      "rgba(0, 0, 139, 0.03)", // DarkBlue
      "rgba(199, 21, 133, 0.03)", // MediumVioletRed
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    // 极慢漂浮
    this.vx = (Math.random() - 0.5) * 0.05;
    this.vy = (Math.random() - 0.5) * 0.05;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // 简单回弹，保持在画面内附近
    if (this.x < -this.radius) this.x = this.width + this.radius;
    if (this.x > this.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = this.height + this.radius;
    if (this.y > this.height + this.radius) this.y = -this.radius;
  }

  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;

    // 使用径向渐变模拟柔和的云雾
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    g.addColorStop(0, this.color);
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
