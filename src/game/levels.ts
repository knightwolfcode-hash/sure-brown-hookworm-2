/**
 * LEVEL DESIGN — obstacle spawn patterns, arena layout, hearth placement.
 * Deterministic data; the runner cycles these patterns (no Math.random for layout).
 */

export const TILE = 32;

// ---------------------------------------------------------------------------
// HEARTH LAYOUT (960x540)
// ---------------------------------------------------------------------------
export const HEARTH = {
    fireX: 480,
    fireY: 400,
    babaX: 330,
    babaY: 385,
    relics: [
        { id: 'leucrocotta', x: 620, y: 250 },
        { id: 'impundulu', x: 740, y: 320 },
        { id: 'anansi', x: 540, y: 170 },
    ],
} as const;

// ---------------------------------------------------------------------------
// RUNNER OBSTACLE PATTERNS (Kishōtenketsu pacing)
// Each pattern: list of {dx (px from pattern start), type}
// 'rock' = tall basalt rock (jump), 'thorn' = low acacia thorns (jump),
// 'feather' = glowing snare pickup (grab in air or ground)
// ---------------------------------------------------------------------------
export interface ObstacleDef {
    dx: number;
    type: 'rock' | 'thorn' | 'feather';
}

export const RUNNER_PATTERNS: ObstacleDef[][] = [
    // Ki — gentle intro
    [{ dx: 0, type: 'rock' }, { dx: 420, type: 'feather' }],
    [{ dx: 0, type: 'thorn' }, { dx: 380, type: 'rock' }],
    // Shō — develop
    [{ dx: 0, type: 'rock' }, { dx: 300, type: 'thorn' }, { dx: 560, type: 'feather' }],
    [{ dx: 0, type: 'thorn' }, { dx: 260, type: 'thorn' }, { dx: 540, type: 'rock' }],
    // Ten — twist (tight doubles)
    [{ dx: 0, type: 'rock' }, { dx: 220, type: 'rock' }, { dx: 480, type: 'thorn' }],
    [{ dx: 0, type: 'thorn' }, { dx: 200, type: 'rock' }, { dx: 430, type: 'feather' }, { dx: 620, type: 'thorn' }],
    // Ketsu — final sprint
    [{ dx: 0, type: 'rock' }, { dx: 240, type: 'thorn' }, { dx: 460, type: 'rock' }, { dx: 700, type: 'rock' }],
];

// ---------------------------------------------------------------------------
// ARENA LAYOUT (Tale 2) — boundary stones around the ritual ground
// ---------------------------------------------------------------------------
export const ARENA_BOUNDS = { x: 40, y: 90, w: 880, h: 410 } as const;

export const ARENA_STONES: Array<{ x: number; y: number }> = (() => {
    const stones: Array<{ x: number; y: number }> = [];
    const b = ARENA_BOUNDS;
    for (let i = 0; i <= 10; i++) {
        stones.push({ x: b.x + (b.w / 10) * i, y: b.y });
        stones.push({ x: b.x + (b.w / 10) * i, y: b.y + b.h });
    }
    for (let i = 1; i < 5; i++) {
        stones.push({ x: b.x, y: b.y + (b.h / 5) * i });
        stones.push({ x: b.x + b.w, y: b.y + (b.h / 5) * i });
    }
    return stones;
})();

// Legacy template exports (kept for compatibility)
export const LEVEL_MAP: string[] = [];
export const LEVELS: string[][] = [];
