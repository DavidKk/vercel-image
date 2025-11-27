import type { Config } from '@jest/types'
import fs from 'fs'
import JSON5 from 'json5'
import path from 'path'
import { pathsToModuleNameMapper } from 'ts-jest'
import type { CompilerOptions } from 'typescript'

const tsconfigFile = path.join(__dirname, './tsconfig.json')
const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf-8')
const { compilerOptions } = JSON5.parse<{ compilerOptions: CompilerOptions }>(tsconfigContent)
const tsconfigPaths = compilerOptions.paths!

export default (): Config.InitialOptions => ({
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__webtests__/**/*.spec.ts?(x)'],
  setupFiles: ['jest-canvas-mock', '<rootDir>/jest/setupCanvas.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfigPaths, {
      prefix: '<rootDir>',
    }),
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },
})
