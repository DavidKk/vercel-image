[![Build Status](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-web-scripts/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-web-scripts/blob/main/README.md)

# Vercel 图片处理工具

一个用于在线创建和处理图片的图片处理工具集合。主要功能是图片合并工具，可将多张图片组合成各种布局。

## 功能特点

- **图片合并**: 将多张图片组合成各种布局，包括网格、垂直堆叠、水平堆叠和倾斜堆叠布局
- **可定制布局**: 调整图片间的间隙并从多种布局选项中选择
- **高质量输出**: 生成高分辨率图片（1024x1024）以获得清晰的输出效果
- **在线处理**: 所有图片处理都在浏览器中完成 - 无需上传到服务器

## 支持的布局

- 网格布局（3x3网格）
- 垂直堆叠布局
- 水平堆叠布局
- 倾斜堆叠布局

## 安全说明

- 所有图片处理都在浏览器端完成
- 图片不会上传到任何服务器
- 您的图片保持私密性，不会被存储或传输

## 部署到 Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-web-scripts)

### 环境变量配置

参考 [`.env.example`](./.env.example) 文件，设置必要的环境变量。

- `GIST_ID`: GitHub Gist Id
- `GIST_TOKEN`: GitHub Gist Token
- `ACCESS_USERNAME`: 管理员用户名
- `ACCESS_PASSWORD`: 管理员密码
- `ACCESS_2FA_SECRET`: 2FA 密钥，可以使用 [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app) 生成 TOKEN
- `JWT_SECRET`: JWT 密钥
- `JWT_EXPIRES_IN`: JWT 过期时间

## 快速开始

1. 创建一个 **GitHub Gist** 并生成一个 **GitHub Access Token**（需勾选 gist 权限）。
2. 在 Vercel 中设置相应的环境变量。
3. 部署完成后，您可以通过网页界面使用图片处理工具。
