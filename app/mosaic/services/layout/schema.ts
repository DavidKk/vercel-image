import type { LayoutSchema, ImageElement } from '@/app/mosaic/types'

/**
 * 补充元素的默认值，确保所有必需的属性都有值
 * @param element 原始元素
 * @returns 补充默认值后的元素
 */
export function completeElementDefaults(element: Partial<ImageElement>): ImageElement {
  // 创建元素的深拷贝
  const completedElement: any = JSON.parse(JSON.stringify(element))

  // 设置默认的 spacingDirection 为 'both'
  if (!completedElement.spacingDirection) {
    completedElement.spacingDirection = 'both'
  }

  // 设置默认的 origin 为 { x: '50%', y: '50%' }
  if (!completedElement.origin) {
    completedElement.origin = { x: '50%', y: '50%' }
  } else {
    if (!completedElement.origin.x) {
      completedElement.origin.x = '50%'
    }
    if (!completedElement.origin.y) {
      completedElement.origin.y = '50%'
    }
  }

  // 如果没有提供 origin 坐标，设置默认值
  if (completedElement.origin && typeof completedElement.origin === 'object') {
    if (completedElement.origin.x === undefined) {
      completedElement.origin.x = '50%'
    }
    if (completedElement.origin.y === undefined) {
      completedElement.origin.y = '50%'
    }
  }

  return completedElement as ImageElement
}

/**
 * 补充布局配置的默认值，确保所有必需的属性都有值
 * @param schema 原始布局配置
 * @returns 补充默认值后的布局配置
 */
export function completeSchemaDefaults(schema: any): LayoutSchema {
  // 创建 schema 的深拷贝
  const completedSchema: any = JSON.parse(JSON.stringify(schema))

  // 补充每个元素的默认值
  if (completedSchema.elements && Array.isArray(completedSchema.elements)) {
    completedSchema.elements = completedSchema.elements.map((element: Partial<ImageElement>) => {
      return completeElementDefaults(element)
    })
  }

  return completedSchema as LayoutSchema
}
