/**
 * Canvas 测试工具 API
 * 用于在 Playwright 测试中加载 canvas 相关函数
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Canvas test utils API',
    available: true,
  })
}
