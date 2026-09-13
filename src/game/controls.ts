import Phaser from 'phaser';

export interface PlayerInput {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
    action: boolean;
    force: number;
    angle: number;
}

export interface ControlsOptions {
    joystickRadius?: number;
    joystickX?: number;
    joystickY?: number;
    hasActionButton?: boolean;
    actionButtonText?: string;
}

/**
 * Universal Mobile & Desktop Controller.
 * Unifies Keyboard (WASD + Arrows + Space) with a lightweight native
 * virtual joystick (pure Phaser pointer input — no external plugins,
 * fully compatible with Phaser 4).
 * Guaranteed to work on mobile touchscreens and desktop browsers alike.
 */
export class GameControls {
    private scene: Phaser.Scene;

    // --- Native virtual joystick state ---
    private base: Phaser.GameObjects.Arc | null = null;
    private thumb: Phaser.GameObjects.Arc | null = null;
    private joystickCenterX = 0;
    private joystickCenterY = 0;
    private joystickRadius = 60;
    private joystickEnabled = true;
    private joystickVisible = true;
    private activePointerId = -1;
    private joyForce = 0;
    private joyAngle = 0;
    private joyLeft = false;
    private joyRight = false;
    private joyUp = false;
    private joyDown = false;

    private onPointerDown: ((pointer: Phaser.Input.Pointer) => void) | null = null;
    private onPointerMove: ((pointer: Phaser.Input.Pointer) => void) | null = null;
    private onPointerUp: ((pointer: Phaser.Input.Pointer) => void) | null = null;

    private keyboardKeys: any = null;
    private actionButton: Phaser.GameObjects.Container | null = null;
    private isActionPressed = false;
    private isJumpPressed = false;

    constructor(scene: Phaser.Scene, options: ControlsOptions = {}) {
        this.scene = scene;

        // 1. Setup Desktop Keyboard
        if (scene.input && scene.input.keyboard) {
            this.keyboardKeys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                w: Phaser.Input.Keyboard.KeyCodes.W,
                s: Phaser.Input.Keyboard.KeyCodes.S,
                a: Phaser.Input.Keyboard.KeyCodes.A,
                d: Phaser.Input.Keyboard.KeyCodes.D,
                space: Phaser.Input.Keyboard.KeyCodes.SPACE,
                enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
                shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            });
        }

        // 2. Setup Mobile Touch Joystick (native implementation)
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const width = scene.scale.width;
        const height = scene.scale.height;

        const radius = options.joystickRadius ?? 60;
        const jx = options.joystickX ?? radius + 30;
        const jy = options.joystickY ?? height - radius - 30;

        this.joystickRadius = radius;
        this.joystickCenterX = jx;
        this.joystickCenterY = jy;

        // Base & Thumb graphics
        const base = scene.add.circle(jx, jy, radius, 0x888888, 0.4);
        base.setStrokeStyle(2, 0xffffff, 0.6);
        base.setScrollFactor(0);
        base.setDepth(9999);
        this.base = base;

        const thumb = scene.add.circle(jx, jy, radius * 0.45, 0xcccccc, 0.8);
        thumb.setStrokeStyle(2, 0xffffff, 0.9);
        thumb.setScrollFactor(0);
        thumb.setDepth(10000);
        this.thumb = thumb;

        this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
            if (!this.joystickEnabled || !this.joystickVisible) return;
            if (this.activePointerId !== -1) return;
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, jx, jy);
            if (dist <= radius * 1.6) {
                this.activePointerId = pointer.id;
                this.updateJoystick(pointer.x, pointer.y);
            }
        };

        this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
            if (pointer.id !== this.activePointerId) return;
            this.updateJoystick(pointer.x, pointer.y);
        };

        this.onPointerUp = (pointer: Phaser.Input.Pointer) => {
            if (pointer.id !== this.activePointerId) return;
            this.activePointerId = -1;
            this.resetJoystick();
        };

        scene.input.on('pointerdown', this.onPointerDown);
        scene.input.on('pointermove', this.onPointerMove);
        scene.input.on('pointerup', this.onPointerUp);

        // 3. Optional Mobile Action/Jump Button (Bottom-Right)
        const hasAction = options.hasActionButton ?? true;
        if (hasAction) {
            const btnRadius = 38;
            const btnX = width - btnRadius - 35;
            const btnY = height - btnRadius - 35;

            const btnBg = scene.add.circle(0, 0, btnRadius, 0x028af8, 0.6);
            btnBg.setStrokeStyle(2, 0xffffff, 0.8);

            const btnText = scene.add.text(0, 0, options.actionButtonText ?? 'A', {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            this.actionButton = scene.add.container(btnX, btnY, [btnBg, btnText]);
            this.actionButton.setScrollFactor(0);
            this.actionButton.setDepth(10000);
            this.actionButton.setSize(btnRadius * 2, btnRadius * 2);
            this.actionButton.setInteractive(
                new Phaser.Geom.Circle(0, 0, btnRadius),
                Phaser.Geom.Circle.Contains
            );

            this.actionButton.on('pointerdown', () => {
                this.isActionPressed = true;
                this.isJumpPressed = true;
                btnBg.setFillStyle(0x0ec3c9, 0.9);
            });

            const releaseAction = () => {
                this.isActionPressed = false;
                this.isJumpPressed = false;
                btnBg.setFillStyle(0x028af8, 0.6);
            };

            this.actionButton.on('pointerup', releaseAction);
            this.actionButton.on('pointerout', releaseAction);
        }

        // Hide touch controls on non-touch desktop unless touched
        if (!isTouch) {
            this.setVisible(false);
            // If user ever touches screen, reveal mobile controls
            scene.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.wasTouch) {
                    this.setVisible(true);
                }
            });
        }

        // Auto cleanup on scene shutdown
        scene.events.once('shutdown', () => {
            this.destroy();
        });
    }

    private updateJoystick(px: number, py: number): void {
        let dx = px - this.joystickCenterX;
        let dy = py - this.joystickCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max = this.joystickRadius;
        if (dist > max && dist > 0) {
            dx = (dx / dist) * max;
            dy = (dy / dist) * max;
        }
        const clampedDist = Math.min(dist, max);

        this.thumb?.setPosition(this.joystickCenterX + dx, this.joystickCenterY + dy);

        this.joyForce = (clampedDist / max) * 100;
        this.joyAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // 8-direction cursor mapping with a small deadzone (forceMin ~ 10)
        if (this.joyForce >= 10) {
            const a = (this.joyAngle + 360) % 360;
            this.joyLeft = a >= 135 && a < 225;
            this.joyRight = a < 45 || a >= 315;
            this.joyUp = a >= 225 && a < 315;
            this.joyDown = a >= 45 && a < 135;
        } else {
            this.resetJoystickDirs();
        }
    }

    private resetJoystickDirs(): void {
        this.joyLeft = false;
        this.joyRight = false;
        this.joyUp = false;
        this.joyDown = false;
    }

    private resetJoystick(): void {
        this.joyForce = 0;
        this.resetJoystickDirs();
        this.thumb?.setPosition(this.joystickCenterX, this.joystickCenterY);
    }

    /**
     * Poll unified input state. Call this inside your scene or entity update() loop.
     */
    public getInput(): PlayerInput {
        const k = this.keyboardKeys;

        const kLeft = (k?.left?.isDown || k?.a?.isDown) ?? false;
        const kRight = (k?.right?.isDown || k?.d?.isDown) ?? false;
        const kUp = (k?.up?.isDown || k?.w?.isDown) ?? false;
        const kDown = (k?.down?.isDown || k?.s?.isDown) ?? false;
        const kJump = (k?.space?.isDown || kUp) ?? false;
        const kAction = (k?.space?.isDown || k?.enter?.isDown || k?.shift?.isDown) ?? false;

        const active = this.joystickEnabled && this.joystickVisible;

        return {
            left: kLeft || (active && this.joyLeft),
            right: kRight || (active && this.joyRight),
            up: kUp || (active && this.joyUp),
            down: kDown || (active && this.joyDown),
            jump: kJump || this.isJumpPressed,
            action: kAction || this.isActionPressed,
            force: active ? this.joyForce : 0,
            angle: this.joyAngle,
        };
    }

    public setVisible(visible: boolean): void {
        this.joystickVisible = visible;
        this.joystickEnabled = visible;
        this.base?.setVisible(visible);
        this.thumb?.setVisible(visible);
        if (!visible) {
            this.activePointerId = -1;
            this.resetJoystick();
        }
        if (this.actionButton) {
            this.actionButton.setVisible(visible);
        }
    }

    public destroy(): void {
        if (this.onPointerDown) this.scene.input.off('pointerdown', this.onPointerDown);
        if (this.onPointerMove) this.scene.input.off('pointermove', this.onPointerMove);
        if (this.onPointerUp) this.scene.input.off('pointerup', this.onPointerUp);
        this.onPointerDown = null;
        this.onPointerMove = null;
        this.onPointerUp = null;

        this.base?.destroy();
        this.thumb?.destroy();
        this.base = null;
        this.thumb = null;

        if (this.actionButton) {
            this.actionButton.destroy();
            this.actionButton = null;
        }
        this.keyboardKeys = null;
    }
}
