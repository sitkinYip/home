/**
 * @file Star.ts
 * @description 定义星空背景中的静态星星和流星类
 */

/**
 * 背景静止星星类
 * 负责绘制那些微微闪烁的背景星光
 */
export class BgStar {
  x: number;
  y: number;
  size: number;
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
    this.size = Math.random() * 1.5;
    this.baseAlpha = Math.random() * 0.6 + 0.2; // 基础透明度 0.2 ~ 0.8
    this.alpha = this.baseAlpha;
    // 闪烁速度
    this.speed = Math.random() * 0.002 + 0.0005;
    // 闪烁相位的偏移量，保证每颗星星闪烁不同步
    this.offset = Math.random() * Math.PI * 2;
  }

  /**
   * 更新星星状态
   * 使用 Sine 正弦波实现平滑的呼吸闪烁效果
   */
  update() {
    const now = Date.now();
    const oscillation = Math.sin(now * this.speed + this.offset);
    // 透明度在 0.2 ~ 0.8 之间跟随正弦波波动
    this.alpha = 0.2 + 0.6 * (0.5 + 0.5 * oscillation);
  }

  /**
   * 绘制星星
   * @param ctx Canvas 绘图上下文
   */
  draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) return;
    ctx.globalAlpha = Math.abs(this.alpha) * 0.8;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
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
  waitTime: number;
  active: boolean;
  dead: boolean;
  angle: number;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = Math.random() * width;
    // 大部分流星从上半部分出现
    this.y = Math.random() * height * 0.5;
    this.len = Math.random() * 60 + 20;
    this.speed = Math.random() * 8 + 4;
    this.size = Math.random() * 1 + 0.5;
    // 这个 waitTime 可以在外部逻辑控制生成时机，这里仅保留属性
    this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
    this.active = false;
    this.dead = false;
    // 流星角度：45度左右，带微小随机偏移
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
  }

  /**
   * 更新流星位置
   */
  update() {
    if (this.dead) return;
    this.x -= this.speed * Math.cos(this.angle); // 向左下方移动
    this.y += this.speed * Math.sin(this.angle);

    // 如果流星飞出了可视区域，标记为已死亡
    if (this.x < -this.len || this.y > this.height + this.len) {
      this.dead = true;
    }
  }

  /**
   * 绘制流星
   * @param ctx Canvas 上下文
   */
  draw(ctx: CanvasRenderingContext2D | null) {
    if (this.dead || !ctx) return;
    ctx.globalAlpha = 1;

    // 绘制流星尾巴（渐变线条）
    const tailX = this.x + this.len * Math.cos(this.angle);
    const tailY = this.y - this.len * Math.sin(this.angle);

    const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    // 绘制流星头部的光晕
    ctx.beginPath();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fff";
    ctx.fillStyle = "#fff";
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // 重置光晕，避免影响其他绘制
  }
}
