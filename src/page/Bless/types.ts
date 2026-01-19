/**
 * @file types.ts
 * @description 定义 Bless 页面及其组件所需的所有类型接口
 */

export interface ParticleConfig {
  particleCount: number;
  colors: string[];
  fontSize: number;
  lineHeight: number;
  startY: number;
}

export interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

export interface Point {
  x: number;
  y: number;
}
