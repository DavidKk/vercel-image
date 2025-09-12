import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'

/**
 * 将百分比值转换为像素值
 * @param value 百分比值或像素值
 * @param total 总像素值
 * @returns 转换后的像素值
 */
export function convertPercentageToPixel(value: number | string, total: number): number {
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = parseFloat(value.replace('%', ''))
    return (percentage / 100) * total
  }

  return typeof value === 'number' ? value : parseFloat(value)
}

/**
 * 应用元素属性默认值
 * @param element 图片元素
 * @returns 应用默认值后的元素
 */
export function applyElementDefaults(element: Partial<ImageElement>) {
  return {
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? '100%',
    height: element.height ?? '100%',
    ...element,
  }
}

/**
 * 工具：给定总长、段数、间距，返回每段长度（优先保证完全铺满屏幕）
 * @param totalLen 总长度
 * @param segments 段数
 * @param gap 间距
 * @returns 每段的尺寸数组
 */
export function distributeSizes(totalLen: number, segments: number, gap: number): number[] {
  // 计算总间隙
  const totalGaps = (segments - 1) * gap
  // 计算去掉间隙后的可用长度
  const inner = totalLen - totalGaps

  // 如果可用长度小于等于0，说明间隙太大，需要调整
  if (inner <= 0) {
    // 在这种情况下，我们将间隙设置为0，平均分配总长度
    const base = totalLen / segments
    return new Array(segments).fill(base)
  }

  // 计算每段的基础长度（使用浮点数）
  const base = inner / segments

  // 创建结果数组
  const sizes: number[] = []
  let accumulated = 0

  // 为前segments-1个元素计算尺寸
  for (let i = 0; i < segments - 1; i++) {
    const nextAccumulated = (i + 1) * base
    const size = Math.round(nextAccumulated - accumulated)
    sizes.push(size)
    accumulated += size
  }

  // 最后一个元素的尺寸确保总长度完全匹配
  const lastSize = totalLen - accumulated - totalGaps
  sizes.push(lastSize)

  return sizes
}

/**
 * 深拷贝布局配置
 * @param schema 原始布局配置
 * @returns 深拷贝后的布局配置
 */
export function cloneSchema<T extends LayoutSchema>(schema: T): T {
  return JSON.parse(JSON.stringify(schema))
}
