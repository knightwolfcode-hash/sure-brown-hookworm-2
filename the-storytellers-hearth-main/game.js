import * as THREE from "three"
import {
  createGame,
  models,
  lights,
  math,
  palette,
  createParticles,
  createShake,
} from "./engine/index.js"
import { LORE, ANANSI_SCENARIOS } from "./minigames.js"

// ==========================================
// 0. DYNAMIC DOM INJECTION
// ==========================================

function setupUI() {
  if (document.getElementById("game-ui-root")) return

  const uiContainer = document.createElement("div")
  uiContainer.id = "game-ui-root"
  uiContainer.innerHTML = `
    <!-- Top Overworld HUD -->
    <header id="relic-hud" class="hidden">
      <button class="relic-btn" id="relic-btn-1" data-tale="1">
        🦴 1. Leucrocotta
      </button>
      <button class="relic-btn" id="relic-btn-2" data-tale="2">
        ⚡ 2. Impundulu
      </button>
      <button class="relic-btn" id="relic-btn-3" data-tale="3">
        🕸️ 3. Anansi
      </button>
      <button class="hud-button ghost" id="btn-pause" data-action="pause" style="padding: 8px 14px; font-size: 13px;">
        ⏸ Pause
      </button>
    </header>

    <div id="progress-tokens" class="hidden">
      <span class="token" id="token-1">🦴 SAVANNAH</span>
      <span class="token" id="token-2">⚡ STORM</span>
      <span class="token" id="token-3">🕸️ WEBS</span>
    </div>

    <!-- Typewriter Dialogue Box (Campfire Hub) -->
    <div id="dialogue-box" class="hidden">
      <div class="dialogue-header">
        <div class="dialogue-name">🔥 Elder Storyteller — Baba Olatunji</div>
        <div class="dialogue-sound-ind">🔊 Ancient Wisdom</div>
      </div>
      <div id="dialogue-text">
        <span class="text-content"></span><span class="caret"></span>
      </div>
      <div class="dialogue-footer">
        <div class="dialogue-hint">Click / Press Space to Continue</div>
        <div id="dialogue-actions" class="hidden">
          <button class="dialogue-btn" id="dialogue-btn-launch">Embark on Tale</button>
          <button class="dialogue-btn ghost" id="dialogue-btn-leave">Stay at Hearth</button>
        </div>
      </div>
    </div>

    <!-- Mini-game 2D Layer -->
    <section id="minigame-layer" class="hidden">
      <canvas id="mg-canvas"></canvas>
      
      <!-- Mini-game Top HUD -->
      <div id="mg-hud-top">
        <div id="mg-stat-left">STATUS</div>
        <div id="mg-stat-mid" style="color: var(--gold); font-size: 14px; font-weight: bold; background: rgba(5,6,10,0.7); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);">TALE</div>
        <div id="mg-stat-right">OBJECTIVE</div>
      </div>
      <button class="mg-pause-btn" id="mg-btn-pause" data-action="pause" title="Pause Tale">⏸</button>

      <!-- Tale 3 Anansi Dialogue & Choices -->
      <div id="anansi-dialogue-card" class="hidden">
        <div class="anansi-speaker">🕸️ Kwaku Anansi the Trickster</div>
        <div id="anansi-text"></div>
      </div>
      <div id="mg-choices" class="hidden"></div>

      <!-- Mobile Touch Controls for Mini-games -->
      <div id="mg-touch-left" class="hidden">
        <button class="hud-touch" id="touch-left">◀</button>
        <button class="hud-touch" id="touch-right">▶</button>
      </div>
      <div id="mg-touch-right" class="hidden">
        <button class="hud-touch" id="touch-btn-a">JUMP</button>
        <button class="hud-touch" id="touch-btn-b">SNARE</button>
        <button class="hud-touch" id="touch-btn-c">SPEAR</button>
      </div>

      <!-- Notification Message Popup -->
      <div id="mg-message" class="hidden"></div>
    </section>

    <!-- Start / Title Screen -->
    <div id="start-screen" class="screen">
      <div class="screen-inner">
        <div class="subtitle">An African Folklore Anthology</div>
        <h1 class="title">The Storyteller's Hearth</h1>
        <p>
          Gather around the sacred campfire under the star-swept canopy. The Elder awaits with three ancestral relics. Step into the ancient legends of the savanna, the storm bird, and the spider trickster.
        </p>
        <div class="folklore-cards-preview">
          <div class="lore-card">
            <span class="lore-icon">🦴</span>
            <strong>The Mimic</strong>
            <small>Outrun & trap the Savannah Leucrocotta</small>
          </div>
          <div class="lore-card">
            <span class="lore-icon">⚡</span>
            <strong>The Storm Bird</strong>
            <small>Dodge thunder & ignite the Impundulu</small>
          </div>
          <div class="lore-card">
            <span class="lore-icon">🕸️</span>
            <strong>The Spider's Wager</strong>
            <small>Break Anansi's Curse of Five</small>
          </div>
        </div>
        <button class="hud-button big" id="btn-start" data-action="start">
          🔥 Gather at the Hearth
        </button>
      </div>
    </div>

    <!-- Pause Screen -->
    <div id="pause-screen" class="screen hidden">
      <div class="screen-inner">
        <div class="subtitle">Sacred Repose</div>
        <h2 style="font-size: 32px; color: var(--amber);">Tale Suspended</h2>
        <p id="pause-lore-hint">The embers wait patiently as the spirits pause their dance.</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="hud-button" id="btn-resume" data-action="resume">
            ▶ Resume Tale
          </button>
          <button class="hud-button ghost" id="btn-return-hearth">
            🔥 Return to Hearth
          </button>
          <button class="hud-button ghost" id="btn-restart" data-action="restart">
            🔄 Restart Tale
          </button>
        </div>
      </div>
    </div>

    <!-- Victory / Defeat / Epilogue Screen -->
    <div id="gameover-screen" class="screen hidden">
      <div class="screen-inner">
        <div class="subtitle" id="gameover-tag">Tale Concluded</div>
        <h2 class="title" id="gameover-title" style="font-size: clamp(28px, 5vw, 42px);">Honor Achieved</h2>
        <p id="gameover-narrative">The Elder nods slowly, tossing sweet bark into the flame.</p>
        <div class="score-line" id="gameover-score">Score: 0</div>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 8px;">
          <button class="hud-button big" id="btn-hearth-return">
            🔥 Return to Elder's Hearth
          </button>
          <button class="hud-button ghost" id="btn-retry-tale">
            🔄 Retry This Tale
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(uiContainer)
}

setupUI()

// ==========================================
// 1. GAME SETUP & 3D HEARTH ENVIRONMENT
// ==========================================

const game = createGame({
  background: "#080a10",
  fov: 46,
  fog: { color: "#080a10", near: 15, far: 65 },
})

// Atmospheric Lighting
const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.6)
game.scene.add(ambientLight)
const moonLight = new THREE.DirectionalLight(0x3b82f6, 0.4)
moonLight.position.set(12, 20, 8)
game.scene.add(moonLight)

// Central Roaring Campfire PointLight
const fireLight = new THREE.PointLight(0xff7a18, 4.2, 35, 1.2)
fireLight.position.set(0, 1.4, 0)
game.scene.add(fireLight)

// Ground Plane
const ground = models.ground(75, { color: "#111420", accent: "#1e2235" })
ground.position.y = -0.05
game.scene.add(ground)

// Campfire Logs and Glowing Coals
const campfireGroup = new THREE.Group()

const coalGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.35, 12)
const coalMat = new THREE.MeshStandardMaterial({
  color: 0x1f140e,
  roughness: 0.9,
  emissive: 0x7c2d12,
  emissiveIntensity: 0.5,
})
const coalMound = new THREE.Mesh(coalGeo, coalMat)
coalMound.position.y = 0.15
campfireGroup.add(coalMound)

// Fire logs
for (let i = 0; i < 7; i++) {
  const angle = (i / 7) * Math.PI * 2
  const log = models.box([0.35, 0.3, 2.2], { color: "#3f2010", radius: 0.05 })
  log.position.set(Math.cos(angle) * 0.7, 0.25, Math.sin(angle) * 0.7)
  log.rotation.y = angle + 0.3
  log.rotation.x = 0.15
  campfireGroup.add(log)
}

// Low-poly Flame Core
const flameCores = []
for (let i = 0; i < 5; i++) {
  const fGeo = new THREE.ConeGeometry(0.45 - i * 0.06, 1.4 - i * 0.15, 6)
  const fMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0xff7a18 : 0xf59e0b,
    transparent: true,
    opacity: 0.85,
  })
  const fMesh = new THREE.Mesh(fGeo, fMat)
  fMesh.position.set(
    (Math.random() - 0.5) * 0.4,
    0.7 + i * 0.15,
    (Math.random() - 0.5) * 0.4
  )
  campfireGroup.add(fMesh)
  flameCores.push(fMesh)
}
game.scene.add(campfireGroup)

// Embers Particle Emitter
const embers = createParticles(game.engine, {
  max: 120,
  color: "#ff8c2a",
  size: 0.18,
})
const emberOrigin = new THREE.Vector3(0, 0.8, 0)
const emberDirection = new THREE.Vector3(0, 1, 0)

// Procedural Elder Storyteller (Baba Olatunji)
const elderGroup = new THREE.Group()
elderGroup.position.set(0, 0, 3.8)
elderGroup.rotation.y = Math.PI

const seatLog = models.box([2.4, 0.6, 0.9], { color: "#2d1808", radius: 0.1 })
seatLog.position.set(0, 0.3, 0)
elderGroup.add(seatLog)

const elder = models.character({ color: "#ea580c", accent: "#f59e0b" })
elder.position.set(0, 0.45, 0)
elder.scale.set(1.15, 1.15, 1.15)
elderGroup.add(elder)

const staffGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8)
const staffMat = new THREE.MeshStandardMaterial({ color: 0x3d2010, roughness: 0.8 })
const staff = new THREE.Mesh(staffGeo, staffMat)
staff.position.set(0.9, 1.2, 0.3)
staff.rotation.z = -0.15

const crystalGeo = new THREE.OctahedronGeometry(0.18)
const crystalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b })
const crystal = new THREE.Mesh(crystalGeo, crystalMat)
crystal.position.set(0, 1.35, 0)
staff.add(crystal)
elderGroup.add(staff)
game.scene.add(elderGroup)

// Ceremonial Relic Altar Table
const altarGroup = new THREE.Group()
altarGroup.position.set(0, 0, -3.4)

const altarTable = models.box([4.2, 0.75, 1.6], { color: "#1e2433", radius: 0.08 })
altarTable.position.y = 0.38
altarGroup.add(altarTable)

const pillarL = models.box([0.7, 0.5, 1.2], { color: "#161a25", radius: 0.05 })
pillarL.position.set(-1.6, 0.25, 0)
altarGroup.add(pillarL)
const pillarR = pillarL.clone()
pillarR.position.x = 1.6
altarGroup.add(pillarR)

// 3 Distinct Interactive Procedural Relics
const relics = []

// Relic 1: Bone Horn (Tale 1)
const r1Group = new THREE.Group()
r1Group.position.set(-1.25, 0.95, 0)
r1Group.userData = { taleId: 1, name: "The Mimic's Bone Horn" }

const hornBaseGeo = new THREE.ConeGeometry(0.22, 0.9, 10)
const boneMat = new THREE.MeshStandardMaterial({ color: 0xf5efe0, roughness: 0.4 })
const hornMesh = new THREE.Mesh(hornBaseGeo, boneMat)
hornMesh.rotation.z = Math.PI * 0.35
r1Group.add(hornMesh)

const hornRing = models.coin({ color: "#f59e0b" })
hornRing.scale.set(0.4, 0.4, 0.4)
hornRing.position.set(0, 0.1, 0)
r1Group.add(hornRing)
altarGroup.add(r1Group)
relics.push(r1Group)

// Relic 2: Thunder Feather (Tale 2)
const r2Group = new THREE.Group()
r2Group.position.set(0, 0.95, 0)
r2Group.userData = { taleId: 2, name: "The Thunder Bird Feather" }

const featherGeo = new THREE.BoxGeometry(0.18, 0.95, 0.05)
const featherMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  roughness: 0.3,
  emissive: 0x0284c7,
  emissiveIntensity: 0.6,
})
const featherMesh = new THREE.Mesh(featherGeo, featherMat)
featherMesh.rotation.z = 0.2
featherMesh.rotation.y = 0.4
r2Group.add(featherMesh)

const featherGlow = new THREE.PointLight(0x38bdf8, 1.5, 4)
featherGlow.position.y = 0.3
r2Group.add(featherGlow)
altarGroup.add(r2Group)
relics.push(r2Group)

// Relic 3: Golden Web Coin (Tale 3)
const r3Group = new THREE.Group()
r3Group.position.set(1.25, 0.95, 0)
r3Group.userData = { taleId: 3, name: "Anansi's Golden Web Coin" }

const coinMesh = models.coin({ color: "#f59e0b" })
coinMesh.scale.set(0.9, 0.9, 0.9)
coinMesh.rotation.x = Math.PI * 0.15
r3Group.add(coinMesh)

const coinGlow = new THREE.PointLight(0xf59e0b, 1.2, 3.5)
coinGlow.position.y = 0.2
r3Group.add(coinGlow)
altarGroup.add(r3Group)
relics.push(r3Group)

game.scene.add(altarGroup)

// Perimeter Torches
const torchPositions = [
  [-7, 0, -6],
  [7, 0, -6],
  [-7, 0, 6],
  [7, 0, 6],
]
torchPositions.forEach((pos) => {
  const torch = new THREE.Group()
  torch.position.set(...pos)
  const pole = models.box([0.3, 2.4, 0.3], { color: "#29180e", radius: 0.04 })
  pole.position.y = 1.2
  torch.add(pole)

  const bowl = models.box([0.7, 0.4, 0.7], { color: "#1a1e29", radius: 0.06 })
  bowl.position.y = 2.4
  torch.add(bowl)

  const tLight = new THREE.PointLight(0xff8c2a, 1.8, 14, 1.3)
  tLight.position.y = 2.8
  torch.add(tLight)

  const tFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffaa22 })
  )
  tFlame.position.y = 2.7
  torch.add(tFlame)
  game.scene.add(torch)
})

// Trees and Standing Rocks
for (let i = 0; i < 14; i++) {
  const angle = (i / 14) * Math.PI * 2 + 0.2
  const dist = math.randRange(18, 38)
  const x = Math.cos(angle) * dist
  const z = Math.sin(angle) * dist

  if (i % 2 === 0) {
    const tree = models.tree({ height: math.randRange(6, 9), color: "#0f172a" })
    tree.position.set(x, 0, z)
    game.scene.add(tree)
  } else {
    const rock = models.rock({ radius: math.randRange(1.4, 2.6), color: "#1e293b" })
    rock.position.set(x, 0, z)
    game.scene.add(rock)
  }
}

game.camera.position.set(0, 5.2, 9.5)
game.camera.lookAt(0, 1.2, 0)
// Camera shake: a callable decaying offset, applied in the main update loop.
let shakeAmount = 0
function screenShake(strength = 0.3) {
  shakeAmount = Math.max(shakeAmount, strength)
}

// ==========================================
// 2. STATE & SOUND
// ==========================================

const STORAGE_KEY = "storytellers_hearth_save_v1"
function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {}
  return { tokens: { 1: false, 2: false, 3: false }, score: 0 }
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {}
}

let playerProgress = loadProgress()

const GameState = {
  START: "START",
  HUB: "HUB",
  DIALOGUE: "DIALOGUE",
  RUNNER: "RUNNER",
  ARENA: "ARENA",
  LOGIC: "LOGIC",
  PAUSED: "PAUSED",
  GAMEOVER: "GAMEOVER",
}

let currentState = GameState.START
let previousState = GameState.HUB
let currentActiveTale = 1
let totalScore = playerProgress.score || 0

function playSound(type) {
  if (!game.audio) return
  try {
    if (type === "click") game.audio.tone({ frequency: 650, duration: 0.06, type: "triangle" })
    else if (type === "step") game.audio.tone({ frequency: 220, duration: 0.04, type: "sine" })
    else if (type === "jump") game.audio.play("jump")
    else if (type === "hit") game.audio.play("hit")
    else if (type === "snare") game.audio.tone({ frequency: 320, duration: 0.18, type: "sawtooth" })
    else if (type === "spear") game.audio.tone({ frequency: 880, duration: 0.22, type: "triangle" })
    else if (type === "thunder") game.audio.play("explosion")
    else if (type === "fire") game.audio.play("laser")
    else if (type === "win") game.audio.play("coin")
    else if (type === "dialogue") {
      const pitch = 380 + Math.random() * 140
      game.audio.tone({ frequency: pitch, duration: 0.035, type: "sine", gain: 0.15 })
    }
  } catch (e) {}
}

// ==========================================
// 3. TYPEWRITER DIALOGUE SYSTEM
// ==========================================

const dialogueBox = document.getElementById("dialogue-box")
const dialogueTextEl = dialogueBox?.querySelector(".text-content")
const dialogueActionsEl = document.getElementById("dialogue-actions")
const dialogueLaunchBtn = document.getElementById("dialogue-btn-launch")
const dialogueLeaveBtn = document.getElementById("dialogue-btn-leave")

let typeWriterInterval = null
let currentDialogueLines = []
let currentLineIndex = 0
let isTyping = false
let onDialogueFinished = null
let pendingTaleLaunch = null

function showDialogue(lines, onComplete = null, launchTaleId = null) {
  currentDialogueLines = Array.isArray(lines) ? lines : [lines]
  currentLineIndex = 0
  onDialogueFinished = onComplete
  pendingTaleLaunch = launchTaleId

  if (dialogueBox) dialogueBox.classList.remove("hidden")
  if (dialogueActionsEl) dialogueActionsEl.classList.add("hidden")
  currentState = GameState.DIALOGUE
  playNextDialogueLine()
}

function playNextDialogueLine() {
  if (currentLineIndex >= currentDialogueLines.length) {
    if (pendingTaleLaunch) {
      if (dialogueActionsEl) dialogueActionsEl.classList.remove("hidden")
    } else {
      hideDialogue()
      if (onDialogueFinished) onDialogueFinished()
    }
    return
  }

  const line = currentDialogueLines[currentLineIndex]
  let charIdx = 0
  if (dialogueTextEl) dialogueTextEl.textContent = ""
  isTyping = true

  clearInterval(typeWriterInterval)
  typeWriterInterval = setInterval(() => {
    if (charIdx < line.length) {
      if (dialogueTextEl) dialogueTextEl.textContent += line[charIdx]
      if (charIdx % 3 === 0) playSound("dialogue")
      charIdx++
    } else {
      clearInterval(typeWriterInterval)
      isTyping = false
    }
  }, 24)
}

function advanceDialogue() {
  if (currentState !== GameState.DIALOGUE) return
  if (isTyping) {
    clearInterval(typeWriterInterval)
    isTyping = false
    if (dialogueTextEl) dialogueTextEl.textContent = currentDialogueLines[currentLineIndex]
  } else {
    currentLineIndex++
    playNextDialogueLine()
  }
}

function hideDialogue() {
  clearInterval(typeWriterInterval)
  isTyping = false
  if (dialogueBox) dialogueBox.classList.add("hidden")
  if (dialogueActionsEl) dialogueActionsEl.classList.add("hidden")
  if (currentState === GameState.DIALOGUE) currentState = GameState.HUB
}

if (dialogueBox) {
  dialogueBox.addEventListener("click", (e) => {
    if (e.target.closest("#dialogue-actions")) return
    advanceDialogue()
  })
}
if (dialogueLaunchBtn) {
  dialogueLaunchBtn.addEventListener("click", () => {
    const tId = pendingTaleLaunch
    hideDialogue()
    if (tId) launchTale(tId)
  })
}
if (dialogueLeaveBtn) {
  dialogueLeaveBtn.addEventListener("click", hideDialogue)
}

// ==========================================
// 4. MINI-GAMES STATE & LOGIC
// ==========================================

const mgLayer = document.getElementById("minigame-layer")
const mgCanvas = document.getElementById("mg-canvas")
const mgCtx = mgCanvas?.getContext("2d")
const mgStatLeft = document.getElementById("mg-stat-left")
const mgStatMid = document.getElementById("mg-stat-mid")
const mgStatRight = document.getElementById("mg-stat-right")
const mgTouchLeft = document.getElementById("mg-touch-left")
const mgTouchRight = document.getElementById("mg-touch-right")
const mgChoices = document.getElementById("mg-choices")
const anansiCard = document.getElementById("anansi-dialogue-card")
const anansiText = document.getElementById("anansi-text")
const mgMessage = document.getElementById("mg-message")

function showNotification(text) {
  if (!mgMessage) return
  mgMessage.textContent = text
  mgMessage.classList.remove("hidden")
  clearTimeout(mgMessage._timer)
  mgMessage._timer = setTimeout(() => {
    mgMessage.classList.add("hidden")
  }, 1800)
}

function updateHUDTokens() {
  const t1 = document.getElementById("token-1")
  const t2 = document.getElementById("token-2")
  const t3 = document.getElementById("token-3")
  const r1 = document.getElementById("relic-btn-1")
  const r2 = document.getElementById("relic-btn-2")
  const r3 = document.getElementById("relic-btn-3")

  if (t1 && playerProgress.tokens[1]) t1.classList.add("earned")
  if (t2 && playerProgress.tokens[2]) t2.classList.add("earned")
  if (t3 && playerProgress.tokens[3]) t3.classList.add("earned")

  if (r1 && playerProgress.tokens[1]) r1.classList.add("done")
  if (r2 && playerProgress.tokens[2]) r2.classList.add("done")
  if (r3 && playerProgress.tokens[3]) r3.classList.add("done")
}

// Tale 1 Runner
const runner = {
  active: false,
  distanceToGate: 500,
  playerSpeed: 19,
  playerY: 0,
  playerVY: 0,
  isGrounded: true,
  beastDistance: 140,
  beastSpeed: 22.2,
  beastStunnedTimer: 0,
  snares: [],
  snareCount: 5,
  spearCooldown: 0,
  obstacles: [],
  nextObstacleDist: 50,
  animTime: 0,
  score: 0,
}

function initRunnerGame() {
  runner.active = true
  runner.distanceToGate = 500
  runner.playerSpeed = 19
  runner.playerY = 0
  runner.playerVY = 0
  runner.isGrounded = true
  runner.beastDistance = 140
  runner.beastSpeed = 22.2
  runner.beastStunnedTimer = 0
  runner.snares = []
  runner.snareCount = 5
  runner.spearCooldown = 0
  runner.obstacles = []
  runner.nextObstacleDist = 50
  runner.animTime = 0
  runner.score = 0

  if (mgStatMid) mgStatMid.textContent = "🦴 TALE 1: THE MIMIC OF THE SAVANNAH"
  showNotification("Sprint to the Village Gate (500m)!")
}

function updateRunner(dt) {
  if (!runner.active) return
  runner.animTime += dt

  if (!runner.isGrounded) {
    runner.playerY += runner.playerVY * dt
    // Snappy arcade gravity return: with the 220 impulse in runnerActionJump
    // the hunter peaks at ~40px, comfortably clearing the 25px hit threshold.
    runner.playerVY -= 600 * dt
    if (runner.playerY <= 0) {
      runner.playerY = 0
      runner.playerVY = 0
      runner.isGrounded = true
    }
  }

  const currentSpeed = runner.playerSpeed
  runner.distanceToGate -= currentSpeed * dt
  runner.score += Math.floor(currentSpeed * dt * 5)

  if (runner.beastStunnedTimer > 0) {
    runner.beastStunnedTimer -= dt
  } else {
    const catchRate = runner.beastSpeed - currentSpeed
    runner.beastDistance -= catchRate * dt
  }

  if (runner.spearCooldown > 0) runner.spearCooldown -= dt

  runner.nextObstacleDist -= currentSpeed * dt
  if (runner.nextObstacleDist <= 0) {
    runner.obstacles.push({
      x: mgCanvas ? mgCanvas.width + 60 : 800,
      type: Math.random() > 0.5 ? "rock" : "thorn",
    })
    runner.nextObstacleDist = math.randRange(45, 90)
  }

  for (let i = runner.obstacles.length - 1; i >= 0; i--) {
    const obs = runner.obstacles[i]
    obs.x -= currentSpeed * 22 * dt

    if (obs.x > 140 && obs.x < 195 && runner.playerY < 25) {
      playSound("hit")
      runner.beastDistance -= 24
      runner.obstacles.splice(i, 1)
      showNotification("Stumbled! The Mimic lunges closer!")
      screenShake(0.3)
      continue
    }
    if (obs.x < -100) runner.obstacles.splice(i, 1)
  }

  for (let i = runner.snares.length - 1; i >= 0; i--) {
    const sn = runner.snares[i]
    sn.x -= currentSpeed * 22 * dt
    if (sn.x < 70 && sn.active) {
      sn.active = false
      runner.beastStunnedTimer = 2.4
      runner.beastDistance += 35
      playSound("snare")
      showNotification("Snare Triggered! Mimic is trapped!")
      runner.snares.splice(i, 1)
    } else if (sn.x < -100) {
      runner.snares.splice(i, 1)
    }
  }

  if (mgStatLeft) {
    mgStatLeft.innerHTML = `🏁 Gate: <strong>${Math.max(0, Math.floor(runner.distanceToGate))}m</strong> | Snares: <strong>${runner.snareCount}</strong>`
  }
  if (mgStatRight) {
    const beastColor = runner.beastDistance < 40 ? "#ef4444" : "#f59e0b"
    const spearReady = runner.spearCooldown <= 0 ? "READY" : `${Math.ceil(runner.spearCooldown)}s`
    mgStatRight.innerHTML = `Mimic Gap: <strong style="color:${beastColor}">${Math.floor(runner.beastDistance)}m</strong> | Spear: <strong>${spearReady}</strong>`
  }

  if (runner.distanceToGate <= 0) {
    runner.active = false
    playSound("win")
    totalScore += 500 + runner.score
    playerProgress.tokens[1] = true
    playerProgress.score = totalScore
    saveProgress(playerProgress)
    updateHUDTokens()
    endMiniGame(true, "The Village Gate Slams Shut!", LORE.tale1Win)
    return
  }

  if (runner.beastDistance <= 0) {
    runner.active = false
    playSound("hit")
    screenShake(0.6)
    endMiniGame(false, "The Mimic Strikes!", LORE.tale1Lose)
  }
}

function drawRunner() {
  if (!mgCtx || !mgCanvas) return
  const w = mgCanvas.width
  const h = mgCanvas.height

  const grad = mgCtx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, "#d97706")
  grad.addColorStop(0.4, "#b45309")
  grad.addColorStop(0.7, "#78350f")
  grad.addColorStop(1, "#291307")
  mgCtx.fillStyle = grad
  mgCtx.fillRect(0, 0, w, h)

  mgCtx.fillStyle = "#fef3c7"
  mgCtx.beginPath()
  mgCtx.arc(w * 0.75, h * 0.28, 45, 0, Math.PI * 2)
  mgCtx.fill()

  const duneGrad1 = mgCtx.createLinearGradient(0, h * 0.45, 0, h)
  duneGrad1.addColorStop(0, "#92400e")
  duneGrad1.addColorStop(1, "#451a03")
  mgCtx.fillStyle = duneGrad1
  mgCtx.beginPath()
  mgCtx.moveTo(0, h * 0.6)
  for (let x = 0; x <= w; x += 40) {
    const y = h * 0.58 + Math.sin(x * 0.008 + runner.animTime * 0.5) * 20
    mgCtx.lineTo(x, y)
  }
  mgCtx.lineTo(w, h)
  mgCtx.lineTo(0, h)
  mgCtx.fill()

  const groundY = h * 0.76
  mgCtx.fillStyle = "#3a1700"
  mgCtx.fillRect(0, groundY, w, h - groundY)

  mgCtx.strokeStyle = "rgba(245, 158, 11, 0.25)"
  mgCtx.lineWidth = 3
  const stripeOffset = (runner.animTime * 700) % 60
  for (let x = -stripeOffset; x < w; x += 60) {
    mgCtx.beginPath()
    mgCtx.moveTo(x, groundY)
    mgCtx.lineTo(x - 30, h)
    mgCtx.stroke()
  }

  runner.snares.forEach((sn) => {
    mgCtx.fillStyle = "#f59e0b"
    mgCtx.fillRect(sn.x - 8, groundY - 6, 16, 6)
    mgCtx.strokeStyle = "#ffffff"
    mgCtx.lineWidth = 2
    mgCtx.strokeRect(sn.x - 8, groundY - 6, 16, 6)
  })

  runner.obstacles.forEach((obs) => {
    // Rocks and thorns scaled 1.7x to match the enlarged hunter hitbox.
    mgCtx.save()
    mgCtx.translate(obs.x, groundY)
    mgCtx.scale(1.7, 1.7)
    mgCtx.translate(-obs.x, -groundY)
    if (obs.type === "rock") {
      mgCtx.fillStyle = "#64748b"
      mgCtx.beginPath()
      mgCtx.arc(obs.x, groundY - 14, 18, Math.PI, 0)
      mgCtx.fill()
      mgCtx.fillStyle = "#334155"
      mgCtx.fillRect(obs.x - 14, groundY - 14, 28, 14)
    } else {
      mgCtx.fillStyle = "#9a3412"
      mgCtx.beginPath()
      mgCtx.moveTo(obs.x - 16, groundY)
      mgCtx.lineTo(obs.x, groundY - 32)
      mgCtx.lineTo(obs.x + 16, groundY)
      mgCtx.fill()
    }
    mgCtx.restore()
  })

  const px = 160
  const py = groundY - runner.playerY
  const runCycle = Math.sin(runner.animTime * 14)

  mgCtx.save()
  mgCtx.translate(px, py)
  // Tale 1 clarity pass: hunter sprite scaled 1.7x (collision window and
  // jump height in updateRunner match this footprint).
  mgCtx.scale(1.7, 1.7)

  mgCtx.fillStyle = "rgba(0,0,0,0.4)"
  mgCtx.beginPath()
  mgCtx.ellipse(0, runner.playerY, 18, 6, 0, 0, Math.PI * 2)
  mgCtx.fill()

  mgCtx.fillStyle = "#ea580c"
  mgCtx.fillRect(-10, -42, 20, 26)

  mgCtx.fillStyle = "#b45309"
  mgCtx.beginPath()
  mgCtx.arc(0, -50, 9, 0, Math.PI * 2)
  mgCtx.fill()

  mgCtx.fillStyle = "#f59e0b"
  mgCtx.fillRect(-8, -54, 16, 4)

  mgCtx.strokeStyle = "#78350f"
  mgCtx.lineWidth = 4
  mgCtx.beginPath()
  mgCtx.moveTo(-5, -16)
  mgCtx.lineTo(-8 + runCycle * 10, 0)
  mgCtx.moveTo(5, -16)
  mgCtx.lineTo(8 - runCycle * 10, 0)
  mgCtx.stroke()

  mgCtx.strokeStyle = "#fef08a"
  mgCtx.lineWidth = 3
  mgCtx.beginPath()
  mgCtx.moveTo(-20, -32)
  mgCtx.lineTo(26, -34)
  mgCtx.stroke()

  mgCtx.fillStyle = "#ffffff"
  mgCtx.beginPath()
  mgCtx.moveTo(26, -38)
  mgCtx.lineTo(36, -34)
  mgCtx.lineTo(26, -30)
  mgCtx.fill()
  mgCtx.restore()

  const beastVisualX = px - runner.beastDistance * 4.2
  if (beastVisualX > -150) {
    mgCtx.save()
    mgCtx.translate(beastVisualX, groundY)
    // Leucrocotta beast scaled 1.8x for visual clarity.
    mgCtx.scale(1.8, 1.8)

    if (runner.beastStunnedTimer > 0) {
      mgCtx.fillStyle = "#f59e0b"
      mgCtx.font = "bold 14px monospace"
      mgCtx.fillText("⚡ STUNNED!", -20, -50)
    }

    mgCtx.fillStyle = "#1e1b4b"
    mgCtx.fillRect(-35, -34, 55, 24)

    mgCtx.fillStyle = "#dc2626"
    for (let s = 0; s < 4; s++) {
      mgCtx.beginPath()
      mgCtx.moveTo(-25 + s * 10, -34)
      mgCtx.lineTo(-20 + s * 10, -46)
      mgCtx.lineTo(-15 + s * 10, -34)
      mgCtx.fill()
    }

    mgCtx.fillStyle = "#ef4444"
    mgCtx.beginPath()
    mgCtx.arc(14, -26, 4, 0, Math.PI * 2)
    mgCtx.fill()

    mgCtx.fillStyle = "#ffffff"
    mgCtx.fillRect(8, -18, 16, 4)

    const beastRun = Math.sin(runner.animTime * 16)
    mgCtx.strokeStyle = "#0f172a"
    mgCtx.lineWidth = 5
    mgCtx.beginPath()
    mgCtx.moveTo(-20, -10)
    mgCtx.lineTo(-24 + beastRun * 12, 0)
    mgCtx.moveTo(10, -10)
    mgCtx.lineTo(14 - beastRun * 12, 0)
    mgCtx.stroke()
    mgCtx.restore()
  }

  if (runner.distanceToGate < 100) {
    const gateX = px + runner.distanceToGate * 6.5
    mgCtx.fillStyle = "#451a03"
    mgCtx.fillRect(gateX, groundY - 140, 40, 140)
    mgCtx.fillStyle = "#f59e0b"
    mgCtx.fillRect(gateX + 6, groundY - 110, 28, 110)
    mgCtx.fillStyle = "#ffffff"
    mgCtx.font = "bold 14px monospace"
    mgCtx.fillText("⛩️ VILLAGE GATE", gateX - 25, groundY - 150)
  }

  mgCtx.strokeStyle = "#f59e0b"
  mgCtx.lineWidth = 8
  mgCtx.strokeRect(4, 4, w - 8, h - 8)
}

function runnerActionJump() {
  if (!runner.active) return
  if (runner.isGrounded) {
    runner.playerVY = 220
    runner.isGrounded = false
    playSound("jump")
  }
}

function runnerActionSnare() {
  if (!runner.active) return
  if (runner.snareCount > 0) {
    runner.snareCount--
    runner.snares.push({ x: 160, active: true })
    playSound("step")
    showNotification("Snare Placed Behind!")
  } else {
    showNotification("No snares remaining!")
  }
}

function runnerActionSpear() {
  if (!runner.active) return
  if (runner.spearCooldown > 0) {
    showNotification(`Spear thrust ready in ${Math.ceil(runner.spearCooldown)}s`)
    return
  }

  if (runner.beastDistance <= 65) {
    playSound("spear")
    runner.spearCooldown = 4.0
    runner.beastDistance += 45
    screenShake(0.4)
    showNotification("Direct Spear Hit! Mimic knocked back 45m!")
  } else {
    showNotification("Mimic is too far for spear! (<60m required)")
  }
}

// Tale 2 Arena
const arena = {
  active: false,
  playerX: 0,
  playerY: 0,
  playerHP: 100,
  playerMaxHP: 100,
  dashCooldown: 0,
  dashTimer: 0,
  bossHP: 100,
  bossMaxHP: 100,
  bossPhase: "AERIAL",
  phaseTimer: 0,
  lightningStrikes: [],
  fireNets: [],
  animTime: 0,
  score: 0,
}

function initArenaGame() {
  arena.active = true
  arena.playerX = mgCanvas ? mgCanvas.width * 0.5 : 400
  arena.playerY = mgCanvas ? mgCanvas.height * 0.65 : 400
  arena.playerHP = 100
  arena.dashCooldown = 0
  arena.dashTimer = 0
  arena.bossHP = 100
  arena.bossPhase = "AERIAL"
  arena.phaseTimer = 6.0
  arena.lightningStrikes = []
  arena.fireNets = []
  arena.animTime = 0
  arena.score = 0

  if (mgStatMid) mgStatMid.textContent = "⚡ TALE 2: THE STORM BIRD'S WRATH"
  showNotification("Dodge lightning! Hurl Fire Nets when stunned!")
}

function updateArena(dt) {
  if (!arena.active) return
  arena.animTime += dt

  const w = mgCanvas ? mgCanvas.width : 800
  const h = mgCanvas ? mgCanvas.height : 600

  // engine/input.js exposes the stick/keys as `input.move` (a THREE.Vector2),
  // not a vector() method — calling a missing function here threw every frame
  // and froze the Tale 2 arena loop.
  const move = game.input && game.input.move ? game.input.move : { x: 0, y: 0 }
  const speed = arena.dashTimer > 0 ? 380 : 180
  arena.playerX += move.x * speed * dt
  arena.playerY += move.y * speed * dt

  arena.playerX = Math.max(40, Math.min(w - 40, arena.playerX))
  arena.playerY = Math.max(60, Math.min(h - 50, arena.playerY))

  if (arena.dashTimer > 0) arena.dashTimer -= dt
  if (arena.dashCooldown > 0) arena.dashCooldown -= dt

  arena.phaseTimer -= dt

  if (arena.bossPhase === "AERIAL") {
    if (Math.random() < 0.05 + dt * 1.5 && arena.lightningStrikes.length < 5) {
      // Targeted strike: locks onto the player's CURRENT coordinates with a
      // 1.2s telegraph, forcing constant dash-dodging before each bolt lands.
      arena.lightningStrikes.push({
        x: arena.playerX,
        y: arena.playerY,
        delay: 1.2,
        telegraph: 1.2,
        strikeTimer: 0.35,
        radius: 54,
      })
    }

    if (arena.phaseTimer <= 0) {
      arena.bossPhase = "GROUNDED_STUN"
      arena.phaseTimer = 4.5
      playSound("thunder")
      screenShake(0.5)
      showNotification("Impundulu CRASHES DOWN! Hurl Fire Nets now!")
    }
  } else if (arena.bossPhase === "GROUNDED_STUN") {
    if (arena.phaseTimer <= 0) {
      arena.bossPhase = "AERIAL"
      arena.phaseTimer = 6.5
      showNotification("Impundulu ascends to the storm clouds!")
    }
  }

  for (let i = arena.lightningStrikes.length - 1; i >= 0; i--) {
    const l = arena.lightningStrikes[i]
    if (l.delay > 0) {
      l.delay -= dt
      if (l.delay <= 0) {
        l.delay = 0
        playSound("thunder")
        screenShake(0.3)
      }
    } else {
      l.strikeTimer -= dt
      // Each bolt damages once per strike window (was 20 HP per frame).
      if (arena.dashTimer <= 0 && !l.hasStruck) {
        const dx = arena.playerX - l.x
        const dy = arena.playerY - l.y
        if (dx * dx + dy * dy < l.radius * l.radius) {
          l.hasStruck = true
          playSound("hit")
          arena.playerHP -= 20
          arena.bossHP = Math.min(arena.bossMaxHP, arena.bossHP + 12)
          showNotification("Lightning Hit! Impundulu leeched vitality!")
          screenShake(0.4)
        }
      }
      if (l.strikeTimer <= 0) {
        arena.lightningStrikes.splice(i, 1)
      }
    }
  }

  for (let i = arena.fireNets.length - 1; i >= 0; i--) {
    const fn = arena.fireNets[i]
    fn.y -= 300 * dt

    const bossCenter = { x: w * 0.5, y: h * 0.35 }
    if (arena.bossPhase === "GROUNDED_STUN") {
      const dx = fn.x - bossCenter.x
      const dy = fn.y - bossCenter.y
      if (dx * dx + dy * dy < 48 * 48) {
        playSound("fire")
        arena.bossHP -= 25
        arena.score += 250
        showNotification("Direct Net Hit! Impundulu is burning! (-25 HP)")
        screenShake(0.3)
        arena.fireNets.splice(i, 1)
        continue
      }
    }
    if (fn.y < -50) arena.fireNets.splice(i, 1)
  }

  if (mgStatLeft) {
    const pHPColor = arena.playerHP < 35 ? "#ef4444" : "#38bdf8"
    mgStatLeft.innerHTML = `Player Vitality: <strong style="color:${pHPColor}">${Math.max(0, arena.playerHP)}/100</strong>`
  }
  if (mgStatRight) {
    const bColor = arena.bossHP < 35 ? "#ef4444" : "#f59e0b"
    const stateStr = arena.bossPhase === "GROUNDED_STUN" ? "⚡ STUNNED (ATTACK!)" : "☁️ AERIAL"
    mgStatRight.innerHTML = `Impundulu: <strong style="color:${bColor}">${Math.max(0, arena.bossHP)}/100</strong> | [${stateStr}]`
  }

  if (arena.bossHP <= 0) {
    arena.active = false
    playSound("win")
    totalScore += 600 + arena.score
    playerProgress.tokens[2] = true
    playerProgress.score = totalScore
    saveProgress(playerProgress)
    updateHUDTokens()
    endMiniGame(true, "The Storm Bird is Banished!", LORE.tale2Win)
    return
  }

  if (arena.playerHP <= 0) {
    arena.active = false
    playSound("hit")
    screenShake(0.6)
    endMiniGame(false, "Soul Consumed by Storm!", LORE.tale2Lose)
  }
}

function drawArena() {
  if (!mgCtx || !mgCanvas) return
  const w = mgCanvas.width
  const h = mgCanvas.height

  mgCtx.fillStyle = "#0c0e18"
  mgCtx.fillRect(0, 0, w, h)

  mgCtx.strokeStyle = "rgba(56, 189, 248, 0.2)"
  mgCtx.lineWidth = 4
  mgCtx.beginPath()
  mgCtx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.42, 0, Math.PI * 2)
  mgCtx.stroke()

  arena.lightningStrikes.forEach((l) => {
    if (l.delay > 0) {
      const alpha = 0.35 + Math.sin(arena.animTime * 18) * 0.2
      mgCtx.fillStyle = `rgba(239, 68, 68, ${alpha})`
      mgCtx.beginPath()
      mgCtx.arc(l.x, l.y, l.radius, 0, Math.PI * 2)
      mgCtx.fill()
      mgCtx.strokeStyle = "#ef4444"
      mgCtx.lineWidth = 2
      mgCtx.stroke()

      // 1.2s countdown ring: sweeps shut as the targeted bolt approaches.
      const remain = Math.max(0, Math.min(1, l.delay / (l.telegraph || 1.2)))
      mgCtx.strokeStyle = "#fbbf24"
      mgCtx.lineWidth = 3
      mgCtx.beginPath()
      mgCtx.arc(l.x, l.y, l.radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remain)
      mgCtx.stroke()
    } else {
      mgCtx.fillStyle = "rgba(255, 255, 255, 0.9)"
      mgCtx.beginPath()
      mgCtx.arc(l.x, l.y, l.radius, 0, Math.PI * 2)
      mgCtx.fill()

      mgCtx.strokeStyle = "#38bdf8"
      mgCtx.lineWidth = 5
      mgCtx.beginPath()
      mgCtx.moveTo(l.x, 0)
      mgCtx.lineTo(l.x - 15, l.y * 0.4)
      mgCtx.lineTo(l.x + 20, l.y * 0.7)
      mgCtx.lineTo(l.x, l.y)
      mgCtx.stroke()
    }
  })

  const bossX = w * 0.5
  const bossY = arena.bossPhase === "GROUNDED_STUN" ? h * 0.35 : h * 0.22 + Math.sin(arena.animTime * 3) * 15

  mgCtx.save()
  mgCtx.translate(bossX, bossY)

  if (arena.bossPhase === "GROUNDED_STUN") {
    mgCtx.fillStyle = "#1e1b4b"
    mgCtx.beginPath()
    mgCtx.arc(0, 0, 32, 0, Math.PI * 2)
    mgCtx.fill()

    mgCtx.fillStyle = "rgba(234, 88, 12, 0.75)"
    for (let f = 0; f < 6; f++) {
      const angle = (f / 6) * Math.PI * 2 + arena.animTime * 4
      mgCtx.beginPath()
      mgCtx.arc(Math.cos(angle) * 38, Math.sin(angle) * 38, 8, 0, Math.PI * 2)
      mgCtx.fill()
    }

    mgCtx.fillStyle = "#f59e0b"
    mgCtx.font = "bold 13px monospace"
    mgCtx.fillText("⚡ VULNERABLE!", -48, -42)
  } else {
    mgCtx.fillStyle = "#0284c7"
    const wingSpan = 55 + Math.sin(arena.animTime * 10) * 18

    mgCtx.beginPath()
    mgCtx.moveTo(-10, 0)
    mgCtx.lineTo(-wingSpan, -25)
    mgCtx.lineTo(-wingSpan * 0.6, 20)
    mgCtx.fill()

    mgCtx.beginPath()
    mgCtx.moveTo(10, 0)
    mgCtx.lineTo(wingSpan, -25)
    mgCtx.lineTo(wingSpan * 0.6, 20)
    mgCtx.fill()

    mgCtx.fillStyle = "#0f172a"
    mgCtx.beginPath()
    mgCtx.arc(0, 5, 18, 0, Math.PI * 2)
    mgCtx.fill()

    mgCtx.fillStyle = "#ef4444"
    mgCtx.beginPath()
    mgCtx.moveTo(-4, 18)
    mgCtx.lineTo(4, 18)
    mgCtx.lineTo(0, 32)
    mgCtx.fill()
  }
  mgCtx.restore()

  arena.fireNets.forEach((fn) => {
    mgCtx.fillStyle = "#ea580c"
    mgCtx.beginPath()
    mgCtx.arc(fn.x, fn.y, 14, 0, Math.PI * 2)
    mgCtx.fill()
    mgCtx.strokeStyle = "#f59e0b"
    mgCtx.lineWidth = 3
    mgCtx.stroke()
  })

  mgCtx.save()
  mgCtx.translate(arena.playerX, arena.playerY)

  if (arena.dashTimer > 0) {
    mgCtx.fillStyle = "rgba(56, 189, 248, 0.45)"
    mgCtx.beginPath()
    mgCtx.arc(0, 0, 24, 0, Math.PI * 2)
    mgCtx.fill()
  }

  mgCtx.fillStyle = "#ea580c"
  mgCtx.beginPath()
  mgCtx.arc(0, 0, 14, 0, Math.PI * 2)
  mgCtx.fill()

  mgCtx.fillStyle = "#f5efe0"
  mgCtx.beginPath()
  mgCtx.arc(0, -4, 8, 0, Math.PI * 2)
  mgCtx.fill()

  mgCtx.fillStyle = "#f59e0b"
  mgCtx.fillRect(10, -12, 6, 24)
  mgCtx.fillStyle = "#1e1b4b"
  mgCtx.fillRect(12, -8, 4, 16)
  mgCtx.restore()

  const bw = 12
  for (let x = 0; x < w; x += 24) {
    mgCtx.fillStyle = x % 48 === 0 ? "#38bdf8" : "#f59e0b"
    mgCtx.fillRect(x, 0, 24, bw)
    mgCtx.fillRect(x, h - bw, 24, bw)
  }
  for (let y = 0; y < h; y += 24) {
    mgCtx.fillStyle = y % 48 === 0 ? "#ef4444" : "#10b981"
    mgCtx.fillRect(0, y, bw, 24)
    mgCtx.fillRect(w - bw, y, bw, 24)
  }
}

function arenaActionDash() {
  if (!arena.active) return
  if (arena.dashCooldown <= 0) {
    arena.dashTimer = 0.22
    arena.dashCooldown = 0.85
    playSound("jump")
  }
}

function arenaActionFireNet() {
  if (!arena.active) return
  arena.fireNets.push({ x: arena.playerX, y: arena.playerY, active: true })
  playSound("fire")
}

// Tale 3 Logic Wager
const logicGame = {
  phase: 1,
  currentStep: 0,
  score: 0,
  animTime: 0,
}

function initLogicGame() {
  logicGame.phase = 1
  logicGame.currentStep = 0
  logicGame.score = 0
  logicGame.animTime = 0

  if (mgStatMid) mgStatMid.textContent = "🕸️ TALE 3: THE SPIDER'S WAGER"
  if (mgStatLeft) mgStatLeft.innerHTML = `Ashanti Wager: <strong>Phase 1/3</strong>`
  if (mgStatRight) mgStatRight.innerHTML = `Curse Rule: <strong style="color:#ef4444">NEVER SAY 5</strong>`

  showAnansiStep(0)
}

function showAnansiStep(index) {
  logicGame.currentStep = index
  const scenario = ANANSI_SCENARIOS[index]
  if (!scenario) return

  if (anansiCard) anansiCard.classList.remove("hidden")
  if (anansiText) anansiText.textContent = scenario.prompt

  if (mgChoices) {
    mgChoices.innerHTML = ""
    mgChoices.classList.remove("hidden")

    scenario.choices.forEach((choice) => {
      const btn = document.createElement("button")
      btn.className = "choice-btn"
      btn.textContent = choice.text
      btn.addEventListener("click", () => handleAnansiChoice(choice))
      mgChoices.appendChild(btn)
    })
  }
}

function handleAnansiChoice(choice) {
  if (mgChoices) {
    Array.from(mgChoices.children).forEach((b) => (b.disabled = true))
  }

  showNotification(choice.feedback)

  if (choice.correct) {
    playSound("win")
    logicGame.score += 250

    if (choice.reversalWin || logicGame.currentStep + 1 >= ANANSI_SCENARIOS.length) {
      setTimeout(() => {
        totalScore += 800 + logicGame.score
        playerProgress.tokens[3] = true
        playerProgress.score = totalScore
        saveProgress(playerProgress)
        updateHUDTokens()
        endMiniGame(true, "Anansi Trapped in His Own Wager!", LORE.tale3Win)
      }, 1400)
    } else {
      setTimeout(() => {
        showAnansiStep(logicGame.currentStep + 1)
      }, 1500)
    }
  } else {
    playSound("hit")
    screenShake(0.5)
    setTimeout(() => {
      endMiniGame(false, "The Curse of Five Consumes You!", LORE.tale3Lose)
    }, 1400)
  }
}

function drawAnansiBackground() {
  if (!mgCtx || !mgCanvas) return
  const w = mgCanvas.width
  const h = mgCanvas.height

  mgCtx.fillStyle = "#1e0b2b"
  mgCtx.fillRect(0, 0, w, h)

  mgCtx.strokeStyle = "rgba(245, 158, 11, 0.25)"
  mgCtx.lineWidth = 1.5
  const cx = w * 0.5
  const cy = h * 0.45

  for (let r = 30; r < Math.max(w, h); r += 45) {
    mgCtx.beginPath()
    for (let a = 0; a <= 12; a++) {
      const angle = (a / 12) * Math.PI * 2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (a === 0) mgCtx.moveTo(x, y)
      else mgCtx.lineTo(x, y)
    }
    mgCtx.stroke()
  }

  for (let a = 0; a < 12; a++) {
    const angle = (a / 12) * Math.PI * 2
    mgCtx.beginPath()
    mgCtx.moveTo(cx, cy)
    mgCtx.lineTo(cx + Math.cos(angle) * w, cy + Math.sin(angle) * w)
    mgCtx.stroke()
  }

  mgCtx.fillStyle = "#f59e0b"
  mgCtx.beginPath()
  mgCtx.arc(cx, cy, 28, 0, Math.PI * 2)
  mgCtx.fill()

  mgCtx.strokeStyle = "#ea580c"
  mgCtx.lineWidth = 4
  for (let leg = 0; leg < 8; leg++) {
    const angle = (leg / 8) * Math.PI * 2 + Math.sin(logicGame.animTime * 4) * 0.1
    mgCtx.beginPath()
    mgCtx.moveTo(cx + Math.cos(angle) * 24, cy + Math.sin(angle) * 24)
    mgCtx.lineTo(cx + Math.cos(angle) * 55, cy + Math.sin(angle) * 55)
    mgCtx.stroke()
  }

  const kw = 14
  for (let x = 0; x < w; x += 30) {
    mgCtx.fillStyle = x % 60 === 0 ? "#f59e0b" : "#c2410c"
    mgCtx.fillRect(x, 0, 30, kw)
    mgCtx.fillRect(x, h - kw, 30, kw)
  }
}

// ==========================================
// 5. MINI-GAME LIFECYCLE & ROUTING
// ==========================================

function resizeMiniCanvas() {
  if (!mgCanvas) return
  mgCanvas.width = window.innerWidth
  mgCanvas.height = window.innerHeight
}
window.addEventListener("resize", resizeMiniCanvas)
resizeMiniCanvas()

function launchTale(taleId) {
  currentActiveTale = taleId
  previousState = GameState.HUB

  if (mgLayer) mgLayer.classList.remove("hidden")
  if (mgTouchLeft) mgTouchLeft.classList.add("hidden")
  if (mgTouchRight) mgTouchRight.classList.add("hidden")
  if (anansiCard) anansiCard.classList.add("hidden")
  if (mgChoices) mgChoices.classList.add("hidden")

  if (taleId === 1) {
    currentState = GameState.RUNNER
    if (mgTouchRight) {
      mgTouchRight.classList.remove("hidden")
      const bA = document.getElementById("touch-btn-a")
      const bB = document.getElementById("touch-btn-b")
      const bC = document.getElementById("touch-btn-c")
      if (bA) bA.textContent = "JUMP"
      if (bB) bB.textContent = "SNARE"
      if (bC) bC.textContent = "SPEAR"
    }
    initRunnerGame()
  } else if (taleId === 2) {
    currentState = GameState.ARENA
    if (mgTouchLeft) mgTouchLeft.classList.remove("hidden")
    if (mgTouchRight) {
      mgTouchRight.classList.remove("hidden")
      const bA = document.getElementById("touch-btn-a")
      const bB = document.getElementById("touch-btn-b")
      const bC = document.getElementById("touch-btn-c")
      if (bA) bA.textContent = "DASH"
      if (bB) bB.textContent = "NET"
      if (bC) bC.textContent = "FIRE"
    }
    initArenaGame()
  } else if (taleId === 3) {
    currentState = GameState.LOGIC
    initLogicGame()
  }
}

function endMiniGame(won, title, loreLines) {
  if (mgLayer) mgLayer.classList.add("hidden")
  if (mgChoices) mgChoices.classList.add("hidden")
  if (anansiCard) anansiCard.classList.add("hidden")

  const goScreen = document.getElementById("gameover-screen")
  const goTitle = document.getElementById("gameover-title")
  const goTag = document.getElementById("gameover-tag")
  const goNarrative = document.getElementById("gameover-narrative")
  const goScore = document.getElementById("gameover-score")

  if (goScreen) goScreen.classList.remove("hidden")
  if (goTitle) goTitle.textContent = title
  if (goTag) goTag.textContent = won ? "🌟 ANCESTRAL VICTORY" : "💀 TALE DEFEAT"
  if (goNarrative) goNarrative.textContent = loreLines ? loreLines[0] : ""
  if (goScore) goScore.textContent = `Total Folklore Glory: ${totalScore}`

  currentState = GameState.GAMEOVER
}

function returnToHearth() {
  const goScreen = document.getElementById("gameover-screen")
  const pScreen = document.getElementById("pause-screen")
  if (goScreen) goScreen.classList.add("hidden")
  if (pScreen) pScreen.classList.add("hidden")
  if (mgLayer) mgLayer.classList.add("hidden")

  currentState = GameState.HUB

  if (playerProgress.tokens[1] && playerProgress.tokens[2] && playerProgress.tokens[3]) {
    showDialogue(LORE.masterEpilogue)
  }
}

// ==========================================
// 6. INPUT & UI INTERACTION WIRING
// ==========================================

const touchBtnA = document.getElementById("touch-btn-a")
const touchBtnB = document.getElementById("touch-btn-b")
const touchBtnC = document.getElementById("touch-btn-c")

if (touchBtnA) {
  touchBtnA.addEventListener("click", () => {
    if (currentState === GameState.RUNNER) runnerActionJump()
    else if (currentState === GameState.ARENA) arenaActionDash()
  })
}
if (touchBtnB) {
  touchBtnB.addEventListener("click", () => {
    if (currentState === GameState.RUNNER) runnerActionSnare()
    else if (currentState === GameState.ARENA) arenaActionFireNet()
  })
}
if (touchBtnC) {
  touchBtnC.addEventListener("click", () => {
    if (currentState === GameState.RUNNER) runnerActionSpear()
    else if (currentState === GameState.ARENA) arenaActionFireNet()
  })
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
    if (currentState === GameState.RUNNER) runnerActionJump()
    else if (currentState === GameState.ARENA) arenaActionDash()
    else if (currentState === GameState.DIALOGUE) advanceDialogue()
  } else if (e.code === "KeyS" || e.code === "ArrowDown") {
    if (currentState === GameState.RUNNER) runnerActionSnare()
  } else if (e.code === "KeyA" || e.code === "ArrowLeft") {
    if (currentState === GameState.RUNNER) runnerActionSpear()
  } else if (e.code === "KeyF" || e.code === "Enter") {
    if (currentState === GameState.ARENA) arenaActionFireNet()
  } else if (e.code === "Escape" || e.code === "KeyP") {
    if (currentState === GameState.RUNNER || currentState === GameState.ARENA || currentState === GameState.LOGIC) {
      pauseGame()
    } else if (currentState === GameState.PAUSED) {
      resumeGame()
    }
  }
})

const rBtn1 = document.getElementById("relic-btn-1")
const rBtn2 = document.getElementById("relic-btn-2")
const rBtn3 = document.getElementById("relic-btn-3")

if (rBtn1) {
  rBtn1.addEventListener("click", () => {
    playSound("click")
    showDialogue(LORE.tale1Intro, null, 1)
  })
}
if (rBtn2) {
  rBtn2.addEventListener("click", () => {
    playSound("click")
    showDialogue(LORE.tale2Intro, null, 2)
  })
}
if (rBtn3) {
  rBtn3.addEventListener("click", () => {
    playSound("click")
    showDialogue(LORE.tale3Intro, null, 3)
  })
}

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener("pointerdown", (e) => {
  if (currentState !== GameState.HUB) return
  if (e.target.closest("button") || e.target.closest("#dialogue-box")) return

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, game.camera)
  const intersects = raycaster.intersectObjects(relics, true)

  if (intersects.length > 0) {
    let topGroup = intersects[0].object
    while (topGroup.parent && !topGroup.userData.taleId) {
      topGroup = topGroup.parent
    }
    const tId = topGroup.userData.taleId
    if (tId === 1) showDialogue(LORE.tale1Intro, null, 1)
    else if (tId === 2) showDialogue(LORE.tale2Intro, null, 2)
    else if (tId === 3) showDialogue(LORE.tale3Intro, null, 3)
    playSound("click")
  }
})

const btnStart = document.getElementById("btn-start")
if (btnStart) btnStart.addEventListener("click", startGame)

const btnPause = document.getElementById("btn-pause")
const mgBtnPause = document.getElementById("mg-btn-pause")
const btnResume = document.getElementById("btn-resume")
const btnRestart = document.getElementById("btn-restart")
const btnReturnHearth = document.getElementById("btn-return-hearth")
const btnHearthReturn = document.getElementById("btn-hearth-return")
const btnRetryTale = document.getElementById("btn-retry-tale")

if (btnPause) btnPause.addEventListener("click", pauseGame)
if (mgBtnPause) mgBtnPause.addEventListener("click", pauseGame)
if (btnResume) btnResume.addEventListener("click", resumeGame)
if (btnRestart) {
  btnRestart.addEventListener("click", () => {
    resumeGame()
    if (currentActiveTale) launchTale(currentActiveTale)
  })
}
if (btnReturnHearth) btnReturnHearth.addEventListener("click", returnToHearth)
if (btnHearthReturn) btnHearthReturn.addEventListener("click", returnToHearth)
if (btnRetryTale) {
  btnRetryTale.addEventListener("click", () => {
    const goScreen = document.getElementById("gameover-screen")
    if (goScreen) goScreen.classList.add("hidden")
    launchTale(currentActiveTale)
  })
}

function startGame() {
  const startScreen = document.getElementById("start-screen")
  const relicHud = document.getElementById("relic-hud")
  const progTokens = document.getElementById("progress-tokens")

  if (startScreen) startScreen.classList.add("hidden")
  if (relicHud) relicHud.classList.remove("hidden")
  if (progTokens) progTokens.classList.remove("hidden")

  updateHUDTokens()
  currentState = GameState.HUB
  showDialogue(LORE.greeting)
}

function pauseGame() {
  if (currentState === GameState.PAUSED) return
  previousState = currentState
  currentState = GameState.PAUSED
  const pScreen = document.getElementById("pause-screen")
  if (pScreen) pScreen.classList.remove("hidden")
}

function resumeGame() {
  if (currentState !== GameState.PAUSED) return
  currentState = previousState || GameState.HUB
  const pScreen = document.getElementById("pause-screen")
  if (pScreen) pScreen.classList.add("hidden")
}

function restartGame() {
  const pScreen = document.getElementById("pause-screen")
  const goScreen = document.getElementById("gameover-screen")
  if (pScreen) pScreen.classList.add("hidden")
  if (goScreen) goScreen.classList.add("hidden")
  launchTale(currentActiveTale)
}

function triggerGameOver() {
  endMiniGame(false, "The Tale Concludes", ["The night deepens as the storyteller watches the embers."])
}

// ==========================================
// 7. MAIN ENGINE UPDATE LOOP
// ==========================================

let globalTime = 0

game.onUpdate((dt) => {
  globalTime += dt

  const fireFlicker = 3.8 + Math.sin(globalTime * 12) * 0.4 + Math.sin(globalTime * 27) * 0.25
  fireLight.intensity = fireFlicker

  flameCores.forEach((f, idx) => {
    f.scale.y = 0.8 + Math.sin(globalTime * 10 + idx) * 0.3
    f.rotation.y += 1.5 * dt
  })

  relics.forEach((r, idx) => {
    r.position.y = 0.95 + Math.sin(globalTime * 2.5 + idx * 1.8) * 0.08
    r.rotation.y += 0.8 * dt
  })

  elder.position.y = 0.45 + Math.sin(globalTime * 1.8) * 0.03
  crystal.rotation.y += 1.2 * dt

  // Rising campfire embers
  embers.stream(emberOrigin, dt, {
    rate: 22,
    color: "#ff8c2a",
    speed: 1.8,
    spread: 0.8,
    lifetime: 2.5,
    direction: emberDirection,
    gravityScale: -0.08,
    drag: 0.7,
  })

  // Screen shake + camera hold
  game.camera.position.set(0, 5.2, 9.5)
  if (shakeAmount > 0.001) {
    const t = globalTime * 30
    game.camera.position.x += Math.sin(t * 1.7) * shakeAmount
    game.camera.position.y += Math.sin(t * 2.3 + 1.7) * shakeAmount
    game.camera.position.z += Math.sin(t * 1.1 + 3.4) * shakeAmount * 0.5
    shakeAmount *= Math.exp(-5 * dt)
  } else {
    shakeAmount = 0
  }
  game.camera.lookAt(0, 1.2, 0)

  if (currentState === GameState.RUNNER) {
    updateRunner(dt)
    drawRunner()
  } else if (currentState === GameState.ARENA) {
    updateArena(dt)
    drawArena()
  } else if (currentState === GameState.LOGIC) {
    logicGame.animTime += dt
    drawAnansiBackground()
  }
})

// ==========================================
// 8. SIGNAL QA READINESS & AUTOMATION BUS
// ==========================================

if (typeof window !== "undefined") {
  window.__GAME_READY__ = true
  window.__GAME__ = game
  window.__GAME_BUS__ = {
    emit(event) {
      const name = String(event || "").toLowerCase()
      if (name === "start" || name === "start-game") {
        startGame()
      } else if (name === "pause") {
        pauseGame()
      } else if (name === "resume") {
        resumeGame()
      } else if (name === "restart" || name === "restart-game") {
        restartGame()
      } else if (name === "game-over" || name === "gameover") {
        triggerGameOver()
      }
    },
    on() {},
    off() {},
  }
  window.__PHASER_EVENT_BUS__ = window.__GAME_BUS__
}