// 设置 canvas 环境
// canvas 是原生模块，需要编译。如果构建失败，回退到 jest-canvas-mock
let createCanvas: ((width: number, height: number) => any) | null = null

try {
  // @ts-ignore - canvas 可能没有正确构建原生模块
  const canvasModule = require('canvas')
  if (canvasModule && typeof canvasModule.createCanvas === 'function') {
    createCanvas = canvasModule.createCanvas
  }
} catch (error) {
  // canvas 模块不可用（可能是原生模块没有正确构建）
  // 将使用 jest-canvas-mock（已经在 jest.config.webtest.ts 中配置）
  // eslint-disable-next-line no-console
  console.warn('Canvas native module not available, using jest-canvas-mock instead')
}

// 在 jsdom 环境中添加完整的 canvas 支持
if (typeof document !== 'undefined') {
  // 保存原始的 createElement 方法
  const originalCreateElement = document.createElement.bind(document)

  // 重写 document.createElement 方法，以便在创建 canvas 元素时返回真实的 canvas
  document.createElement = jest.fn().mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() === 'canvas') {
      // 如果 canvas 模块可用，使用真实的 canvas
      if (createCanvas) {
        try {
          return createCanvas(300, 150)
        } catch (error) {
          // 如果创建失败，回退到原始方法（会使用 jest-canvas-mock）
          return originalCreateElement(tagName)
        }
      }
      // 如果没有 canvas 模块，使用原始方法（会使用 jest-canvas-mock）
      return originalCreateElement(tagName)
    }

    // 对于其他元素，使用原始方法
    return originalCreateElement(tagName)
  })
}
