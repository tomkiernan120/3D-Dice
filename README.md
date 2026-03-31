# React Three Fiber Starter

A modern 3D web application starter built with **React Three Fiber**, **Three.js**, **React**, **TypeScript**, and **Vite**.

## Features

- ⚡ **Vite** - Lightning-fast build tool and dev server
- 🎨 **React Three Fiber** - React renderer for Three.js
- 🎯 **TypeScript** - Full type safety
- 🎮 **Interactive 3D Scene** - Orbit controls, lighting, and geometric objects
- 📦 **Modern Stack** - Latest versions of React and Three.js

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 10+

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see your 3D scene.

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── App.tsx           # Main application component with 3D scene
├── App.css           # Styles for the scene and UI
├── main.tsx          # React entry point
├── index.css         # Global styles
└── assets/           # Static assets
```

## Components

### RotatingBox

A simple 3D box component that rotates automatically and responds to OrbitControls for user interaction.

## Controls

- **Rotate**: Click and drag with mouse
- **Zoom**: Scroll wheel
- **Pan**: Right-click and drag (or Cmd+Click on Mac)

## Dependencies

- `three` - 3D JavaScript library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helper components and hooks

## Example Scene Components

### Available from drei

- **OrbitControls** - Mouse controls for camera
- **PerspectiveCamera** - 3D camera
- **Primitive** - Wrapper for Three.js objects
- **Canvas** - Three.js scene wrapper

## Customization

To add more 3D objects or effects:

1. Create new components in `src/`
2. Import them in `App.tsx`
3. Add them to the `<Canvas>` component

Example:

```tsx
function MyModel() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhongMaterial color="#ff0000" />
    </mesh>
  )
}
```

## Learn More

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)

## License

MIT

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
