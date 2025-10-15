# Initial Nuxt.js Project Setup with Custom Ceramic Theme

## Overview
This PR establishes the foundation for the ju_keramia website - a Nuxt.js application with a custom ceramic-inspired design system.

## Key Changes

### Project Setup
- ✅ Initialized Nuxt 4 application with TypeScript support
- ✅ Configured essential modules: Content, ESLint, Image, and UI
- ✅ Set up development tooling (Prettier, Husky, lint-staged)
- ✅ Added CI/CD linting workflow

### Custom Design System
- ✅ **Ceramic Color Palette**: Authentic earth-tone colors (cream, clay, stone, sage)
- ✅ **Typography Scale**: Custom font families (Inter, Crimson Text, Playfair Display)
- ✅ **Spacing System**: 8px grid-based spacing scale
- ✅ Integrated with Nuxt UI for component theming

### Configuration Files
- `nuxt.config.ts`: Module configuration with custom color theme
- `app.config.ts`: Color aliases mapping (primary=clay, secondary=sage, etc.)
- `app/assets/css/main.css`: Complete design system with CSS custom properties
- `package.json`: Dependencies and development scripts

## Technical Stack
- **Framework**: Nuxt 4.1.2 with Vue 3.5.21
- **Styling**: Tailwind CSS via Nuxt UI 3.3.4
- **State Management**: Pinia
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks

## What's Next
The project is ready for:
- Component development using the ceramic design system
- Content creation with @nuxt/content
- Image optimization with @nuxt/image
