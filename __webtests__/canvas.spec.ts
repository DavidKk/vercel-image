describe('DOM functionality', () => {
  it('should have access to document object', () => {
    // 简单测试确保我们有访问 document 对象的能力
    expect(document).toBeDefined()
    expect(typeof document.createElement).toBe('function')
  })

  it('should be able to create canvas element', () => {
    // 测试创建 canvas 元素
    const canvas = document.createElement('canvas')
    expect(canvas).toBeDefined()
    // 注意：使用 canvas 包时，canvas 对象是 Canvas 类型而不是 HTMLCanvasElement
  })

  it('should be able to set canvas dimensions', () => {
    // 测试设置 canvas 尺寸
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = 600
    canvas.height = 400

    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(400)
  })
})
