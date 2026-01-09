/**
 * 将 px 转换为视口单位 (vw)
 * 默认设计稿宽度 390
 * @param n px数值
 * @returns 转换后的 CSS 字符串
 */
export const toVpx = (n: number): string => {
  const vw = ((n / 390) * 100).toFixed(5);
  const maxPx = ((n / 390) * 480).toFixed(5);

  if (n < 0) {
    return `max(${vw}vw, ${maxPx}px)`;
  }
  return `min(${vw}vw, ${maxPx}px)`;
};
