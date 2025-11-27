import type { ImageElement, LayoutSchema } from '@/app/mosaic/types'

import { applyElementDefaults, cloneSchema } from './utils'

// 定义一个类型，表示经过调整后的元素，其中 x, y, width, height 是必需的
interface AdjustedElement extends Omit<ImageElement, 'x' | 'y' | 'width' | 'height'> {
  x: number | string
  y: number | string
  width: number | string
  height: number | string
}

interface AdjustElementParams {
  element: ImageElement
  scaleFactor: number
}

/**
 * 根据间距值调整单个元素的尺寸和位置
 * @param params 调整元素参数
 * @returns 调整后的元素
 */
export function adjustElementForSpacing(params: AdjustElementParams): AdjustedElement {
  const { element, scaleFactor } = params

  // 应用元素默认值
  const elementWithDefaults = applyElementDefaults(element)

  // 创建元素的深拷贝
  const adjustedElement: ImageElement = JSON.parse(JSON.stringify(elementWithDefaults))

  // 获取元素的间距方向控制，默认为 'both'（双向调整）
  const spacingDirection = elementWithDefaults.spacingDirection || 'both'

  // 获取原始尺寸和位置
  const originalX = typeof elementWithDefaults.x === 'string' ? parseFloat(elementWithDefaults.x.replace('%', '')) : elementWithDefaults.x
  const originalY = typeof elementWithDefaults.y === 'string' ? parseFloat(elementWithDefaults.y.replace('%', '')) : elementWithDefaults.y
  const originalWidth = typeof elementWithDefaults.width === 'string' ? parseFloat(elementWithDefaults.width.replace('%', '')) : elementWithDefaults.width
  const originalHeight = typeof elementWithDefaults.height === 'string' ? parseFloat(elementWithDefaults.height.replace('%', '')) : elementWithDefaults.height

  // 根据间距方向控制计算新的尺寸
  let newWidth = originalWidth
  let newHeight = originalHeight

  // 计算origin点（默认为中心点50% 50%）
  const originX = elementWithDefaults.origin?.x
    ? typeof elementWithDefaults.origin.x === 'string'
      ? parseFloat(elementWithDefaults.origin.x.replace('%', ''))
      : elementWithDefaults.origin.x
    : 50
  const originY = elementWithDefaults.origin?.y
    ? typeof elementWithDefaults.origin.y === 'string'
      ? parseFloat(elementWithDefaults.origin.y.replace('%', ''))
      : elementWithDefaults.origin.y
    : 50

  // 计算origin点在元素中的实际位置比例
  const originXRatio = originX / 100
  const originYRatio = originY / 100

  // 根据间距方向控制调整尺寸
  if (spacingDirection === 'both' || spacingDirection === 'horizontal') {
    newWidth = originalWidth * scaleFactor
  }

  if (spacingDirection === 'both' || spacingDirection === 'vertical') {
    newHeight = originalHeight * scaleFactor
  }

  // 计算origin点在原始元素中的像素位置（相对于画布）
  const originPixelX = originalX + originalWidth * originXRatio
  const originPixelY = originalY + originalHeight * originYRatio

  // 计算新的位置，确保origin点保持不变
  let newX = originalX
  let newY = originalY

  if (spacingDirection === 'both' || spacingDirection === 'horizontal') {
    newX = originPixelX - newWidth * originXRatio
  }

  if (spacingDirection === 'both' || spacingDirection === 'vertical') {
    newY = originPixelY - newHeight * originYRatio
  }

  // 更新元素属性，只修改位置和尺寸，不修改其他属性
  adjustedElement.x = `${newX}%`
  adjustedElement.y = `${newY}%`
  adjustedElement.width = `${newWidth}%`
  adjustedElement.height = `${newHeight}%`

  // 返回类型断言，因为我们确保了 x, y, width, height 都有值
  return adjustedElement as AdjustedElement
}

interface AdjustSchemaParams {
  schema: LayoutSchema
  spacing?: number
}

/**
 * 根据间距值调整元素尺寸和位置
 * @param params 调整参数
 * @returns 调整后的布局配置
 */
export function adjustSchemaForSpacing(params: AdjustSchemaParams): LayoutSchema {
  const { schema, spacing } = params
  if (!schema) {
    return schema
  }

  const actualSpacing = (typeof spacing === 'number' ? spacing : schema.spacing) || 0
  if (actualSpacing === 0) {
    return cloneSchema(schema)
  }

  const adjustedSchema = cloneSchema(schema)
  const scaleFactor = 1 - actualSpacing / 100

  adjustedSchema.elements = adjustedSchema.elements.map((element: ImageElement) => {
    const adjustedElement = adjustElementForSpacing({ element, scaleFactor })
    return adjustedElement
  })

  return adjustedSchema
}
