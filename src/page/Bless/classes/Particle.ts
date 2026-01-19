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
  offset: number = 0; // 闪烁相位偏移
  width: number;
  height: number;

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
    this.radius = Math.random() * 1.4 + 0.4;
    // 从配置的颜色盘中随机取色
    this.color = PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
    this.alpha = Math.random() * 0.6 + 0.4;
    this.isTargeting = false;
    this.ease = 0.05 + Math.random() * 0.05;
    this.offset = Math.random() * Math.PI * 2;
  }

  /**
   * 更新粒子位置和状态
   * @param mouse 鼠标状态
   */
  update(mouse: MouseState) {
    if (this.isTargeting) {
      // 1. 缓动移动到目标位置 (destX, destY)
      const dx = this.destX - this.x;
      const dy = this.destY - this.y;
      this.x += dx * this.ease;
      this.y += dy * this.ease;

      // 2. 文字闪烁逻辑: 使用 Sine 波浪实现平滑呼吸
      const now = Date.now();
      // 周期大概 2-3秒
      const oscillation = Math.sin(now * 0.003 + this.offset);
      // alpha 在 0.6 ~ 1.0 之间波动
      this.alpha = 0.6 + 0.4 * (0.5 + 0.5 * oscillation);
    } else {
      // 自由移动逻辑
      this.x += this.vx;
      this.y += this.vy;

      // 碰到墙壁反弹
      if (this.x < 0 || this.x > this.width) this.vx *= -1;
      if (this.y < 0 || this.y > this.height) this.vy *= -1;

      // 自由漂浮时稍微变淡
      if (this.alpha > 0.6) this.alpha -= 0.01;
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
   * 绘制粒子
   * @param ctx Canvas 上下文
   */
  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    // 增加光晕效果，但只在组成文字时启用以节省性能
    if (this.isTargeting) {
      // 为了性能，只对较大的粒子加光晕
      if (this.radius > 1) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
      }
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // 重置光晕
  }
}
