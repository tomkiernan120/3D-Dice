# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
pnpm dev       # Start development server (http://localhost:5173)
pnpm build     # Production build with TypeScript type checking
pnpm preview   # Preview production build locally
pnpm lint      # Run ESLint on all TypeScript files
```

## Architecture Overview

This is a **physics-based 3D dice roller** application combining React, Three.js, and realistic physics simulation.

### Core Layers

1. **3D Rendering Layer** - React Three Fiber (R3F) provides React components wrapping Three.js for declarative 3D scene management
2. **Physics Engine** - Cannon-ES handles realistic dice physics with velocity tracking, damping, and collision detection
3. **UI Layer** - React manages application state (throw seed, dice settlement results) and displays controls
4. **Build System** - Vite with TypeScript plugin for fast development and optimized production builds

### Key Technology Stack

- **3D Graphics**: Three.js (v0.183.2) + React Three Fiber (v9.5.0) + drei (v10.7.7)
- **Physics**: Cannon-ES (v0.20.0) via @react-three/cannon (v6.6.0)
- **Frontend**: React 19 + TypeScript 5.9
- **Build**: Vite 8 + pnpm 10+

## Project Structure

```
src/
├── App.tsx              # Main scene setup, state management, UI controls
├── App.css              # Styles for controls panel (glass morphism design)
├── components/
│   └── dice.tsx         # Dice geometry generation and physics components
├── main.tsx             # React entry point
├── index.css            # Global styles and resets
└── assets/              # Static assets
```

## Important Development Patterns

### Physics Implementation Details

**Settlement Detection** (`dice.tsx`):
- Monitors physics body velocity and angular velocity each frame via `useFrame`
- Considers dice "settled" after velocity falls below threshold (0.1) for 24+ consecutive frames
- Velocity tracking via physics body subscriptions with refs

**Face Recognition**:
- Uses quaternion dot product with face normal vectors to determine top-facing die value
- Selects face with highest dot product (closest to facing up)
- Stored in refs to avoid recalculation on every frame

**Physics Configuration**:
- Linear damping: 0.25, Angular damping: 0.2 (realistic deceleration)
- Physics world attached to scene via Physics component from @react-three/cannon
- Each dice body created with `useBox` hook, scaled to die dimensions

### Component Architecture

**Pure vs Stateful Components**:
- `Dice` - Pure presentation component rendering 3D geometry, uses `useMemo` for geometry caching
- `PhysicsDice` - Wraps Dice with physics state and settlement detection via `useBox` and `useFrame`
- `Scene` - Manages camera, lighting setup, physics world initialization
- `App` - Top-level state management for seed input and results display

**State Flow**:
- App manages `seed` (throw input) and `result` (settled dice values)
- PhysicsDice components communicate settlement via `onSettled` callback
- Results persist until next throw (triggered by seed change)

### Geometry Generation

**Custom Box Geometry** (`dice.tsx`, DiceGeometryParams):
- Base is Three.js BoxGeometry with subdivision
- Edge rounding via position manipulation (iterative smoothing)
- Face numbering: 0=top, 1=bottom, 2=front, 3=back, 4=left, 5=right

**Pip Indentation**:
- Uses trigonometric wave functions to create pip indentations on each face
- Pip count per face: 1, 2, 3, 4, 5, 6 (standard die)
- Geometry merged and optimized with BufferGeometry

**Material & Rendering**:
- MeshStandardMaterial with metallic properties for realistic reflection
- Face colors differentiated (white base, red/black pips for contrast)

### TypeScript Patterns

- **Type Aliases**: `Vec3` and `Quat` for vector/quaternion clarity
- **Interface Props**: `DiceProps`, `DiceGeometryParams` define component contracts
- **Strict Mode**: All strict TypeScript options enabled (`tsconfig.app.json`)
  - `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`

## Code Quality

**ESLint Configuration** (`eslint.config.js`):
- JavaScript Standard Rules via @eslint/js
- TypeScript rules via typescript-eslint (recommended config)
- React Hooks rules (@eslint/plugin-react-hooks)
- React Refresh rules for Fast Refresh compatibility

**Run linting**: `pnpm lint`

**TypeScript Compilation**: `pnpm build` includes `tsc -b` type checking before Vite build

## Development Workflow

- **Fast Refresh Enabled** - Edit source files and see changes instantly without losing state
- **Build Info Caching** - TypeScript caches build info in `.tmp/` for faster rebuilds
- **Browser DevTools** - React DevTools and Three.js Inspector recommended for debugging

## React Three Fiber Patterns to Know

- **Canvas Component** - Wraps the Three.js scene, provides context for 3D components
- **useFrame Hook** - Called every frame, used for animations, physics detection, and state updates
- **useBox/usePlane Hooks** - From @react-three/cannon, create physics-enabled meshes
- **useRef for Physics** - Store physics API references and mutable velocity tracking state
- **Primitive Component** - Wraps raw Three.js objects (e.g., lights, cameras)

## Testing

No testing framework is currently configured. To add tests:
1. Install Vitest (recommended for Vite projects): `pnpm add -D vitest`
2. Create test files (`*.test.ts`, `*.test.tsx`)
3. Update `vite.config.ts` to include Vitest configuration

## Performance Considerations

- Geometry generated once and cached via `useMemo` to prevent recreations
- Dice instances use physics body subscriptions instead of polling
- Use browser DevTools Performance tab to profile frame rate during throws
- Cannon-ES physics world runs every frame; monitor for bottlenecks with `timeScale` adjustments if needed

## File Structure Notes

- CSS variables can be defined in `index.css` for theming (infrastructure exists but not currently used)
- Grid/Flexbox layout in App.css for responsive UI panels
- Glass morphism effects via `backdrop-filter` for semi-transparent UI elements
- Full-screen layout using viewport units (vw, vh)
