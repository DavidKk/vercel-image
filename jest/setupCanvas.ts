// 设置 canvas 环境
import { createCanvas } from 'canvas'

// 在 jsdom 环境中添加完整的 canvas 支持
if (typeof document !== 'undefined') {
  // 保存原始的 createElement 方法
  const originalCreateElement = document.createElement.bind(document)

  // 重写 document.createElement 方法，以便在创建 canvas 元素时返回真实的 canvas
  document.createElement = jest.fn().mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() === 'canvas') {
      // 创建真实的 canvas 元素
      return createCanvas(300, 150)
    }

    // 对于其他元素，使用原始方法
    return originalCreateElement(tagName)
  })
}
