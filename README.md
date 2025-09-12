[![Build Status](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-web-scripts/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-web-scripts/blob/main/README.md)

# Vercel Image Tools

A collection of image processing tools for creating and manipulating images online. The main feature is the image merger tool that allows combining multiple images into various layouts.

## Features

- **Image Merger**: Combine multiple images into various layouts including grid, vertical stack, horizontal stack, and slanted stack layouts
- **Customizable Layouts**: Adjust gap between images and choose from multiple layout options
- **High Quality Output**: Generate high-resolution images (1024x1024) for crisp output
- **Online Processing**: All image processing happens in the browser - no server upload required

## Supported Layouts

- Grid Layout (3x3 grid)
- Vertical Stack Layout
- Horizontal Stack Layout
- Slanted Stack Layout

## Security Notes

- All image processing is done client-side in the browser
- No images are uploaded to any server
- Your images remain private and are never stored or transmitted

## Deploy to Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-web-scripts)

### Environment Variable Configuration

Refer to the [`.env.example`](./.env.example) file to set the required environment variables.

- `GIST_ID`: GitHub Gist Id
- `GIST_TOKEN`: GitHub Gist Token
- `ACCESS_USERNAME`: Admin Username
- `ACCESS_PASSWORD`: Admin Password
- `ACCESS_2FA_SECRET`: 2FA Secret, can generate TOKEN using [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app)
- `JWT_SECRET`: JWT Secret
- `JWT_EXPIRES_IN`: JWT Token Expiration Time

## Quick Start

1. Create a **GitHub Gist** and generate a **GitHub Access Token** (with gist permission).
2. Set the corresponding environment variables in Vercel.
3. Once deployed, you can use the image processing tools through the web interface.
