/**
 * @file constants.ts
 * @description 存放 Bless 页面的所有常量配置
 */

import { ParticleConfig } from "./types";

/**
 * 粒子系统的核心配置
 * 根据设备性能和设计需求调整粒子数量和颜色
 */
export const PARTICLE_CONFIG: ParticleConfig = {
  // 粒子总数，根据需要动态调整（移动端会覆盖此值）
  particleCount: 2200,
  // 粒子颜色盘：纯白、柔黄、浅蓝、淡青
  colors: ["#ffffff", "#fffae3", "#b4e4ff", "#e0f7fa"],
  fontSize: 0, // 将在运行时通过 canvas 计算动态设置
  lineHeight: 0, // 将在运行时计算
  startY: 0, // 将在运行时计算
};
