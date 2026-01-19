/**
 * @file Particle.ts
 * @description 定义组成文字的粒子类
 */

import { PARTICLE_CONFIG } from "../constants";
import { MouseState } from "../types";

/**
 * 粒子类
 * 用于渲染星空背景中的浮动粒子以及组成文字的 Glowing 粒子
 */
export class Particle {
  x: number = 0;
  y: number = 0;
  destX: number = 0;
  destY: number = 0;
  vx: number = 0;
  vy: number = 0;
  radius: number = 0;
  color: string = "";
  alpha: number = 0;
  isTargeting: boolean = false;
  ease: number = 0;
  width: number;
  height: number;

  // 新增属性：用于模拟星星闪烁的参数
  flickerSpeed: number = 0;
  flickerOffset: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init();
  }

  /**
   * 初始化粒子状态
   */
  init() {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    this.destX = this.x;
    this.destY = this.y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    // 粒子稍微调小一点，显得更精致
    this.radius = Math.random() * 1.2 + 0.3;

    // 从配置的颜色盘中随机取色
    this.color = PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
    this.alpha = Math.random() * 0.6 + 0.4;

    this.isTargeting = false;
    this.ease = 0.05 + Math.random() * 0.05;

    // 闪烁参数初始化
    this.flickerSpeed = 0.002 + Math.random() * 0.005;
    this.flickerOffset = Math.random() * Math.PI * 2;
  }

  /**
   * 更新粒子位置和状态
   * @param mouse 鼠标状态
   */
  update(mouse: MouseState) {
    if (this.isTargeting) {
      // 1. 缓动移动到目标位置 (destX, destY)
      // 增加一点点躁动 (jitter)，模拟星团的不稳定性
      const jitterX = (Math.random() - 0.5) * 0.3;
      const jitterY = (Math.random() - 0.5) * 0.3;

      const dx = this.destX + jitterX - this.x;
      const dy = this.destY + jitterY - this.y;
      this.x += dx * this.ease;
      this.y += dy * this.ease;

      // 2. 文字闪烁逻辑: 模拟星星呼吸
      const now = Date.now();
      const oscillation = Math.sin(now * this.flickerSpeed + this.flickerOffset);
      // alpha 在 0.5 ~ 1.0 之间波动，形成闪烁感
      this.alpha = 0.5 + 0.5 * (0.5 + 0.5 * oscillation);
    } else {
      // 自由移动逻辑
      this.x += this.vx;
      this.y += this.vy;

      // 碰到墙壁反弹
      if (this.x < 0 || this.x > this.width) this.vx *= -1;
      if (this.y < 0 || this.y > this.height) this.vy *= -1;

      // 自由漂浮时稍微变淡，营造景深感
      if (this.alpha > 0.4) this.alpha -= 0.005;
    }

    // 鼠标交互：避开鼠标光标
    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        const angle = Math.atan2(dy, dx);
        const force = (80 - dist) / 80;
        this.x -= Math.cos(angle) * 15 * force;
        this.y -= Math.sin(angle) * 15 * force;
      }
    }
  }

  /**
   * 绘制粒子 - 升级为发光点
   * @param ctx Canvas 上下文
   */
  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;

    ctx.globalAlpha = this.alpha;

    // 如果是组成文字的粒子，或者是较大的自由粒子，绘制辉光
    if (this.isTargeting || (this.radius > 1 && this.alpha > 0.5)) {
      // 绘制中心亮点
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // 绘制外层辉光（简单模拟，避免性能开销过大）
      // 这里不使用 shadowBlur，因为大量粒子 shadowBlur 会极卡
      // 改用绘制一个半透明的大圆
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 普通粒子
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
