/**
 * @file canvasUtils.ts
 * @description Canvas 相关的工具函数，主要用于计算文字粒子点集
 */

import { ParticleConfig, Point } from "../types";

/**
 * 获取一段文字在 Canvas 上的像素点集
 * @param text 需要展示的文本
 * @param width 屏幕宽度
 * @param height 屏幕高度
 * @param config 粒子配置对象（将会更新 fontSize, lineHeight, startY）
 * @returns Point[] 粒子目标点集
 */
export const getPixelPoints = (
  text: string,
  width: number,
  height: number,
  config: ParticleConfig,
): { points: Point[]; lines: string[] } => {
  const tempCanvas = document.createElement("canvas");
  const tCtx = tempCanvas.getContext("2d");
  if (!tCtx) return { points: [], lines: [] };

  tempCanvas.width = width;
  tempCanvas.height = height;
  const isMobile = width < 768;

  // 1. 移动端优化逻辑
  if (isMobile) {
    config.particleCount = 1800; // 减少粒子数以提升性能
  }

  // 动态字体大小计算
  let fontSize = isMobile ? Math.floor(width / 8) : 75;
  if (isMobile && text.length > 10) {
    fontSize = Math.floor(width / 10);
  }

  config.fontSize = fontSize;
  tCtx.textBaseline = "middle";
  tCtx.textAlign = "center";
  tCtx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;

  // 2. 自动换行与手动换行(\n)混合逻辑
  const maxLineWidth = width * 0.9;
  const lines: string[] = [];

  // 先处理显式的换行符 \n
  const normalizedText = text.replace(/\\n/g, "\n");
  const manualLines = normalizedText.split("\n");

  manualLines.forEach((segment) => {
    const segmentMetrics = tCtx.measureText(segment);

    // 如果是移动端或者该行超过最大宽度，则进行自动折行
    if (isMobile || segmentMetrics.width > maxLineWidth) {
      // 特殊处理空行
      if (segment.length === 0) {
        lines.push("");
        return;
      }

      let currentLine = "";
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testLine = currentLine + char;
        const metrics = tCtx.measureText(testLine);

        if (metrics.width > maxLineWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    } else {
      lines.push(segment);
    }
  });

  // 3. 计算布局以垂直居中
  const lineHeight = fontSize * 1.5; // 增加行高，更优雅
  config.lineHeight = lineHeight;
  const totalH = lines.length * lineHeight;
  const startY = height / 2 - totalH / 2 + lineHeight / 2;
  config.startY = startY;

  // 4. 在临时 Canvas 上绘制文字
  lines.forEach((line, index) => {
    tCtx.strokeText(line, width / 2, startY + index * lineHeight);
    tCtx.fillText(line, width / 2, startY + index * lineHeight);
  });

  // 5. 扫描像素数据获取粒子点位
  const imgData = tCtx.getImageData(0, 0, width, height).data;
  const points: Point[] = [];
  const step = isMobile ? 2 : 3;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // 阈值判断：颜色越深越可能是文字主体
      const threshold = isMobile ? 150 : 110;
      if (imgData[(y * width + x) * 4 + 3] > threshold) {
        points.push({ x, y });
      }
    }
  }

  // 返回点集和实际的分行结果（用于 Ghost Text 绘制）
  return { points, lines };
};
