import type { Config } from '@jest/types'
import fs from 'fs'
import path from 'path'

const TIMEOUT = 30e3

export default (): Config.InitialOptions => {
  // 注意：jest.config.webtest.ts 已不再使用，因为 __webtests__ 中的测试已迁移到 Playwright
  // 保留配置文件但不包含在项目中，以便将来可能需要时恢复
  const projects = ['<rootDir>/jest.config.unittest.ts']

  // Only include typetest if the directory exists and has test files
  const typetestDir = path.join(__dirname, '__typetests__')
  if (fs.existsSync(typetestDir)) {
    const files = fs.readdirSync(typetestDir)
    if (files.some((file) => file.endsWith('.spec.ts'))) {
      projects.unshift('<rootDir>/jest.config.typetest.ts')
    }
  }

  return {
    skipFilter: true,
    testTimeout: TIMEOUT,
    projects,
    coverageReporters: ['text', 'cobertura', 'html'],
    collectCoverageFrom: ['<rootDir>/app/**/*.ts', '<rootDir>/utils/**/*.ts', '!<rootDir>/**/*.d.ts'],
  }
}
