# React Three Fiber Project Setup

This is a React Three Fiber 3D scene starter project with TypeScript and Vite, using **pnpm** as the package manager.

- [x] Scaffolding Vite project with React + TypeScript
- [x] Install React Three Fiber and dependencies with pnpm
- [x] Set up 3D scene components
- [x] Configure development environment
- [x] Launch development server with pnpm

## Project Complete

Your React Three Fiber starter is ready with **pnpm**! The development server is running at **http://localhost:5173/**

### Package Manager

This project uses **pnpm** for faster, more efficient dependency management. Common commands:

```bash
pnpm install    # Install dependencies
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
```

### Key Files

- **src/App.tsx** - Main application with 3D scene and RotatingBox component
- **src/App.css** - Scene styling and info panel
- **README.md** - Full documentation and usage guide
- **pnpm-lock.yaml** - Lockfile for reproducible installs

### Project Features

The scene includes:
- A rotating blue box with automatic and interactive rotation
- OrbitControls for mouse-based camera manipulation
- Multiple light sources (ambient, directional, point)
- Dark theme with professional styling

### Next Steps

- Modify the RotatingBox component to add more geometry
- Add new 3D objects using Three.js geometries
- Implement custom hooks for animation and interaction
- Explore @react-three/drei for more helper components
