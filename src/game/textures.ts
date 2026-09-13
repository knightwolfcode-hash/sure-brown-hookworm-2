import * as Phaser from 'phaser';

/**
 * Procedural High-Definition Textures for African Folklore Anthology.
 * Generated onto Phaser CanvasTextures / Graphics textures at boot time.
 */
export function createAllTextures(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Baba Olatunji (Storyteller)
    if (!tm.exists('baba_olatunji')) {
        const ct = tm.createCanvas('baba_olatunji', 120, 140);
        if (ct) {
            const ctx = ct.context;
            // Warm shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(60, 130, 45, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body silhouette & Kente robes
            ctx.fillStyle = '#1c1514';
            ctx.beginPath();
            ctx.moveTo(35, 130);
            ctx.quadraticCurveTo(20, 75, 45, 60);
            ctx.quadraticCurveTo(60, 55, 75, 60);
            ctx.quadraticCurveTo(100, 75, 85, 130);
            ctx.closePath();
            ctx.fill();

            // Kente cloth sash (Rich gold and terracotta geometric stripes)
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(38, 70);
            ctx.lineTo(82, 125);
            ctx.stroke();

            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(42, 65);
            ctx.lineTo(86, 120);
            ctx.stroke();

            // Head & Turban/Headwrap
            ctx.fillStyle = '#2d1e18';
            ctx.beginPath();
            ctx.arc(60, 45, 18, 0, Math.PI * 2);
            ctx.fill();

            // Traditional Headwrap
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(60, 38, 17, Math.PI, 0);
            ctx.lineTo(77, 42);
            ctx.lineTo(43, 42);
            ctx.closePath();
            ctx.fill();

            // White Elder Beard
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(50, 48);
            ctx.quadraticCurveTo(60, 75, 70, 48);
            ctx.closePath();
            ctx.fill();

            // Wooden staff
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(95, 30);
            ctx.lineTo(95, 135);
            ctx.stroke();

            // Staff glowing amber orb
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(95, 26, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();

            ct.refresh();
        }
    }

    // 2. Relic 1: The Beast's Bone (Tale 1)
    if (!tm.exists('relic_bone')) {
        const ct = tm.createCanvas('relic_bone', 80, 80);
        if (ct) {
            const ctx = ct.context;
            // Crimson spiritual aura
            const grad = ctx.createRadialGradient(40, 40, 10, 40, 40, 38);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 80, 80);

            // Carved Bone Shape
            ctx.save();
            ctx.translate(40, 40);
            ctx.rotate(0.4);

            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            // Left condyles
            ctx.arc(-22, -8, 7, 0, Math.PI * 2);
            ctx.arc(-22, 8, 7, 0, Math.PI * 2);
            // Right condyles
            ctx.arc(22, -8, 7, 0, Math.PI * 2);
            ctx.arc(22, 8, 7, 0, Math.PI * 2);
            // Shaft
            ctx.rect(-18, -6, 36, 12);
            ctx.fill();

            // Leather wrapping
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -6);
            ctx.lineTo(-4, 6);
            ctx.moveTo(0, -6);
            ctx.lineTo(6, 6);
            ctx.stroke();

            // Crimson etched runes
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(14, 0);
            ctx.stroke();

            ctx.restore();
            ct.refresh();
        }
    }

    // 3. Relic 2: The Storm Feather (Tale 2)
    if (!tm.exists('relic_feather')) {
        const ct = tm.createCanvas('relic_feather', 80, 80);
        if (ct) {
            const ctx = ct.context;
            // Cyan electric aura
            const grad = ctx.createRadialGradient(40, 40, 10, 40, 40, 38);
            grad.addColorStop(0, 'rgba(56, 217, 169, 0.5)');
            grad.addColorStop(1, 'rgba(56, 217, 169, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 80, 80);

            // Electric Quill & Feather
            ctx.save();
            ctx.translate(40, 40);
            ctx.rotate(-0.35);

            // Feather blade
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.quadraticCurveTo(18, -10, 8, 25);
            ctx.lineTo(0, 30);
            ctx.lineTo(-8, 25);
            ctx.quadraticCurveTo(-18, -10, 0, -30);
            ctx.closePath();
            ctx.fill();

            // Inner bright vane
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.quadraticCurveTo(10, -5, 4, 18);
            ctx.lineTo(0, 20);
            ctx.lineTo(-4, 18);
            ctx.quadraticCurveTo(-10, -5, 0, -25);
            ctx.closePath();
            ctx.fill();

            // Shaft (pure electric white)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(0, 32);
            ctx.stroke();

            // Lightning crackle arcs
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-12, -8);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-8, 8);
            ctx.moveTo(12, 5);
            ctx.lineTo(5, 10);
            ctx.lineTo(10, 18);
            ctx.stroke();

            ctx.restore();
            ct.refresh();
        }
    }

    // 4. Relic 3: The Golden Web (Tale 3)
    if (!tm.exists('relic_web')) {
        const ct = tm.createCanvas('relic_web', 80, 80);
        if (ct) {
            const ctx = ct.context;
            // Gold mystic aura
            const grad = ctx.createRadialGradient(40, 40, 10, 40, 40, 38);
            grad.addColorStop(0, 'rgba(245, 159, 0, 0.45)');
            grad.addColorStop(1, 'rgba(245, 159, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 80, 80);

            // Spider web strands
            ctx.strokeStyle = '#fcd34d';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 8; i++) {
                const ang = (i * Math.PI) / 4;
                ctx.beginPath();
                ctx.moveTo(40, 40);
                ctx.lineTo(40 + Math.cos(ang) * 28, 40 + Math.sin(ang) * 28);
                ctx.stroke();
            }

            // Concentric octagons
            for (const r of [10, 18, 26]) {
                ctx.beginPath();
                for (let i = 0; i <= 8; i++) {
                    const ang = (i * Math.PI) / 4;
                    const px = 40 + Math.cos(ang) * r;
                    const py = 40 + Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            // Golden center spider icon
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(40, 40, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(40, 40, 3, 0, Math.PI * 2);
            ctx.fill();

            ct.refresh();
        }
    }

    // 5. Hunter Runner (Tale 1 Player)
    if (!tm.exists('hunter_runner')) {
        const ct = tm.createCanvas('hunter_runner', 64, 64);
        if (ct) {
            const ctx = ct.context;
            // Running Hunter Silhouette with details
            ctx.fillStyle = '#261b17';
            // Torso
            ctx.beginPath();
            ctx.moveTo(32, 22);
            ctx.lineTo(40, 42);
            ctx.lineTo(26, 42);
            ctx.closePath();
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.arc(34, 16, 7, 0, Math.PI * 2);
            ctx.fill();

            // Red Feathered Headband
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(28, 13, 12, 3);
            ctx.beginPath();
            ctx.moveTo(27, 14);
            ctx.lineTo(21, 6);
            ctx.lineTo(25, 14);
            ctx.closePath();
            ctx.fill();

            // Legs in running stride
            ctx.strokeStyle = '#261b17';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            // Front leg bent forward
            ctx.beginPath();
            ctx.moveTo(36, 42);
            ctx.lineTo(48, 52);
            ctx.lineTo(44, 60);
            ctx.stroke();
            // Back leg trailing
            ctx.beginPath();
            ctx.moveTo(28, 42);
            ctx.lineTo(16, 50);
            ctx.lineTo(10, 58);
            ctx.stroke();

            // Spear in hand
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(12, 32);
            ctx.lineTo(58, 22);
            ctx.stroke();

            // Spear tip (flint/metal)
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(58, 22);
            ctx.lineTo(64, 20);
            ctx.lineTo(59, 25);
            ctx.closePath();
            ctx.fill();

            ct.refresh();
        }
    }

    // 6. The Leucrocotta Beast (Tale 1 Pursuer)
    if (!tm.exists('leucrocotta_beast')) {
        const ct = tm.createCanvas('leucrocotta_beast', 110, 70);
        if (ct) {
            const ctx = ct.context;
            // Menacing Hyena-Panther Beast Body
            ctx.fillStyle = '#1e1b18';
            // Body
            ctx.beginPath();
            ctx.ellipse(55, 38, 38, 20, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Spiked mane on shoulders
            ctx.fillStyle = '#0f0e0c';
            ctx.beginPath();
            ctx.moveTo(40, 20);
            ctx.lineTo(50, 10);
            ctx.lineTo(56, 22);
            ctx.lineTo(64, 12);
            ctx.lineTo(70, 24);
            ctx.lineTo(40, 24);
            ctx.closePath();
            ctx.fill();

            // Snarling Head with long muzzle
            ctx.fillStyle = '#1e1b18';
            ctx.beginPath();
            ctx.moveTo(70, 28);
            ctx.lineTo(95, 24);
            ctx.lineTo(105, 36);
            ctx.lineTo(85, 46);
            ctx.closePath();
            ctx.fill();

            // Pointed Hyena Ears
            ctx.beginPath();
            ctx.moveTo(74, 22);
            ctx.lineTo(78, 8);
            ctx.lineTo(85, 20);
            ctx.closePath();
            ctx.fill();

            // Razor jaw & teeth
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(96, 35);
            ctx.lineTo(100, 39);
            ctx.lineTo(94, 38);
            ctx.moveTo(90, 35);
            ctx.lineTo(93, 39);
            ctx.lineTo(88, 38);
            ctx.stroke();

            // Glowing Crimson Eye
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(86, 26, 4, 3, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fee2e2';
            ctx.beginPath();
            ctx.arc(87, 26, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Running legs
            ctx.strokeStyle = '#1e1b18';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            // Front leg reaching forward
            ctx.beginPath();
            ctx.moveTo(75, 45);
            ctx.lineTo(90, 58);
            ctx.lineTo(98, 66);
            ctx.stroke();
            // Back leg pushing
            ctx.beginPath();
            ctx.moveTo(35, 42);
            ctx.lineTo(18, 54);
            ctx.lineTo(8, 64);
            ctx.stroke();

            // Tail
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(20, 34);
            ctx.quadraticCurveTo(8, 30, 4, 42);
            ctx.stroke();

            ct.refresh();
        }
    }

    // 7. Snare Trap (Tale 1 Weapon)
    if (!tm.exists('snare_trap')) {
        const ct = tm.createCanvas('snare_trap', 48, 32);
        if (ct) {
            const ctx = ct.context;
            // Glowing amber ground loop
            ctx.strokeStyle = '#f59f00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(24, 20, 18, 7, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Carved trigger bone
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(18, 16, 12, 6);

            // Magic rune glow
            ctx.fillStyle = 'rgba(245, 159, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(24, 18, 12, 0, Math.PI * 2);
            ctx.fill();

            ct.refresh();
        }
    }

    // 8. Basalt Rock Obstacle
    if (!tm.exists('obstacle_rock')) {
        const ct = tm.createCanvas('obstacle_rock', 48, 52);
        if (ct) {
            const ctx = ct.context;
            // Jagged basalt boulder
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.moveTo(8, 50);
            ctx.lineTo(4, 38);
            ctx.lineTo(14, 18);
            ctx.lineTo(26, 6);
            ctx.lineTo(38, 14);
            ctx.lineTo(44, 36);
            ctx.lineTo(40, 50);
            ctx.closePath();
            ctx.fill();

            // Edge highlight
            ctx.strokeStyle = '#44403c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(14, 18);
            ctx.lineTo(26, 6);
            ctx.lineTo(38, 14);
            ctx.stroke();

            // Basalt cracks
            ctx.strokeStyle = '#0c0a09';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(26, 6);
            ctx.lineTo(24, 28);
            ctx.lineTo(16, 38);
            ctx.stroke();

            ct.refresh();
        }
    }

    // 9. Acacia Thorn Bush Obstacle
    if (!tm.exists('obstacle_thorn')) {
        const ct = tm.createCanvas('obstacle_thorn', 48, 36);
        if (ct) {
            const ctx = ct.context;
            // Low tangled thorny foliage
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.moveTo(6, 34);
            ctx.quadraticCurveTo(12, 10, 24, 16);
            ctx.quadraticCurveTo(36, 8, 42, 34);
            ctx.closePath();
            ctx.fill();

            // Sharp white acacia thorns
            ctx.strokeStyle = '#f5f5f4';
            ctx.lineWidth = 2;
            const thorns = [
                [14, 20, 10, 12],
                [22, 14, 22, 4],
                [30, 16, 36, 8],
                [36, 24, 44, 20],
                [18, 26, 12, 28],
            ];
            for (const [x1, y1, x2, y2] of thorns) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            ct.refresh();
        }
    }

    // 10. Glowing Feather Pickup
    if (!tm.exists('pickup_feather')) {
        const ct = tm.createCanvas('pickup_feather', 36, 36);
        if (ct) {
            const ctx = ct.context;
            const grad = ctx.createRadialGradient(18, 18, 4, 18, 18, 16);
            grad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
            grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 36, 36);

            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(18, 6);
            ctx.quadraticCurveTo(26, 16, 20, 28);
            ctx.lineTo(18, 30);
            ctx.lineTo(16, 28);
            ctx.quadraticCurveTo(10, 16, 18, 6);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(18, 6);
            ctx.lineTo(18, 30);
            ctx.stroke();

            ct.refresh();
        }
    }

    // 11. Sanctuary Gate
    if (!tm.exists('sanctuary_gate')) {
        const ct = tm.createCanvas('sanctuary_gate', 90, 160);
        if (ct) {
            const ctx = ct.context;
            // Wooden village gate posts
            ctx.fillStyle = '#451a03';
            ctx.fillRect(10, 20, 16, 140);
            ctx.fillRect(64, 20, 16, 140);

            // Cross lintel
            ctx.fillRect(4, 20, 82, 18);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(8, 24, 74, 10);

            // Guardian carved shields
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.ellipse(45, 29, 10, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Torches burning on posts
            for (const tx of [18, 72]) {
                ctx.fillStyle = '#1c1917';
                ctx.fillRect(tx - 3, 14, 6, 8);
                // Torch flame
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(tx, 10, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(tx, 9, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ct.refresh();
        }
    }

    // 12. Impundulu Lightning Bird (Tale 2 Boss)
    if (!tm.exists('impundulu_bird')) {
        const ct = tm.createCanvas('impundulu_bird', 96, 96);
        if (ct) {
            const ctx = ct.context;
            // Electric Blue-Cyan Plumage
            ctx.fillStyle = '#083344';
            // Outstretched majestic wings
            ctx.beginPath();
            ctx.moveTo(48, 48);
            ctx.lineTo(10, 24);
            ctx.lineTo(6, 40);
            ctx.lineTo(24, 56);
            ctx.lineTo(48, 54);
            ctx.lineTo(72, 56);
            ctx.lineTo(90, 40);
            ctx.lineTo(86, 24);
            ctx.closePath();
            ctx.fill();

            // Wing feather highlights
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 24);
            ctx.lineTo(48, 48);
            ctx.lineTo(86, 24);
            ctx.stroke();

            // Body
            ctx.fillStyle = '#155e75';
            ctx.beginPath();
            ctx.ellipse(48, 52, 14, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tail feathers
            ctx.fillStyle = '#0e7490';
            ctx.beginPath();
            ctx.moveTo(44, 72);
            ctx.lineTo(48, 92);
            ctx.lineTo(52, 72);
            ctx.closePath();
            ctx.fill();

            // Head & Crown
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath();
            ctx.arc(48, 30, 9, 0, Math.PI * 2);
            ctx.fill();

            // Electric Crown Crest
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(45, 23);
            ctx.lineTo(42, 10);
            ctx.lineTo(47, 18);
            ctx.lineTo(48, 8);
            ctx.lineTo(49, 18);
            ctx.lineTo(54, 10);
            ctx.lineTo(51, 23);
            ctx.closePath();
            ctx.fill();

            // Fierce Beak
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(46, 33);
            ctx.lineTo(48, 42);
            ctx.lineTo(50, 33);
            ctx.closePath();
            ctx.fill();

            // Glowing Eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(45, 29, 2, 0, Math.PI * 2);
            ctx.arc(51, 29, 2, 0, Math.PI * 2);
            ctx.fill();

            ct.refresh();
        }
    }

    // 13. Fire Net Projectile (Tale 2 Weapon)
    if (!tm.exists('fire_net')) {
        const ct = tm.createCanvas('fire_net', 44, 44);
        if (ct) {
            const ctx = ct.context;
            // Fiery radial aura
            const grad = ctx.createRadialGradient(22, 22, 4, 22, 22, 20);
            grad.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 44, 44);

            // Woven net cords
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const off = 8 + i * 9;
                ctx.beginPath();
                ctx.moveTo(off, 8);
                ctx.lineTo(off, 36);
                ctx.moveTo(8, off);
                ctx.lineTo(36, off);
                ctx.stroke();
            }

            // Weighted glowing corners
            ctx.fillStyle = '#dc2626';
            for (const [cx, cy] of [[8, 8], [36, 8], [8, 36], [36, 36]]) {
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ct.refresh();
        }
    }

    // 14. Boundary Stone (Tale 2 Arena Marker)
    if (!tm.exists('boundary_stone')) {
        const ct = tm.createCanvas('boundary_stone', 32, 40);
        if (ct) {
            const ctx = ct.context;
            ctx.fillStyle = '#262626';
            ctx.beginPath();
            ctx.moveTo(6, 38);
            ctx.lineTo(8, 12);
            ctx.lineTo(16, 4);
            ctx.lineTo(24, 12);
            ctx.lineTo(26, 38);
            ctx.closePath();
            ctx.fill();

            // Lightning glyph engraved in stone
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(16, 10);
            ctx.lineTo(13, 20);
            ctx.lineTo(18, 22);
            ctx.lineTo(14, 32);
            ctx.stroke();

            ct.refresh();
        }
    }

    // 15. Hunter Arena Avatar (Tale 2 Player)
    if (!tm.exists('hunter_arena')) {
        const ct = tm.createCanvas('hunter_arena', 48, 48);
        if (ct) {
            const ctx = ct.context;
            // Top-down / isometric tracker silhouette
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.arc(24, 24, 14, 0, Math.PI * 2);
            ctx.fill();

            // Head and feathers
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(24, 22, 8, 0, Math.PI * 2);
            ctx.fill();

            // Crimson feather headband
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(17, 19, 14, 3);
            ctx.beginPath();
            ctx.moveTo(17, 19);
            ctx.lineTo(12, 12);
            ctx.lineTo(16, 19);
            ctx.closePath();
            ctx.fill();

            // Shoulders & Quiver
            ctx.fillStyle = '#b45309';
            ctx.fillRect(18, 30, 12, 6);

            ct.refresh();
        }
    }

    // 16. Anansi Spider Icon (Tale 3 Hub/Visual)
    if (!tm.exists('anansi_spider')) {
        const ct = tm.createCanvas('anansi_spider', 96, 96);
        if (ct) {
            const ctx = ct.context;
            // Golden trickster spider
            ctx.fillStyle = '#1e1b4b';
            // Abdomen with sacred gold patterns
            ctx.beginPath();
            ctx.ellipse(48, 58, 18, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(48, 58, 12, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Thorax & Head
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.arc(48, 36, 12, 0, Math.PI * 2);
            ctx.fill();

            // Golden eyes
            ctx.fillStyle = '#fef08a';
            for (const [ex, ey] of [[44, 32], [52, 32], [42, 36], [54, 36]]) {
                ctx.beginPath();
                ctx.arc(ex, ey, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // 8 Spidery legs
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            const legOffsets = [
                [-14, -8, -32, -18, -42, -6],
                [-14, 0, -36, 4, -44, 20],
                [-14, 8, -34, 22, -40, 42],
                [-10, 18, -26, 36, -32, 54],
                [14, -8, 32, -18, 42, -6],
                [14, 0, 36, 4, 44, 20],
                [14, 8, 34, 22, 40, 42],
                [10, 18, 26, 36, 32, 54],
            ];
            for (const [x1, y1, x2, y2, x3, y3] of legOffsets) {
                ctx.beginPath();
                ctx.moveTo(48 + x1, 44 + y1);
                ctx.quadraticCurveTo(48 + x2, 44 + y2, 48 + x3, 44 + y3);
                ctx.stroke();
            }

            ct.refresh();
        }
    }
}