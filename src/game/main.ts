import * as Phaser from 'phaser';
const { AUTO, Events, Game: PhaserGame, Scale, Scene } = Phaser;
import {
    ARENA,
    COLORS,
    EV,
    GAME_CONFIG,
    GAME_HEIGHT,
    GAME_WIDTH,
    GameMode,
    RUNNER,
    TALES,
} from './config';
import { ARENA_BOUNDS, ARENA_STONES, HEARTH, LEVEL_MAP, RUNNER_PATTERNS, TILE } from './levels';
import { GameControls } from './controls';
import { createAllTextures } from './textures';
import { playSFX } from './audio';

export { GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT, COLORS, LEVEL_MAP, TILE, GameControls };

// ---------------------------------------------------------------------------
// EVENT BUS — shared React <-> Phaser bridge (named export)
// ---------------------------------------------------------------------------
export const EventBus = new Events.EventEmitter();

interface ActiveTelegraph {
    x: number;
    y: number;
    timer: number;
    duration: number;
    circle: Phaser.GameObjects.Arc;
    innerCircle: Phaser.GameObjects.Arc;
}

interface ActiveObstacle {
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    type: 'rock' | 'thorn';
}

interface ActivePickup {
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
}

interface ActiveSnare {
    sprite: Phaser.GameObjects.Sprite;
    x: number;
    active: boolean;
}

export class Game extends Scene {
    public controls!: GameControls;
    public currentMode: GameMode = 'HEARTH';
    public completedTales: Set<string> = new Set();

    // Mode containers for clean teardown and transitions
    private hearthContainer?: Phaser.GameObjects.Container;
    private runnerContainer?: Phaser.GameObjects.Container;
    private arenaContainer?: Phaser.GameObjects.Container;
    private riddlesContainer?: Phaser.GameObjects.Container;

    // --- Hearth Hub State ---
    private campfireFlames: Phaser.GameObjects.Polygon[] = [];
    private relicObjects: Array<{ id: string; sprite: Phaser.GameObjects.Sprite; halo: Phaser.GameObjects.Arc }> = [];
    private hearthEmbers?: Phaser.GameObjects.Particles.ParticleEmitter;

    // --- Tale 1: Runner State ---
    private hunterSprite?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private leucrocottaSprite?: Phaser.GameObjects.Sprite;
    private runnerGround?: Phaser.GameObjects.TileSprite;
    private runnerDunesBack?: Phaser.GameObjects.TileSprite;
    private runnerDunesMid?: Phaser.GameObjects.TileSprite;
    private runnerDistance: number = 0;
    private runnerSpeed: number = RUNNER.startSpeed;
    private runnerGap: number = RUNNER.startGap;
    private runnerSnares: number = RUNNER.startSnares;
    private runnerLives: number = RUNNER.startLives;
    private runnerStunTimer: number = 0;
    private runnerInvulnTimer: number = 0;
    private runnerObstacles: ActiveObstacle[] = [];
    private runnerPickups: ActivePickup[] = [];
    private runnerSnaresActive: ActiveSnare[] = [];
    private runnerPatternIndex: number = 0;
    private runnerNextSpawnDistance: number = 100;
    private runnerGate?: Phaser.GameObjects.Sprite;
    private runnerCompleted: boolean = false;
    private runnerFailed: boolean = false;

    // --- Tale 2: Arena State ---
    private arenaHunter?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private impundulu?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private arenaPlayerHp: number = ARENA.playerMaxHp;
    private arenaBirdHp: number = ARENA.birdMaxHp;
    private arenaNetCooldown: number = 0;
    private arenaTelegraphs: ActiveTelegraph[] = [];
    private arenaStrikeTimer: number = 800;
    private arenaBirdFlightAngle: number = 0;
    private arenaPlayerInvulnTimer: number = 0;
    private arenaNets: Array<{
        sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        vx: number;
        vy: number;
        dist: number;
    }> = [];
    private arenaCompleted: boolean = false;
    private arenaFailed: boolean = false;

    // --- Tale 3: Web State ---
    private webNodes: Phaser.GameObjects.Arc[] = [];
    private webSpider?: Phaser.GameObjects.Sprite;

    // Music helpers
    private currentBgm?: Phaser.Sound.BaseSound;

    private runnerSnareHeld = false;

    constructor() {
        super('Game');
    }

    preload(): void {
        // All sound is procedural via ZzFX (src/game/audio.ts) — no external
        // audio files are shipped, so nothing is loaded here. safePlay() and
        // playMusic() are cache-guarded and fall back to ZzFX presets.
    }

    create(): void {
        createAllTextures(this);

        this.controls = new GameControls(this, {
            hasActionButton: false, // We control touch buttons via React overlay for clean design
            joystickRadius: 55,
        });

        // Set default camera background
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        // Listen for React mode transitions
        EventBus.on(EV.SWITCH_MODE, this.handleSwitchMode, this);
        EventBus.on(EV.TOGGLE_PAUSE, this.handleTogglePause, this);
        EventBus.on(EV.TOUCH_INPUT, this.handleTouchInput, this);
        EventBus.on(EV.RIDDLE_ANSWERED, this.handleRiddleAnswered, this);

        // Start in Hearth mode
        this.switchMode('HEARTH');

        // Hand scene instance to React host
        EventBus.emit(EV.SCENE_READY, this);

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            EventBus.removeListener(EV.SWITCH_MODE, this.handleSwitchMode, this);
            EventBus.removeListener(EV.TOGGLE_PAUSE, this.handleTogglePause, this);
            EventBus.removeListener(EV.TOUCH_INPUT, this.handleTouchInput, this);
            EventBus.removeListener(EV.RIDDLE_ANSWERED, this.handleRiddleAnswered, this);
            this.time.removeAllEvents();
            this.tweens.killAll();
            this.sound.stopAll();
        });
    }

    // -----------------------------------------------------------------------
    // MODE SWITCHING & LIFECYCLE
    // -----------------------------------------------------------------------
    public switchMode(mode: GameMode): void {
        this.currentMode = mode;
        this.teardownActiveMode();

        switch (mode) {
            case 'HEARTH':
                this.setupHearthMode();
                this.playMusic('bgm_chill');
                break;
            case 'TALE_RUNNER':
                this.setupRunnerMode();
                this.playMusic('bgm_action');
                break;
            case 'TALE_LIGHTNING':
                this.setupLightningMode();
                this.playMusic('bgm_action');
                break;
            case 'TALE_RIDDLES':
                this.setupRiddlesMode();
                this.playMusic('bgm_chill');
                break;
        }
    }

    private handleSwitchMode(payload: { mode: GameMode }): void {
        this.switchMode(payload.mode);
    }

    private handleTogglePause(payload: { isPaused: boolean }): void {
        if (payload.isPaused) {
            this.physics.world.pause();
            this.tweens.pauseAll();
            if (this.currentBgm && this.currentBgm.isPlaying) {
                this.currentBgm.pause();
            }
        } else {
            this.physics.world.resume();
            this.tweens.resumeAll();
            if (this.currentBgm && this.currentBgm.isPaused) {
                this.currentBgm.resume();
            }
        }
    }

    private handleTouchInput(action: string): void {
        if (this.currentMode === 'TALE_RUNNER') {
            if (action === 'jump') {
                this.runnerJump();
            } else if (action === 'snare') {
                this.runnerDropSnare();
            }
        } else if (this.currentMode === 'TALE_LIGHTNING') {
            if (action === 'fire_net') {
                this.arenaFireNet();
            }
        }
    }

    private handleRiddleAnswered(payload: { index: number; correct: boolean }): void {
        if (this.currentMode === 'TALE_RIDDLES' && payload.correct) {
            const node = this.webNodes[payload.index];
            if (node) {
                node.setFillStyle(COLORS.GOLD_BRIGHT, 1);
                node.setStrokeStyle(3, 0xffffff, 1);
                this.tweens.add({
                    targets: node,
                    scale: 1.5,
                    yoyo: true,
                    duration: 250,
                });
            }
        }
    }

    private teardownActiveMode(): void {
        // Destroy existing containers and physics objects
        if (this.hearthContainer) {
            this.hearthContainer.destroy(true);
            this.hearthContainer = undefined;
        }
        if (this.runnerContainer) {
            this.runnerContainer.destroy(true);
            this.runnerContainer = undefined;
        }
        if (this.arenaContainer) {
            this.arenaContainer.destroy(true);
            this.arenaContainer = undefined;
        }
        if (this.riddlesContainer) {
            this.riddlesContainer.destroy(true);
            this.riddlesContainer = undefined;
        }

        // Clear references
        this.runnerObstacles = [];
        this.runnerPickups = [];
        this.runnerSnaresActive = [];
        this.arenaTelegraphs = [];
        this.arenaNets = [];
        this.relicObjects = [];
        this.webNodes = [];
    }

    // -----------------------------------------------------------------------
    // AUDIO HELPERS
    // -----------------------------------------------------------------------
    public safePlay(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (this.cache.audio.exists(key)) {
            try {
                this.sound.play(key, config);
            } catch {
                playSFX('button');
            }
        } else {
            playSFX('button');
        }
    }

    private playMusic(key: string): void {
        if (this.currentBgm) {
            this.currentBgm.stop();
        }
        if (this.cache.audio.exists(key)) {
            this.currentBgm = this.sound.add(key, { loop: true, volume: 0.35 });
            this.currentBgm.play();
        }
    }

    // -----------------------------------------------------------------------
    // MODE 0: THE ELDER'S HEARTH (Interactive Hub)
    // -----------------------------------------------------------------------
    private setupHearthMode(): void {
        this.physics.world.gravity.set(0, 0);
        this.hearthContainer = this.add.container(0, 0);

        // 1. Sky & Night Savanna Atmosphere
        const sky = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.MIDNIGHT);
        sky.setDepth(-20);
        this.hearthContainer.add(sky);

        // Twinkling stars
        for (let i = 0; i < 45; i++) {
            const sx = Phaser.Math.Between(20, GAME_WIDTH - 20);
            const sy = Phaser.Math.Between(15, 280);
            const r = Math.random() < 0.2 ? 2.5 : 1.2;
            const star = this.add.circle(sx, sy, r, 0xffffff, Phaser.Math.FloatBetween(0.4, 0.95));
            this.hearthContainer.add(star);

            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.1, 0.4),
                duration: Phaser.Math.Between(1200, 2800),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1500),
            });
        }

        // Giant Savanna Moon with soft golden rim
        const moonGlow = this.add.circle(820, 100, 56, COLORS.FIRE_AMBER, 0.2);
        const moon = this.add.circle(820, 100, 42, 0xfff3bf, 0.95);
        this.hearthContainer.add([moonGlow, moon]);

        // Distant hills / dunes silhouette
        const hills = this.add.graphics();
        hills.fillStyle(COLORS.EARTH_DARK, 0.75);
        hills.beginPath();
        hills.moveTo(0, 380);
        hills.lineTo(240, 335);
        hills.lineTo(520, 370);
        hills.lineTo(760, 395);
        hills.lineTo(GAME_WIDTH, 350);
        hills.lineTo(GAME_WIDTH, GAME_HEIGHT);
        hills.lineTo(0, GAME_HEIGHT);
        hills.closePath();
        hills.fill();
        this.hearthContainer.add(hills);

        // Acacia Tree Silhouette on left
        const tree = this.add.graphics();
        tree.fillStyle(0x0e0c1a, 0.95);
        // Trunk
        tree.beginPath();
        tree.moveTo(110, 480);
        tree.lineTo(122, 330);
        tree.lineTo(140, 220);
        tree.lineTo(150, 330);
        tree.lineTo(135, 480);
        tree.closePath();
        tree.fill();
        // Canopy umbrella layers
        tree.fillEllipse(140, 210, 160, 44);
        tree.fillEllipse(110, 190, 120, 36);
        tree.fillEllipse(180, 220, 100, 32);
        this.hearthContainer.add(tree);

        // Savanna Clearing Ground
        const ground = this.add.rectangle(
            GAME_WIDTH / 2,
            475,
            GAME_WIDTH,
            130,
            COLORS.EARTH_DARK
        );
        const groundTrim = this.add.rectangle(
            GAME_WIDTH / 2,
            412,
            GAME_WIDTH,
            6,
            COLORS.EARTH_MID
        );
        this.hearthContainer.add([ground, groundTrim]);

        // 2. Animated Campfire at HEARTH.fireX, HEARTH.fireY
        const fireBase = this.add.ellipse(HEARTH.fireX, HEARTH.fireY + 14, 76, 26, 0x1a120b, 0.85);
        const fireLight = this.add.circle(HEARTH.fireX, HEARTH.fireY - 10, 95, COLORS.FIRE_AMBER, 0.25);
        this.hearthContainer.add([fireBase, fireLight]);

        this.tweens.add({
            targets: fireLight,
            alpha: 0.12,
            scale: 1.15,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Fire stones ring
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const rx = HEARTH.fireX + Math.cos(a) * 36;
            const ry = HEARTH.fireY + 12 + Math.sin(a) * 12;
            const stone = this.add.circle(rx, ry, 6, 0x3f3f46);
            this.hearthContainer.add(stone);
        }

        // Dynamic campfire flames
        const flameOuter = this.add.triangle(
            HEARTH.fireX,
            HEARTH.fireY - 8,
            -22,
            24,
            0,
            -34,
            22,
            24,
            COLORS.FIRE_ORANGE,
            0.85
        );
        const flameInner = this.add.triangle(
            HEARTH.fireX,
            HEARTH.fireY - 4,
            -12,
            18,
            0,
            -26,
            12,
            18,
            COLORS.FIRE_YELLOW,
            0.95
        );
        this.hearthContainer.add([flameOuter, flameInner]);

        this.tweens.add({
            targets: flameOuter,
            scaleY: 1.25,
            scaleX: 0.85,
            duration: 220,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut',
        });
        this.tweens.add({
            targets: flameInner,
            scaleY: 1.35,
            scaleX: 0.9,
            duration: 180,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut',
        });

        // Rising embers
        this.time.addEvent({
            delay: 140,
            loop: true,
            callback: () => {
                if (this.currentMode !== 'HEARTH') return;
                const ex = HEARTH.fireX + Phaser.Math.Between(-14, 14);
                const ember = this.add.circle(ex, HEARTH.fireY - 10, Phaser.Math.FloatBetween(1.5, 3), COLORS.FIRE_YELLOW, 0.9);
                this.hearthContainer?.add(ember);

                this.tweens.add({
                    targets: ember,
                    x: ex + Phaser.Math.Between(-28, 28),
                    y: HEARTH.fireY - Phaser.Math.Between(70, 130),
                    alpha: 0,
                    scale: 0.3,
                    duration: Phaser.Math.Between(1000, 1800),
                    onComplete: () => ember.destroy(),
                });
            },
        });

        // 3. Baba Olatunji seated storytelling silhouette
        const baba = this.add.sprite(HEARTH.babaX, HEARTH.babaY, 'baba_olatunji');
        baba.setScale(1.15);
        this.hearthContainer.add(baba);

        // Breathing animation for Baba
        this.tweens.add({
            targets: baba,
            scaleY: 1.18,
            y: HEARTH.babaY - 3,
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Clickable Elder Dialogue prompt
        const promptStr = 'Baba Olatunji - Touch a relic to hear its tale';
        const elderPrompt = this.add.text(
            HEARTH.babaX,
            HEARTH.babaY - 80,
            promptStr,
            {
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                color: '#fef3c7',
                align: 'center',
                backgroundColor: 'rgba(18, 14, 24, 0.85)',
                padding: { x: 8, y: 5 },
            }
        ).setOrigin(0.5);
        this.hearthContainer.add(elderPrompt);

        // 4. Floating Mystical Relics around the fire
        this.relicObjects = [];
        HEARTH.relics.forEach((r, idx) => {
            const tale = TALES[r.id];
            const isCompleted = this.completedTales.has(r.id);

            // Relic Halo
            const haloColor = r.id === 'leucrocotta'
                ? COLORS.BLOOD_RED
                : r.id === 'impundulu'
                ? COLORS.STORM_TEAL
                : COLORS.GOLD;

            const halo = this.add.circle(r.x, r.y, 34, haloColor, 0.25);
            halo.setStrokeStyle(isCompleted ? 3 : 1.5, isCompleted ? COLORS.GOLD_BRIGHT : haloColor, 0.8);

            // Texture key
            const texKey = r.id === 'leucrocotta'
                ? 'relic_bone'
                : r.id === 'impundulu'
                ? 'relic_feather'
                : 'relic_web';

            const sprite = this.add.sprite(r.x, r.y, texKey);
            sprite.setScale(1.1);
            sprite.setInteractive({ useHandCursor: true });

            // Floating tween
            this.tweens.add({
                targets: [sprite, halo],
                y: r.y - 12,
                duration: 1800 + idx * 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Label tag below relic
            const labelText = isCompleted ? `✓ ${tale.title}` : tale.title;
            const label = this.add.text(r.x, r.y + 44, labelText, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: isCompleted ? '#ffd43b' : '#ffe8c9',
                backgroundColor: 'rgba(10, 11, 30, 0.75)',
                padding: { x: 6, y: 3 },
            }).setOrigin(0.5);

            // Click/tap handler
            sprite.on('pointerdown', () => {
                this.safePlay('sfx_powerup');
                EventBus.emit(EV.RELIC_SELECTED, {
                    relicId: r.id,
                    title: tale.title,
                    introText: tale.introText,
                });
            });

            // Hover zoom
            sprite.on('pointerover', () => {
                sprite.setScale(1.25);
                halo.setScale(1.25);
                halo.setAlpha(0.5);
            });
            sprite.on('pointerout', () => {
                sprite.setScale(1.1);
                halo.setScale(1.0);
                halo.setAlpha(0.25);
            });

            this.hearthContainer?.add([halo, sprite, label]);
            this.relicObjects.push({ id: r.id, sprite, halo });
        });
    }

    // -----------------------------------------------------------------------
    // MODE 1: TALE 1 — THE LEUCROCOTTA RUNNER
    // -----------------------------------------------------------------------
    private setupRunnerMode(): void {
        this.physics.world.gravity.set(0, RUNNER.gravityY);
        this.runnerContainer = this.add.container(0, 0);

        this.runnerDistance = 0;
        this.runnerSpeed = RUNNER.startSpeed;
        this.runnerGap = RUNNER.startGap;
        this.runnerSnares = RUNNER.startSnares;
        this.runnerLives = RUNNER.startLives;
        this.runnerStunTimer = 0;
        this.runnerInvulnTimer = 0;
        this.runnerObstacles = [];
        this.runnerPickups = [];
        this.runnerSnaresActive = [];
        this.runnerPatternIndex = 0;
        this.runnerNextSpawnDistance = 120;
        this.runnerCompleted = false;
        this.runnerFailed = false;

        // 1. Parallax Night Savanna Background
        const sky = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x090a18);
        sky.setDepth(-10);
        this.runnerContainer.add(sky);

        // Distant moon
        const moon = this.add.circle(760, 90, 36, 0xfffbeb, 0.9);
        this.runnerContainer.add(moon);

        // Dunes layers (TileSprites for smooth infinite scrolling)
        this.runnerDunesBack = this.add.tileSprite(GAME_WIDTH / 2, 360, GAME_WIDTH, 120, 'boundary_stone');
        this.runnerDunesBack.setAlpha(0.25);
        this.runnerDunesBack.setTint(0x1e1b4b);
        this.runnerContainer.add(this.runnerDunesBack);

        // Ground Earth
        const groundRect = this.add.rectangle(GAME_WIDTH / 2, 505, GAME_WIDTH, 70, COLORS.EARTH_DARK);
        const groundGrass = this.add.rectangle(GAME_WIDTH / 2, 471, GAME_WIDTH, 4, 0x854d0e);
        this.runnerContainer.add([groundRect, groundGrass]);

        // Ground Static Physics Body for Hunter to stand on
        const groundBody = this.physics.add.staticBody(GAME_WIDTH / 2, 472, GAME_WIDTH, 20);

        // 2. Hunter Sprite
        this.hunterSprite = this.physics.add.sprite(RUNNER.hunterX, RUNNER.groundY - 30, 'hunter_runner');
        this.hunterSprite.setCollideWorldBounds(true);
        this.hunterSprite.body.setSize(32, 56, true);
        this.hunterSprite.setDepth(20);
        this.runnerContainer.add(this.hunterSprite);

        this.physics.add.collider(this.hunterSprite, groundBody);

        // 3. Leucrocotta Pursuer Sprite
        this.leucrocottaSprite = this.add.sprite(60, RUNNER.groundY - 24, 'leucrocotta_beast');
        this.leucrocottaSprite.setDepth(18);
        this.runnerContainer.add(this.leucrocottaSprite);

        // Initial HUD push
        this.broadcastRunnerHud();
    }

    public runnerJump(): void {
        if (!this.hunterSprite || !this.hunterSprite.body || this.runnerCompleted || this.runnerFailed) return;
        const body = this.hunterSprite.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down || body.touching.down) {
            body.setVelocityY(RUNNER.jumpVelocity);
            this.safePlay('sfx_jump');
        }
    }

    public runnerDropSnare(): void {
        if (this.runnerSnares <= 0 || this.runnerCompleted || this.runnerFailed) return;
        if (!this.hunterSprite) return;

        this.runnerSnares--;
        this.safePlay('sfx_powerup');

        const snare = this.add.sprite(this.hunterSprite.x - 20, RUNNER.groundY - 14, 'snare_trap');
        snare.setDepth(15);
        this.runnerContainer?.add(snare);

        this.runnerSnaresActive.push({
            sprite: snare,
            x: this.hunterSprite.x - 20,
            active: true,
        });

        this.broadcastRunnerHud();
    }

    private updateRunner(delta: number): void {
        if (this.runnerCompleted || this.runnerFailed) return;

        const dt = delta / 1000;

        // Check Keyboard Input for runner
        const input = this.controls.getInput();
        if (input.jump || input.up) {
            this.runnerJump();
        }
        if (input.down) {
            // Edge-triggered: drop one snare per press of S / Down / stick-down
            if (!this.runnerSnareHeld) {
                this.runnerSnareHeld = true;
                this.runnerDropSnare();
            }
        } else {
            this.runnerSnareHeld = false;
        }

        // Distance advance
        this.runnerDistance += RUNNER.metersPerSecond * dt;
        if (this.runnerDistance >= RUNNER.targetDistance) {
            this.completeRunnerTale();
            return;
        }

        // Speed ramp
        const progress = Math.min(1, this.runnerDistance / RUNNER.targetDistance);
        this.runnerSpeed = RUNNER.startSpeed + (RUNNER.maxSpeed - RUNNER.startSpeed) * progress;

        // Scroll background
        if (this.runnerDunesBack) {
            this.runnerDunesBack.tilePositionX += this.runnerSpeed * dt * 0.35;
        }

        // Beast AI gap calculations
        if (this.runnerStunTimer > 0) {
            this.runnerStunTimer -= delta;
            // Beast is stunned, gap widens
            this.runnerGap = Math.min(100, this.runnerGap + RUNNER.gapRegainStunned * dt);
            if (this.leucrocottaSprite) {
                this.leucrocottaSprite.setTint(0xf59f00);
            }
        } else {
            // Beast is actively chasing, gap drifts closer
            this.runnerGap = Math.max(0, this.runnerGap - RUNNER.gapDriftToBeast * dt);
            if (this.leucrocottaSprite) {
                this.leucrocottaSprite.clearTint();
            }
        }

        // Position Leucrocotta based on gap
        // gap 0% = x: 200 (at hunter's back), gap 100% = x: -40 (off screen)
        if (this.leucrocottaSprite) {
            const targetX = 200 - (this.runnerGap / 100) * 220;
            this.leucrocottaSprite.x = Phaser.Math.Linear(this.leucrocottaSprite.x, targetX, 0.08);
            // subtle running bobbing
            this.leucrocottaSprite.y = RUNNER.groundY - 24 + Math.sin(this.time.now / 90) * 3;
        }

        // Beast caught hunter!
        if (this.runnerGap <= 0) {
            this.failRunnerTale('The Leucrocotta overtook you in the moonlit dark.');
            return;
        }

        // Invulnerability countdown
        if (this.runnerInvulnTimer > 0) {
            this.runnerInvulnTimer -= delta;
            if (this.hunterSprite) {
                this.hunterSprite.setAlpha(Math.sin(this.time.now / 40) > 0 ? 0.4 : 1);
            }
        } else if (this.hunterSprite) {
            this.hunterSprite.setAlpha(1);
        }

        // Spawn obstacles & pickups based on distance
        if (this.runnerDistance >= this.runnerNextSpawnDistance && this.runnerDistance < RUNNER.targetDistance - 80) {
            this.spawnRunnerPattern();
        }

        // Sanctuary gate near the end
        if (this.runnerDistance >= RUNNER.targetDistance - 60 && !this.runnerGate) {
            this.runnerGate = this.add.sprite(GAME_WIDTH + 80, RUNNER.groundY - 70, 'sanctuary_gate');
            this.runnerGate.setDepth(16);
            this.runnerContainer?.add(this.runnerGate);
        }
        if (this.runnerGate) {
            this.runnerGate.x -= this.runnerSpeed * dt;
        }

        // Move active obstacles & test collisions
        for (let i = this.runnerObstacles.length - 1; i >= 0; i--) {
            const obs = this.runnerObstacles[i];
            obs.sprite.x -= this.runnerSpeed * dt;

            // Check overlap with hunter
            if (this.hunterSprite && this.runnerInvulnTimer <= 0) {
                const hx = this.hunterSprite.x;
                const hy = this.hunterSprite.y;
                const ox = obs.sprite.x;
                const oy = obs.sprite.y;

                if (Math.abs(hx - ox) < 28 && Math.abs(hy - oy) < 32) {
                    // Collision with obstacle!
                    this.safePlay('sfx_hit');
                    this.cameras.main.shake(180, 0.015);
                    this.runnerLives--;
                    this.runnerGap = Math.max(0, this.runnerGap - RUNNER.gapLossOnHit);
                    this.runnerInvulnTimer = RUNNER.invulnMs;

                    if (this.runnerLives <= 0) {
                        this.failRunnerTale('You stumbled on the savanna thorns and could run no further.');
                        return;
                    }
                }
            }

            // Cleanup offscreen
            if (obs.sprite.x < -60) {
                obs.sprite.destroy();
                this.runnerObstacles.splice(i, 1);
            }
        }

        // Move active pickups & test collection
        for (let i = this.runnerPickups.length - 1; i >= 0; i--) {
            const p = this.runnerPickups[i];
            p.sprite.x -= this.runnerSpeed * dt;

            if (this.hunterSprite) {
                const hx = this.hunterSprite.x;
                const hy = this.hunterSprite.y;
                if (Math.abs(hx - p.sprite.x) < 30 && Math.abs(hy - p.sprite.y) < 36) {
                    // Collect feather
                    this.safePlay('sfx_collect');
                    this.runnerSnares = Math.min(5, this.runnerSnares + 1);
                    p.sprite.destroy();
                    this.runnerPickups.splice(i, 1);
                    continue;
                }
            }

            if (p.sprite.x < -40) {
                p.sprite.destroy();
                this.runnerPickups.splice(i, 1);
            }
        }

        // Move dropped snares & check if Leucrocotta hits them
        for (let i = this.runnerSnaresActive.length - 1; i >= 0; i--) {
            const s = this.runnerSnaresActive[i];
            s.x -= this.runnerSpeed * dt;
            s.sprite.x = s.x;

            if (s.active && this.leucrocottaSprite && s.x <= this.leucrocottaSprite.x + 35) {
                // Trap triggered!
                s.active = false;
                this.runnerStunTimer = RUNNER.stunDuration;
                this.safePlay('sfx_explosion');
                this.cameras.main.shake(140, 0.01);

                // Flash trap
                this.tweens.add({
                    targets: s.sprite,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => s.sprite.destroy(),
                });
                this.runnerSnaresActive.splice(i, 1);
                continue;
            }

            if (s.x < -50) {
                s.sprite.destroy();
                this.runnerSnaresActive.splice(i, 1);
            }
        }

        this.broadcastRunnerHud();
    }

    private spawnRunnerPattern(): void {
        const pattern = RUNNER_PATTERNS[this.runnerPatternIndex];
        this.runnerPatternIndex = (this.runnerPatternIndex + 1) % RUNNER_PATTERNS.length;

        for (const item of pattern) {
            const spawnX = GAME_WIDTH + 60 + item.dx;
            if (item.type === 'rock') {
                const rock = this.physics.add.sprite(spawnX, RUNNER.groundY - 24, 'obstacle_rock');
                rock.body.setAllowGravity(false);
                rock.setDepth(14);
                this.runnerContainer?.add(rock);
                this.runnerObstacles.push({ sprite: rock, type: 'rock' });
            } else if (item.type === 'thorn') {
                const thorn = this.physics.add.sprite(spawnX, RUNNER.groundY - 16, 'obstacle_thorn');
                thorn.body.setAllowGravity(false);
                thorn.setDepth(14);
                this.runnerContainer?.add(thorn);
                this.runnerObstacles.push({ sprite: thorn, type: 'thorn' });
            } else if (item.type === 'feather') {
                const feather = this.physics.add.sprite(spawnX, RUNNER.groundY - 70, 'pickup_feather');
                feather.body.setAllowGravity(false);
                feather.setDepth(15);
                this.runnerContainer?.add(feather);
                this.runnerPickups.push({ sprite: feather });
            }
        }

        this.runnerNextSpawnDistance += Phaser.Math.Between(110, 150);
    }

    private broadcastRunnerHud(): void {
        EventBus.emit(EV.UPDATE_RUNNER_HUD, {
            distance: Math.min(RUNNER.targetDistance, Math.floor(this.runnerDistance)),
            maxDistance: RUNNER.targetDistance,
            snaresLeft: this.runnerSnares,
            beastDistance: Math.floor(this.runnerGap),
            beastStunned: this.runnerStunTimer > 0,
            hp: this.runnerLives,
        });
    }

    private completeRunnerTale(): void {
        this.runnerCompleted = true;
        this.completedTales.add('leucrocotta');
        this.safePlay('sfx_win');
        EventBus.emit(EV.TALE_COMPLETED, {
            taleId: 'leucrocotta',
            title: TALES.leucrocotta.title,
            summary: TALES.leucrocotta.victorySummary,
        });
    }

    private failRunnerTale(reason: string): void {
        this.runnerFailed = true;
        this.safePlay('sfx_gameover');
        EventBus.emit(EV.TALE_FAILED, {
            taleId: 'leucrocotta',
            reason,
        });
    }

    // -----------------------------------------------------------------------
    // MODE 2: TALE 2 — THE IMPUNDULU LIGHTNING BIRD (Arena)
    // -----------------------------------------------------------------------
    private setupLightningMode(): void {
        this.physics.world.gravity.set(0, 0);
        this.arenaContainer = this.add.container(0, 0);

        this.arenaPlayerHp = ARENA.playerMaxHp;
        this.arenaBirdHp = ARENA.birdMaxHp;
        this.arenaNetCooldown = 0;
        this.arenaTelegraphs = [];
        this.arenaStrikeTimer = 1000;
        this.arenaBirdFlightAngle = 0;
        this.arenaPlayerInvulnTimer = 0;
        this.arenaNets = [];
        this.arenaCompleted = false;
        this.arenaFailed = false;

        // 1. Dark stormy ground
        const floor = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0c0f1d);
        this.arenaContainer.add(floor);

        // Ritual Arena boundary with stones
        const ritualBounds = this.add.graphics();
        ritualBounds.lineStyle(2, 0x1e293b, 0.8);
        ritualBounds.strokeRect(ARENA_BOUNDS.x, ARENA_BOUNDS.y, ARENA_BOUNDS.w, ARENA_BOUNDS.h);
        this.arenaContainer.add(ritualBounds);

        // Boundary stones
        ARENA_STONES.forEach(st => {
            const stone = this.add.sprite(st.x, st.y, 'boundary_stone');
            stone.setScale(0.8);
            stone.setDepth(6);
            this.arenaContainer?.add(stone);
        });

        // 2. Hunter Arena Tracker
        this.arenaHunter = this.physics.add.sprite(GAME_WIDTH / 2, 420, 'hunter_arena');
        this.arenaHunter.setCollideWorldBounds(true);
        this.arenaHunter.body.setSize(28, 28, true);
        this.arenaHunter.setDepth(20);
        this.arenaContainer.add(this.arenaHunter);

        // 3. Impundulu Lightning Bird Boss
        this.impundulu = this.physics.add.sprite(GAME_WIDTH / 2, 180, 'impundulu_bird');
        this.impundulu.setDepth(22);
        this.impundulu.body.setSize(44, 44, true);
        this.arenaContainer.add(this.impundulu);

        // Initial HUD push
        this.broadcastArenaHud();
    }

    public arenaFireNet(): void {
        if (this.arenaNetCooldown > 0 || this.arenaCompleted || this.arenaFailed) return;
        if (!this.arenaHunter) return;

        this.arenaNetCooldown = ARENA.netCooldownMs;
        this.safePlay('sfx_powerup');

        // Aim towards pointer or Impundulu
        const pointer = this.input.activePointer;
        let targetX = pointer.x;
        let targetY = pointer.y;

        // If pointer is offscreen or inactive, aim directly towards bird
        if (!pointer.isDown && this.impundulu) {
            targetX = this.impundulu.x;
            targetY = this.impundulu.y;
        }

        const angle = Phaser.Math.Angle.Between(this.arenaHunter.x, this.arenaHunter.y, targetX, targetY);
        const vx = Math.cos(angle) * ARENA.netSpeed;
        const vy = Math.sin(angle) * ARENA.netSpeed;

        const net = this.physics.add.sprite(this.arenaHunter.x, this.arenaHunter.y, 'fire_net');
        net.body.setAllowGravity(false);
        net.setDepth(19);
        this.arenaContainer?.add(net);

        this.arenaNets.push({
            sprite: net,
            vx,
            vy,
            dist: 0,
        });

        // Spin net
        this.tweens.add({
            targets: net,
            angle: 360,
            duration: 600,
            repeat: -1,
        });
    }

    private updateLightningArena(delta: number): void {
        if (this.arenaCompleted || this.arenaFailed) return;
        const dt = delta / 1000;

        // 1. Player 8-way Movement
        if (this.arenaHunter && this.arenaHunter.body) {
            const input = this.controls.getInput();
            let vx = 0;
            let vy = 0;

            if (input.left) vx -= 1;
            if (input.right) vx += 1;
            if (input.up) vy -= 1;
            if (input.down) vy += 1;

            if (vx !== 0 && vy !== 0) {
                vx *= 0.7071;
                vy *= 0.7071;
            }

            this.arenaHunter.body.velocity.x = vx * ARENA.playerSpeed;
            this.arenaHunter.body.velocity.y = vy * ARENA.playerSpeed;

            // Desktop action key to fire
            if (input.action || input.jump) {
                this.arenaFireNet();
            }

            // Keep within arena bounds
            const b = ARENA_BOUNDS;
            this.arenaHunter.x = Phaser.Math.Clamp(this.arenaHunter.x, b.x + 24, b.x + b.w - 24);
            this.arenaHunter.y = Phaser.Math.Clamp(this.arenaHunter.y, b.y + 24, b.y + b.h - 24);
        }

        // Pointer click to shoot net
        if (this.input.activePointer.isDown && this.arenaNetCooldown <= 0) {
            this.arenaFireNet();
        }

        // Net cooldown
        if (this.arenaNetCooldown > 0) {
            this.arenaNetCooldown -= delta;
        }

        // Player invulnerability flash
        if (this.arenaPlayerInvulnTimer > 0) {
            this.arenaPlayerInvulnTimer -= delta;
            if (this.arenaHunter) {
                this.arenaHunter.setAlpha(Math.sin(this.time.now / 35) > 0 ? 0.3 : 1);
            }
        } else if (this.arenaHunter) {
            this.arenaHunter.setAlpha(1);
        }

        // 2. Impundulu Swooping Flight Path
        if (this.impundulu) {
            this.arenaBirdFlightAngle += dt * 1.8;
            const cx = GAME_WIDTH / 2;
            const cy = 210;
            const rx = 340;
            const ry = 85;

            // Figure-eight / Lissajous flight path
            this.impundulu.x = cx + Math.sin(this.arenaBirdFlightAngle) * rx;
            this.impundulu.y = cy + Math.sin(this.arenaBirdFlightAngle * 2) * ry;

            // Face flight direction
            const nextX = cx + Math.sin(this.arenaBirdFlightAngle + 0.05) * rx;
            this.impundulu.setFlipX(nextX < this.impundulu.x);
        }

        // 3. Lightning Strike Countdown & Telegraphs
        this.arenaStrikeTimer -= delta;
        if (this.arenaStrikeTimer <= 0) {
            this.arenaStrikeTimer = ARENA.strikeIntervalMs;
            this.spawnLightningTelegraph();
        }

        // Update active telegraphs
        for (let i = this.arenaTelegraphs.length - 1; i >= 0; i--) {
            const tele = this.arenaTelegraphs[i];
            tele.timer -= delta;

            const pct = Math.max(0, tele.timer / tele.duration);
            // Shrink inner circle to show countdown
            tele.innerCircle.setScale(pct);

            if (tele.timer <= 0) {
                // LIGHTNING CRASHES DOWN!
                this.executeLightningStrike(tele.x, tele.y);
                tele.circle.destroy();
                tele.innerCircle.destroy();
                this.arenaTelegraphs.splice(i, 1);
            }
        }

        // 4. Update Net Projectiles
        for (let i = this.arenaNets.length - 1; i >= 0; i--) {
            const net = this.arenaNets[i];
            net.sprite.x += net.vx * dt;
            net.sprite.y += net.vy * dt;
            net.dist += ARENA.netSpeed * dt;

            // Check hit against Impundulu
            if (this.impundulu) {
                const distToBird = Phaser.Math.Distance.Between(
                    net.sprite.x,
                    net.sprite.y,
                    this.impundulu.x,
                    this.impundulu.y
                );

                if (distToBird < 42) {
                    // Impundulu hit!
                    this.safePlay('sfx_hit');
                    this.cameras.main.shake(120, 0.012);
                    this.arenaBirdHp--;

                    // Flash bird with flame
                    this.impundulu.setTint(COLORS.FIRE_AMBER);
                    this.time.delayedCall(220, () => {
                        this.impundulu?.clearTint();
                    });

                    net.sprite.destroy();
                    this.arenaNets.splice(i, 1);

                    if (this.arenaBirdHp <= 0) {
                        this.completeLightningTale();
                        return;
                    }
                    continue;
                }
            }

            if (net.dist >= ARENA.netRange) {
                net.sprite.destroy();
                this.arenaNets.splice(i, 1);
            }
        }

        this.broadcastArenaHud();
    }

    private spawnLightningTelegraph(): void {
        if (!this.arenaHunter) return;

        // Choose 1 to 2 strike locations (one on player, one predictive)
        const strikes = [
            { x: this.arenaHunter.x, y: this.arenaHunter.y },
            {
                x: Phaser.Math.Clamp(this.arenaHunter.x + Phaser.Math.Between(-140, 140), ARENA_BOUNDS.x + 30, ARENA_BOUNDS.x + ARENA_BOUNDS.w - 30),
                y: Phaser.Math.Clamp(this.arenaHunter.y + Phaser.Math.Between(-100, 100), ARENA_BOUNDS.y + 30, ARENA_BOUNDS.y + ARENA_BOUNDS.h - 30),
            },
        ];

        for (const pt of strikes) {
            // Strict 1.2s warning
            const circle = this.add.circle(pt.x, pt.y, ARENA.strikeRadius, 0xef4444, 0.25);
            circle.setStrokeStyle(2, 0xf87171, 0.9);
            circle.setDepth(8);

            const innerCircle = this.add.circle(pt.x, pt.y, ARENA.strikeRadius, 0xef4444, 0.55);
            innerCircle.setDepth(9);

            this.arenaContainer?.add([circle, innerCircle]);

            this.arenaTelegraphs.push({
                x: pt.x,
                y: pt.y,
                timer: ARENA.telegraphMs,
                duration: ARENA.telegraphMs,
                circle,
                innerCircle,
            });
        }
    }

    private executeLightningStrike(x: number, y: number): void {
        this.safePlay('sfx_explosion');
        this.cameras.main.shake(200, 0.02);

        // Blinding white-blue column of lightning
        const beam = this.add.rectangle(x, y - 260, 32, 540, 0xffffff, 0.95);
        beam.setDepth(28);

        const core = this.add.rectangle(x, y - 260, 14, 540, COLORS.STORM_TEAL, 0.9);
        core.setDepth(29);

        // Strike impact flash on ground
        const impact = this.add.circle(x, y, ARENA.strikeRadius, 0xffffff, 0.8);
        impact.setDepth(30);

        this.arenaContainer?.add([beam, core, impact]);

        this.tweens.add({
            targets: [beam, core, impact],
            alpha: 0,
            scaleX: 1.4,
            duration: 250,
            onComplete: () => {
                beam.destroy();
                core.destroy();
                impact.destroy();
            },
        });

        // Check damage to player
        if (this.arenaHunter && this.arenaPlayerInvulnTimer <= 0) {
            const dist = Phaser.Math.Distance.Between(this.arenaHunter.x, this.arenaHunter.y, x, y);
            if (dist <= ARENA.strikeRadius) {
                this.arenaPlayerHp--;
                this.arenaPlayerInvulnTimer = 1000;
                this.safePlay('sfx_hit');

                if (this.arenaPlayerHp <= 0) {
                    this.failLightningTale('Struck down by the Impundulu’s celestial thunder.');
                }
            }
        }
    }

    private broadcastArenaHud(): void {
        const netCooldownPct = Math.max(0, this.arenaNetCooldown / ARENA.netCooldownMs);
        EventBus.emit(EV.UPDATE_ARENA_HUD, {
            birdHp: this.arenaBirdHp,
            maxBirdHp: ARENA.birdMaxHp,
            playerHp: this.arenaPlayerHp,
            maxPlayerHp: ARENA.playerMaxHp,
            netCooldownPct,
        });
    }

    private completeLightningTale(): void {
        this.arenaCompleted = true;
        this.completedTales.add('impundulu');
        this.safePlay('sfx_win');

        // Animate 4 fire nets binding the bird
        if (this.impundulu) {
            this.impundulu.setTint(COLORS.FIRE_AMBER);
            const netGraphic = this.add.sprite(this.impundulu.x, this.impundulu.y, 'fire_net');
            netGraphic.setScale(2.2);
            netGraphic.setDepth(35);
            this.arenaContainer?.add(netGraphic);
        }

        EventBus.emit(EV.TALE_COMPLETED, {
            taleId: 'impundulu',
            title: TALES.impundulu.title,
            summary: TALES.impundulu.victorySummary,
        });
    }

    private failLightningTale(reason: string): void {
        this.arenaFailed = true;
        this.safePlay('sfx_gameover');
        EventBus.emit(EV.TALE_FAILED, {
            taleId: 'impundulu',
            reason,
        });
    }

    // -----------------------------------------------------------------------
    // MODE 3: TALE 3 — ANANSI'S RIDDLES (Golden Web Visualizer)
    // -----------------------------------------------------------------------
    private setupRiddlesMode(): void {
        this.physics.world.gravity.set(0, 0);
        this.riddlesContainer = this.add.container(0, 0);

        // Mystical dark web chamber background
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0914);
        bg.setDepth(-10);
        this.riddlesContainer.add(bg);

        // Sacred Golden Web radial geometry
        const webGraphic = this.add.graphics();
        webGraphic.lineStyle(1.5, COLORS.GOLD, 0.4);

        const cx = GAME_WIDTH / 2;
        const cy = 250;
        const radCount = 10;
        const rings = [45, 90, 140, 195, 250];

        // Radials
        for (let i = 0; i < radCount; i++) {
            const ang = (i * Math.PI * 2) / radCount;
            webGraphic.beginPath();
            webGraphic.moveTo(cx, cy);
            webGraphic.lineTo(cx + Math.cos(ang) * 260, cy + Math.sin(ang) * 260);
            webGraphic.stroke();
        }

        // Concentric polygon web threads
        for (const r of rings) {
            webGraphic.beginPath();
            for (let i = 0; i <= radCount; i++) {
                const ang = (i * Math.PI * 2) / radCount;
                const px = cx + Math.cos(ang) * r;
                const py = cy + Math.sin(ang) * r;
                if (i === 0) webGraphic.moveTo(px, py);
                else webGraphic.lineTo(px, py);
            }
            webGraphic.stroke();
        }
        this.riddlesContainer.add(webGraphic);

        // 5 Riddle Node Markers on the web
        this.webNodes = [];
        for (let i = 0; i < 5; i++) {
            const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nx = cx + Math.cos(ang) * 140;
            const ny = cy + Math.sin(ang) * 140;

            const node = this.add.circle(nx, ny, 10, COLORS.GOLD, 0.4);
            node.setStrokeStyle(2, COLORS.GOLD_PALE, 0.8);
            node.setDepth(12);

            this.riddlesContainer.add(node);
            this.webNodes.push(node);
        }

        // Anansi the Spider atop the web
        this.webSpider = this.add.sprite(cx, cy - 130, 'anansi_spider');
        this.webSpider.setScale(1.2);
        this.webSpider.setDepth(15);
        this.riddlesContainer.add(this.webSpider);

        // Gentle breathing sway for Anansi
        this.tweens.add({
            targets: this.webSpider,
            y: cy - 124,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    // -----------------------------------------------------------------------
    // SCENE UPDATE LOOP
    // -----------------------------------------------------------------------
    update(time: number, delta: number): void {
        switch (this.currentMode) {
            case 'TALE_RUNNER':
                this.updateRunner(delta);
                break;
            case 'TALE_LIGHTNING':
                this.updateLightningArena(delta);
                break;
            case 'HEARTH':
            case 'TALE_RIDDLES':
            default:
                break;
        }
    }
}

const StartGame = (parent: string) => {
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent,
        backgroundColor: '#0a0b1e',
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH,
        },
        input: {
            activePointers: 3,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                fps: 60,
                fixedStep: true,
            },
        },
        scene: [Game],
    };

    const game = new PhaserGame(config);
    if (typeof window !== 'undefined') {
        (window as any).__PHASER_GAME__ = game;
        (window as any).__PHASER_EVENT_BUS__ = EventBus;
    }
    return game;
};

export default StartGame;