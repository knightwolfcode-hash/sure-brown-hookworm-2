import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame, { EventBus } from './game/main';
import {
    ANANSI_PRAISE,
    ANANSI_TAUNT,
    ARENA,
    EV,
    GameMode,
    RIDDLES,
    RUNNER,
    TALES,
} from './game/config';
import { isSoundMuted, playSFX, setSoundMuted } from './game/audio';

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface RunnerHudData {
    distance: number;
    maxDistance: number;
    snaresLeft: number;
    beastDistance: number;
    beastStunned: boolean;
    hp: number;
}

interface ArenaHudData {
    birdHp: number;
    maxBirdHp: number;
    playerHp: number;
    maxPlayerHp: number;
    netCooldownPct: number;
}

interface SelectedRelicData {
    relicId: 'leucrocotta' | 'impundulu' | 'anansi';
    title: string;
    introText: string;
}

interface TaleOutcome {
    taleId: string;
    title?: string;
    summary?: string;
    reason?: string;
}

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Navigation & Mode
    const [currentMode, setCurrentMode] = useState<GameMode>('HEARTH');
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [muted, setMuted] = useState<boolean>(isSoundMuted());

    // Completed tales
    const [completedTales, setCompletedTales] = useState<Set<string>>(new Set());

    // Elder Dialogue
    const [dialogue, setDialogue] = useState<SelectedRelicData | null>(null);

    // Runner HUD (Tale 1)
    const [runnerHud, setRunnerHud] = useState<RunnerHudData>({
        distance: 0,
        maxDistance: RUNNER.targetDistance,
        snaresLeft: RUNNER.startSnares,
        beastDistance: RUNNER.startGap,
        beastStunned: false,
        hp: RUNNER.startLives,
    });

    // Arena HUD (Tale 2)
    const [arenaHud, setArenaHud] = useState<ArenaHudData>({
        birdHp: ARENA.birdMaxHp,
        maxBirdHp: ARENA.birdMaxHp,
        playerHp: ARENA.playerMaxHp,
        maxPlayerHp: ARENA.playerMaxHp,
        netCooldownPct: 0,
    });

    // Anansi's Riddles State (Tale 3)
    const [riddleIndex, setRiddleIndex] = useState<number>(0);
    const [riddleFeedback, setRiddleFeedback] = useState<{
        type: 'none' | 'correct' | 'wrong';
        message: string;
    }>({ type: 'none', message: '' });
    const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean[]>(new Array(RIDDLES.length).fill(false));

    // Modals
    const [victoryModal, setVictoryModal] = useState<TaleOutcome | null>(null);
    const [defeatModal, setDefeatModal] = useState<TaleOutcome | null>(null);

    // Mount Phaser Game
    useLayoutEffect(() => {
        if (phaserRef.current === null) {
            const game = StartGame('game-container');
            phaserRef.current = { game, scene: null };
        }

        const handler = (scene: Phaser.Scene) => {
            if (phaserRef.current) {
                phaserRef.current.scene = scene;
            }
        };
        EventBus.on(EV.SCENE_READY, handler);

        return () => {
            EventBus.removeListener(EV.SCENE_READY, handler);
            if (phaserRef.current) {
                phaserRef.current.game?.destroy(true);
                phaserRef.current = null;
            }
        };
    }, []);

    // Listen for Phaser Game Events
    useEffect(() => {
        const handleRelic = (data: SelectedRelicData) => {
            setDialogue(data);
        };

        const handleRunnerHud = (data: RunnerHudData) => {
            setRunnerHud(data);
        };

        const handleArenaHud = (data: ArenaHudData) => {
            setArenaHud(data);
        };

        const handleCompleted = (data: { taleId: string; title: string; summary: string }) => {
            setCompletedTales(prev => new Set(prev).add(data.taleId));
            setVictoryModal(data);
        };

        const handleFailed = (data: { taleId: string; reason: string }) => {
            setDefeatModal(data);
        };

        EventBus.on(EV.RELIC_SELECTED, handleRelic);
        EventBus.on(EV.UPDATE_RUNNER_HUD, handleRunnerHud);
        EventBus.on(EV.UPDATE_ARENA_HUD, handleArenaHud);
        EventBus.on(EV.TALE_COMPLETED, handleCompleted);
        EventBus.on(EV.TALE_FAILED, handleFailed);

        return () => {
            EventBus.removeListener(EV.RELIC_SELECTED, handleRelic);
            EventBus.removeListener(EV.UPDATE_RUNNER_HUD, handleRunnerHud);
            EventBus.removeListener(EV.UPDATE_ARENA_HUD, handleArenaHud);
            EventBus.removeListener(EV.TALE_COMPLETED, handleCompleted);
            EventBus.removeListener(EV.TALE_FAILED, handleFailed);
        };
    }, []);

    // Global Key Listener for Pause
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (currentMode !== 'HEARTH') {
                    togglePause();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentMode, isPaused]);

    // Mode Switcher Helper
    const switchMode = (mode: GameMode) => {
        playSFX('button');
        setCurrentMode(mode);
        setIsPaused(false);
        setDialogue(null);
        setVictoryModal(null);
        setDefeatModal(null);

        // Reset Tale 3 if switching into it
        if (mode === 'TALE_RIDDLES') {
            setRiddleIndex(0);
            setRiddleFeedback({ type: 'none', message: '' });
            setAnsweredCorrectly(new Array(RIDDLES.length).fill(false));
        }

        EventBus.emit(EV.SWITCH_MODE, { mode });
    };

    const togglePause = () => {
        playSFX('button');
        const nextState = !isPaused;
        setIsPaused(nextState);
        EventBus.emit(EV.TOGGLE_PAUSE, { isPaused: nextState });
    };

    const toggleSound = () => {
        const nextMuted = !muted;
        setMuted(nextMuted);
        setSoundMuted(nextMuted);
        const scene = phaserRef.current?.scene;
        if (scene) {
            scene.sound.mute = nextMuted;
        }
    };

    const handleRestartTale = () => {
        setIsPaused(false);
        setVictoryModal(null);
        setDefeatModal(null);
        EventBus.emit(EV.TOGGLE_PAUSE, { isPaused: false });
        switchMode(currentMode);
    };

    // Tale 3: Riddle Answer Click
    const handleSelectOption = (optIdx: number) => {
        const currentRiddle = RIDDLES[riddleIndex];
        if (!currentRiddle) return;

        if (optIdx === currentRiddle.correct) {
            // Correct Answer!
            playSFX('coin');
            const praise = ANANSI_PRAISE[riddleIndex % ANANSI_PRAISE.length];
            setRiddleFeedback({ type: 'correct', message: praise });

            const nextAnswers = [...answeredCorrectly];
            nextAnswers[riddleIndex] = true;
            setAnsweredCorrectly(nextAnswers);

            EventBus.emit(EV.RIDDLE_ANSWERED, { index: riddleIndex, correct: true });

            if (riddleIndex + 1 >= RIDDLES.length) {
                // Completed all 5 riddles!
                setTimeout(() => {
                    playSFX('win');
                    setCompletedTales(prev => new Set(prev).add('anansi'));
                    setVictoryModal({
                        taleId: 'anansi',
                        title: TALES.anansi.title,
                        summary: TALES.anansi.victorySummary,
                    });
                }, 1000);
            } else {
                setTimeout(() => {
                    setRiddleIndex(prev => prev + 1);
                    setRiddleFeedback({ type: 'none', message: '' });
                }, 1300);
            }
        } else {
            // Wrong Answer!
            playSFX('hit');
            const taunt = ANANSI_TAUNT[Math.floor(Math.random() * ANANSI_TAUNT.length)];
            setRiddleFeedback({ type: 'wrong', message: taunt });
        }
    };

    return (
        <div id="app">
            <div id="game-container" />

            <div id="hud">
                {/* 1. Global Navigation Bar */}
                <header className="global-nav">
                    <div className="nav-group">
                        <button
                            className={`nav-btn ${currentMode === 'HEARTH' ? 'active' : ''}`}
                            onClick={() => switchMode('HEARTH')}
                        >
                            <span className="icon">🔥</span>
                            <span className="btn-label">The Hearth</span>
                        </button>
                        <button
                            className={`nav-btn ${currentMode === 'TALE_RUNNER' ? 'active' : ''} ${
                                completedTales.has('leucrocotta') ? 'completed' : ''
                            }`}
                            onClick={() => switchMode('TALE_RUNNER')}
                        >
                            <span className="icon">🐾</span>
                            <span className="btn-label">1: Leucrocotta</span>
                            {completedTales.has('leucrocotta') && <span className="badge">✓</span>}
                        </button>
                        <button
                            className={`nav-btn ${currentMode === 'TALE_LIGHTNING' ? 'active' : ''} ${
                                completedTales.has('impundulu') ? 'completed' : ''
                            }`}
                            onClick={() => switchMode('TALE_LIGHTNING')}
                        >
                            <span className="icon">⚡</span>
                            <span className="btn-label">2: Impundulu</span>
                            {completedTales.has('impundulu') && <span className="badge">✓</span>}
                        </button>
                        <button
                            className={`nav-btn ${currentMode === 'TALE_RIDDLES' ? 'active' : ''} ${
                                completedTales.has('anansi') ? 'completed' : ''
                            }`}
                            onClick={() => switchMode('TALE_RIDDLES')}
                        >
                            <span className="icon">🕸️</span>
                            <span className="btn-label">3: Anansi</span>
                            {completedTales.has('anansi') && <span className="badge">✓</span>}
                        </button>
                    </div>

                    <div className="nav-controls">
                        <button className="icon-btn" onClick={toggleSound} title="Toggle Audio">
                            {muted ? '🔇' : '🔊'}
                        </button>
                        {currentMode !== 'HEARTH' && (
                            <button className="icon-btn pause-btn" onClick={togglePause} title="Pause Tale">
                                {isPaused ? '▶️' : '⏸️'}
                            </button>
                        )}
                    </div>
                </header>

                {/* 2. Mode-Specific HUD: Tale 1 Runner */}
                {currentMode === 'TALE_RUNNER' && (
                    <div className="runner-hud">
                        <div className="hud-card distance-card">
                            <div className="hud-row">
                                <span className="hud-label">DISTANCE</span>
                                <span className="hud-val">{runnerHud.distance}m / {runnerHud.maxDistance}m</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${Math.min(100, (runnerHud.distance / runnerHud.maxDistance) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="hud-card beast-card">
                            <div className="hud-row">
                                <span className="hud-label">LEUCROCOTTA</span>
                                <span className={`hud-val ${runnerHud.beastStunned ? 'beast-stunned' : ''}`}>
                                    {runnerHud.beastStunned ? '⚡ STUNNED (3s)' : `${runnerHud.beastDistance}% GAP`}
                                </span>
                            </div>
                            <div className="progress-bar-bg beast-bar">
                                <div
                                    className={`progress-bar-fill ${runnerHud.beastDistance < 25 ? 'danger' : ''}`}
                                    style={{ width: `${Math.max(5, runnerHud.beastDistance)}%` }}
                                />
                            </div>
                        </div>

                        <div className="hud-stats-group">
                            <div className="hud-card stat-card">
                                <span className="hud-label">SNARES [S]</span>
                                <div className="snares-icons">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`snare-dot ${i < runnerHud.snaresLeft ? 'active' : 'empty'}`}
                                        >
                                            🪤
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="hud-card stat-card">
                                <span className="hud-label">LIVES</span>
                                <div className="hearts-icons">
                                    {Array.from({ length: RUNNER.startLives }).map((_, i) => (
                                        <span key={i} className={`heart ${i < runnerHud.hp ? 'active' : 'lost'}`}>
                                            ❤️
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Touch Action Controls for Runner */}
                        <div className="touch-controls runner-touch">
                            <button
                                className="touch-btn snare-action-btn"
                                onPointerDown={e => {
                                    e.currentTarget.setPointerCapture(e.pointerId);
                                    EventBus.emit(EV.TOUCH_INPUT, 'snare');
                                }}
                            >
                                <span>🪤</span>
                                <label>DROP SNARE</label>
                            </button>
                            <button
                                className="touch-btn jump-action-btn"
                                onPointerDown={e => {
                                    e.currentTarget.setPointerCapture(e.pointerId);
                                    EventBus.emit(EV.TOUCH_INPUT, 'jump');
                                }}
                            >
                                <span>⬆️</span>
                                <label>JUMP</label>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Mode-Specific HUD: Tale 2 Arena */}
                {currentMode === 'TALE_LIGHTNING' && (
                    <div className="arena-hud">
                        <div className="hud-card boss-card">
                            <div className="hud-row">
                                <span className="hud-label">⚡ IMPUNDULU BIRD</span>
                                <span className="hud-val">{arenaHud.birdHp} / {arenaHud.maxBirdHp} HP</span>
                            </div>
                            <div className="boss-hp-segments">
                                {Array.from({ length: arenaHud.maxBirdHp }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`boss-hp-pip ${i < arenaHud.birdHp ? 'filled' : 'lost'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="hud-card player-arena-card">
                            <div className="hud-row">
                                <span className="hud-label">HUNTER HP</span>
                                <div className="hearts-icons">
                                    {Array.from({ length: arenaHud.maxPlayerHp }).map((_, i) => (
                                        <span key={i} className={`heart ${i < arenaHud.playerHp ? 'active' : 'lost'}`}>
                                            ❤️
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="net-cooldown-status">
                                <span>Fire Net:</span>
                                <div className="cooldown-track">
                                    <div
                                        className="cooldown-fill"
                                        style={{ width: `${(1 - arenaHud.netCooldownPct) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Touch Fire Net Button */}
                        <div className="touch-controls arena-touch">
                            <button
                                className="touch-btn fire-net-btn"
                                onPointerDown={e => {
                                    e.currentTarget.setPointerCapture(e.pointerId);
                                    EventBus.emit(EV.TOUCH_INPUT, 'fire_net');
                                }}
                            >
                                <span>🔥</span>
                                <label>FIRE NET</label>
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. Mode-Specific HUD: Tale 3 Anansi's Riddles */}
                {currentMode === 'TALE_RIDDLES' && (
                    <div className="riddles-overlay">
                        {/* Progress Nodes Bar */}
                        <div className="riddle-nodes-bar">
                            {RIDDLES.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`riddle-node ${
                                        idx === riddleIndex ? 'current' : answeredCorrectly[idx] ? 'done' : 'pending'
                                    }`}
                                >
                                    <span>{answeredCorrectly[idx] ? '✓' : idx + 1}</span>
                                </div>
                            ))}
                        </div>

                        {/* Riddle Card */}
                        <div className="riddle-card">
                            <span className="riddle-header">RIDDLE {riddleIndex + 1} OF {RIDDLES.length}</span>
                            <h2 className="riddle-question">{RIDDLES[riddleIndex]?.question}</h2>

                            <div className="options-grid">
                                {RIDDLES[riddleIndex]?.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        className="option-btn"
                                        onClick={() => handleSelectOption(idx)}
                                    >
                                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="option-text">{option}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Anansi Reaction / Feedback Box */}
                            {riddleFeedback.type !== 'none' && (
                                <div className={`anansi-speech ${riddleFeedback.type}`}>
                                    <span className="spider-avatar">🕸️</span>
                                    <p className="speech-text">"{riddleFeedback.message}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. Elder Dialogue Overlay (Hearth Hub) */}
                {currentMode === 'HEARTH' && dialogue && (
                    <div className="dialogue-overlay">
                        <div className="dialogue-box">
                            <div className="elder-header">
                                <span className="elder-avatar-badge">👴🏾</span>
                                <div>
                                    <h3 className="elder-name">Baba Olatunji</h3>
                                    <span className="elder-tale-title">{dialogue.title}</span>
                                </div>
                            </div>
                            <p className="dialogue-text">{dialogue.introText}</p>
                            <div className="dialogue-actions">
                                <button className="dialogue-btn secondary" onClick={() => setDialogue(null)}>
                                    Remain at the Hearth
                                </button>
                                <button
                                    className="dialogue-btn primary"
                                    onClick={() => {
                                        const tale = TALES[dialogue.relicId];
                                        if (tale) switchMode(tale.mode);
                                    }}
                                >
                                    Step into the Tale →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Pause Modal */}
                {isPaused && (
                    <div className="modal-backdrop">
                        <div className="modal-content pause-modal">
                            <h2 className="modal-title">TALE PAUSED</h2>
                            <p className="modal-desc">The storyteller pauses his breath. When will you continue?</p>
                            <div className="modal-buttons">
                                <button className="modal-btn primary" onClick={togglePause}>
                                    Resume Tale
                                </button>
                                <button className="modal-btn secondary" onClick={handleRestartTale}>
                                    Restart This Tale
                                </button>
                                <button className="modal-btn tertiary" onClick={() => switchMode('HEARTH')}>
                                    Return to the Hearth
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Victory Modal */}
                {victoryModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content victory-modal">
                            <div className="modal-badge-icon">🌟</div>
                            <h2 className="modal-title">TALE COMPLETED</h2>
                            <h3 className="modal-subtitle">{victoryModal.title}</h3>
                            <p className="modal-lore">{victoryModal.summary}</p>
                            <div className="modal-buttons">
                                <button className="modal-btn primary" onClick={() => switchMode('HEARTH')}>
                                    Return to the Elder's Hearth
                                </button>
                                <button
                                    className="modal-btn secondary"
                                    onClick={() => {
                                        if (victoryModal.taleId === 'leucrocotta') switchMode('TALE_LIGHTNING');
                                        else if (victoryModal.taleId === 'impundulu') switchMode('TALE_RIDDLES');
                                        else switchMode('HEARTH');
                                    }}
                                >
                                    Hear Next Tale →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. Defeat Modal */}
                {defeatModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content defeat-modal">
                            <div className="modal-badge-icon">🌑</div>
                            <h2 className="modal-title">THE TALE ENDS HERE</h2>
                            <p className="modal-lore">{defeatModal.reason}</p>
                            <div className="modal-buttons">
                                <button className="modal-btn primary" onClick={handleRestartTale}>
                                    Hear the Tale Again (Retry)
                                </button>
                                <button className="modal-btn secondary" onClick={() => switchMode('HEARTH')}>
                                    Return to the Hearth
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
