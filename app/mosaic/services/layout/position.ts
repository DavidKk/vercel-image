import type { ImageElement, LayoutSchema, Position } from '@/app/mosaic/types'

import { applyElementDefaults, convertPercentageToPixel } from './utils'

/**
 * 计算元素的实际位置和尺寸
 * @param element 图片元素
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param padding 内容与画布边缘的距离（百分比值，0-10%）
 * @returns 元素的位置和尺寸信息
 */
export function calculateElementPosition(element: ImageElement, canvasWidth: number, canvasHeight: number, padding = 0) {
  // 应用默认值
  const elementWithDefaults = applyElementDefaults(element)

  // 将padding百分比转换为像素值
  const paddingX = (padding / 100) * canvasWidth
  const paddingY = (padding / 100) * canvasHeight

  // 计算考虑padding后的有效画布尺寸
  const effectiveCanvasWidth = canvasWidth - 2 * paddingX
  const effectiveCanvasHeight = canvasHeight - 2 * paddingY

  // 计算元素在有效区域内的位置和尺寸
  const x = convertPercentageToPixel(elementWithDefaults.x, effectiveCanvasWidth) + paddingX
  const y = convertPercentageToPixel(elementWithDefaults.y, effectiveCanvasHeight) + paddingY
  const width = convertPercentageToPixel(elementWithDefaults.width, effectiveCanvasWidth)
  const height = convertPercentageToPixel(elementWithDefaults.height, effectiveCanvasHeight)

  return { x, y, width, height }
}

/**
 * 检查点是否在多边形内（使用射线投射算法）
 * @param point 点坐标
 * @param polygon 多边形顶点数组（百分比坐标）
 * @param elementX 元素X坐标
 * @param elementY 元素Y坐标
 * @param elementWidth 元素宽度
 * @param elementHeight 元素高度
 * @returns 是否在多边形内
 */
function isPointInPolygon(point: { x: number; y: number }, polygon: Position[], elementX: number, elementY: number, elementWidth: number, elementHeight: number): boolean {
  let inside = false
  const x = point.x
  const y = point.y

  // 将多边形顶点从百分比转换为实际坐标
  const polygonPoints = polygon.map((p) => ({
    x: elementX + convertPercentageToPixel(p.x, elementWidth),
    y: elementY + convertPercentageToPixel(p.y, elementHeight),
  }))

  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].x
    const yi = polygonPoints[i].y
    const xj = polygonPoints[j].x
    const yj = polygonPoints[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

/**
 * 检查点是否在圆形区域内
 * @param point 点坐标
 * @param centerX 圆心X坐标
 * @param centerY 圆心Y坐标
 * @param radius 圆半径
 * @returns 是否在圆形内
 */
function isPointInCircle(point: { x: number; y: number }, centerX: number, centerY: number, radius: number): boolean {
  const distance = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2))
  return distance <= radius
}

/**
 * 检测点击位置是否在元素的mask区域内
 * @param element 图片元素
 * @param clickX 点击位置X坐标
 * @param clickY 点击位置Y坐标
 * @param pos 元素位置信息
 * @returns 是否在mask区域内
 */
function isClickInMask(element: ImageElement, clickX: number, clickY: number, pos: { x: number; y: number; width: number; height: number }): boolean {
  // 如果没有mask，返回true表示在元素区域内
  if (!element.mask) {
    return true
  }

  // 检查mask类型
  if (element.mask.type === 'shape') {
    switch (element.mask.shape) {
      case 'circle': {
        // 对于圆形mask，检查点击是否在圆形内
        const centerX = pos.x + pos.width / 2
        const centerY = pos.y + pos.height / 2
        const radius = Math.min(pos.width, pos.height) / 2
        return isPointInCircle({ x: clickX, y: clickY }, centerX, centerY, radius)
      }

      case 'polygon': {
        // 对于多边形mask，检查点击是否在多边形内
        if (element.mask.polygonPoints && element.mask.polygonPoints.length > 0) {
          return isPointInPolygon({ x: clickX, y: clickY }, element.mask.polygonPoints, pos.x, pos.y, pos.width, pos.height)
        }
        return true
      }

      case 'rect':
      default:
        // 矩形mask就是默认的矩形区域，直接返回true
        return true
    }
  }

  // 对于图片mask或其他情况，暂时按矩形区域处理
  return true
}

/**
 * 检测点击位置对应的元素
 * @param schema 布局配置
 * @param clickX 点击位置X坐标
 * @param clickY 点击位置Y坐标
 * @returns 元素索引或null
 */
export function detectClickPosition(schema: LayoutSchema, clickX: number, clickY: number): number | null {
  // 从上到下（zIndex大到小）检测点击
  const sortedElements = [...schema.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

  // 获取padding值，默认为0
  const padding = schema.padding || 0

  for (let i = 0; i < sortedElements.length; i++) {
    const element = sortedElements[i]
    const pos = calculateElementPosition(element, schema.canvasWidth, schema.canvasHeight, padding)

    // 首先检查点击是否在元素的矩形范围内（基础的x,y,width,height检测）
    if (clickX >= pos.x && clickX <= pos.x + pos.width && clickY >= pos.y && clickY <= pos.y + pos.height) {
      // 然后检查是否在mask区域内（如果有的话）
      // 如果没有mask，则isClickInMask会返回true，表示整个矩形区域都是可点击的
      if (isClickInMask(element, clickX, clickY, pos)) {
        // 找到原始索引
        return schema.elements.indexOf(element)
      }
    }
  }

  return null
}
