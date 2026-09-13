/**
 * AFRICAN FOLKLORE ANTHOLOGY — CONFIGURATION & TUNING
 * All balance variables, colors, lore text and riddle data live here.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const COLORS = {
    MIDNIGHT: 0x0a0b1e,
    TWILIGHT: 0x161c36,
    EARTH_DARK: 0x2b1b17,
    EARTH_MID: 0x4a2c1f,
    EARTH_LIGHT: 0x8c4e2d,
    FIRE_ORANGE: 0xff7b1c,
    FIRE_AMBER: 0xffaa33,
    FIRE_YELLOW: 0xffe066,
    STORM_TEAL: 0x38d9a9,
    STORM_BLUE: 0x74c0fc,
    STORM_WHITE: 0xe7f5ff,
    GOLD: 0xf59f00,
    GOLD_BRIGHT: 0xffd43b,
    GOLD_PALE: 0xfff3bf,
    BLOOD_RED: 0xe03131,
    TEXT: '#ffe8c9',
    BACKGROUND: 0x0a0b1e,
} as const;

export const GAME_CONFIG = {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: { gravity: { x: 0, y: 0 } },
    player: { speed: 200, jumpForce: 450, maxHp: 3 },
    colors: { background: COLORS.BACKGROUND, text: COLORS.TEXT },
} as const;

// ---------------------------------------------------------------------------
// MODES & EVENTS
// ---------------------------------------------------------------------------
export type GameMode = 'HEARTH' | 'TALE_RUNNER' | 'TALE_LIGHTNING' | 'TALE_RIDDLES';

export const EV = {
    SWITCH_MODE: 'switch-mode',
    RELIC_SELECTED: 'relic-selected',
    UPDATE_RUNNER_HUD: 'update-runner-hud',
    UPDATE_ARENA_HUD: 'update-arena-hud',
    RIDDLE_ANSWERED: 'riddle-answered',
    TALE_COMPLETED: 'tale-completed',
    TALE_FAILED: 'tale-failed',
    TOGGLE_PAUSE: 'toggle-pause',
    TOUCH_INPUT: 'touch-input',
    SCENE_READY: 'current-scene-ready',
} as const;

// ---------------------------------------------------------------------------
// TALES & LORE
// ---------------------------------------------------------------------------
export interface TaleInfo {
    id: 'leucrocotta' | 'impundulu' | 'anansi';
    title: string;
    navLabel: string;
    introText: string;
    victorySummary: string;
    mode: GameMode;
}

export const TALES: Record<string, TaleInfo> = {
    leucrocotta: {
        id: 'leucrocotta',
        title: 'The Leucrocotta Runner',
        navLabel: 'Tale 1: Leucrocotta',
        introText:
            'Hear me, child of the plains. The Leucrocotta — part hyena, part shadow — hunts those who wander the moonlit savanna. It never tires, it never forgets. Only the fleet-footed reach the Sanctuary Gate of the village. Take the enchanted rope-bone snares; cast them behind you and the beast will thrash in amber light for three heartbeats of time. Run 1500 meters. Do not look back.',
        victorySummary:
            'The Sanctuary Gate closes behind you. The Leucrocotta howls in the darkness, denied its meal. The village elders sing your name — the runner whom the beast could not catch.',
        mode: 'TALE_RUNNER',
    },
    impundulu: {
        id: 'impundulu',
        title: 'The Impundulu Lightning Bird',
        navLabel: 'Tale 2: Impundulu',
        introText:
            'The Impundulu, vampiric storm bird of the southern hills, feeds on thunder and blood. It circles the ritual ground, painting red warnings on the earth before its lightning falls. Move when the circles shrink! And cast your enchanted Fire Nets — four true catches will bind the storm in ropes of flame and ground the bird forever.',
        victorySummary:
            'Four nets of living flame wrap the Impundulu. The storm falls silent, the bird grounded, its lightning returned to the sky. The ritual ground is safe, and the elders carve your catch into the boundary stones.',
        mode: 'TALE_LIGHTNING',
    },
    anansi: {
        id: 'anansi',
        title: "Anansi's Riddles",
        navLabel: 'Tale 3: Anansi',
        introText:
            'Anansi the Spider, Master of All Stories, sits at the heart of his golden web. He trades wisdom for wit. Answer his five riddles and the stories of the world are yours. Fail, and he will laugh that dry trickster laugh — but he is merciful, and lets you try again. Choose carefully, little fly.',
        victorySummary:
            'Anansi bows upon his golden web. "Wisdom is like a baobab tree; no one individual can embrace it — yet you have embraced your share." The Master of Stories names you Keeper of Riddles.',
        mode: 'TALE_RIDDLES',
    },
};

// ---------------------------------------------------------------------------
// RUNNER (Tale 1) TUNING
// ---------------------------------------------------------------------------
export const RUNNER = {
    targetDistance: 1500,      // meters
    startSpeed: 260,           // px/s
    maxSpeed: 400,
    gravityY: 900,
    jumpVelocity: -520,
    groundY: 470,
    hunterX: 220,
    startGap: 60,              // beast gap % (0 = caught, 100 = safe)
    gapLossOnHit: 22,
    gapDriftToBeast: 2.2,      // % per second the beast closes when free
    gapRegainStunned: 16,      // % per second while beast is stunned
    stunDuration: 3000,        // ms — exactly 3 seconds
    startLives: 3,
    startSnares: 3,
    metersPerSecond: 12,
    invulnMs: 1200,
} as const;

// ---------------------------------------------------------------------------
// ARENA (Tale 2) TUNING
// ---------------------------------------------------------------------------
export const ARENA = {
    playerSpeed: 240,
    playerMaxHp: 4,
    birdMaxHp: 4,
    birdSpeed: 130,
    telegraphMs: 1200,         // strict 1.2s warning
    strikeRadius: 52,
    strikeIntervalMs: 2200,
    maxTelegraphs: 3,
    netSpeed: 420,
    netCooldownMs: 600,
    netRange: 520,
} as const;

// ---------------------------------------------------------------------------
// RIDDLES (Tale 3)
// ---------------------------------------------------------------------------
export interface Riddle {
    question: string;
    options: [string, string, string];
    correct: number; // index 0..2
}

export const RIDDLES: Riddle[] = [
    {
        question: 'I speak without a mouth, I hear without ears, I have no body, but I come alive with wind. What am I?',
        options: ['An Echo', 'A Drum', 'The River'],
        correct: 0,
    },
    {
        question: "Two sisters who look alike; they walk all day together, yet neither ever visits the other's room. Who are they?",
        options: ['The Sun and Moon', 'A Pair of Eyes', 'The Left and Right Foot'],
        correct: 1,
    },
    {
        question: 'I run all day without legs, I murmur without speaking, and I have a bed but never sleep. What am I?',
        options: ['A River', 'The Wind', 'A Snake'],
        correct: 0,
    },
    {
        question: 'A house without doors or windows, yet inside lives a king dressed in white and gold. What is it?',
        options: ['A Clay Pot', 'An Egg', 'A Termite Mound'],
        correct: 1,
    },
    {
        question: 'What belongs to you, but others use it far more often than you do?',
        options: ['Your Cattle', 'Your Name', 'Your Shadow'],
        correct: 1,
    },
];

export const ANANSI_PRAISE = [
    'Wisdom is like a baobab tree; no one individual can embrace it!',
    'Ha! The fly learns the web is a door, not a wall!',
    'Even the river remembers the way to the sea. You remember well!',
    'My grandmother the tortoise would have been slower to see it!',
    'The story belongs to you now — carry it gently.',
];

export const ANANSI_TAUNT = [
    'Heh heh heh... the web trembles at such an answer. Try again, little fly.',
    'Dry laughter rustles the threads. No, no — think like the spider, not the fly!',
    'Even the termite knows better! Again, again...',
    'Heh! My web is sticky, but your thinking is stickier. Once more!',
];
