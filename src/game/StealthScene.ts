import Phaser from 'phaser';
import { audio } from '../audio';
import { bus } from '../events';
import { input } from '../input';
import { getLevel } from '../data/levels';
import { getBoss } from '../data/bosses';
import { speedScale, staminaMax, stealthScale } from '../state';
import type { BossDef, BossSpawn, LevelConfig, SaveData } from '../types';

interface SceneData {
  levelIndex: number;
  save: SaveData;
  forcedDebate?: boolean;
  startPaused?: boolean;
}

interface HideSpotRuntime {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  prompt: string;
  marker: Phaser.GameObjects.Text;
}

interface FaceRuntime {
  x: number;
  y: number;
  value: number;
  sprite: Phaser.GameObjects.Image;
  picked: boolean;
}

interface BossRuntime {
  spawn: BossSpawn;
  def: BossDef;
  state: 'patrol' | 'investigate' | 'chase' | 'search';
  facing: number;
  alert: number;
  patrolIndex: number;
  target: { x: number; y: number } | null;
  wait: number;
  waitBaseFacing: number;
  lastSeen: { x: number; y: number };
  searchTimer: number;
  confrontTimer: number;
  lastPos: { x: number; y: number };
  stuckTimer: number;
  mark: Phaser.GameObjects.Text;
  nameplate: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  bubbleTimer: number;
  bubbleCooldown: number;
}

export class StealthScene extends Phaser.Scene {
  private level!: LevelConfig;
  private save!: SaveData;
  private forcedDebate = false;
  private startPaused = false;
  private gameplayActive = false;
  private pausedByUi = false;
  private levelDone = false;
  private debateTriggered = false;
  private hidden = false;
  private hiddenSpot: HideSpotRuntime | null = null;
  private hasObjective = false;
  private objectiveSpot = { x: 0, y: 0 };
  private noteRead = false;
  private colorKeys: Array<{
    def: { id: string; x: number; y: number; color: string; correct?: boolean };
    sprite: Phaser.GameObjects.Image;
    glow: Phaser.GameObjects.Image;
  }> = [];
  private noteGlow: Phaser.GameObjects.Image | null = null;
  private stallKeySpot = { x: 0, y: 0 };
  private teleportTimer = 0;
  private collectedFace = 0;
  private stamina = 100;
  private maxStamina = 100;
  private staminaBarBg!: Phaser.GameObjects.Rectangle;
  private staminaBarFill!: Phaser.GameObjects.Rectangle;
  private staminaBarLabel!: Phaser.GameObjects.Text;
  private dodgeCooldown = 0;
  private dodgeTimer = 0;
  private dodgeDir = new Phaser.Math.Vector2(1, 0);
  private facing = new Phaser.Math.Vector2(1, 0);
  private stepTimer = 0;
  private pantTimer = 0;
  private lastHudAt = 0;
  private lastPrompt: string | null | undefined;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private blockers: Phaser.Geom.Rectangle[] = [];
  private player!: Phaser.Physics.Arcade.Sprite;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private bossRuntime!: BossRuntime;
  private hideSpots: HideSpotRuntime[] = [];
  private facePickups: FaceRuntime[] = [];
  private objectiveSprite!: Phaser.GameObjects.Image;
  private objectiveGlow!: Phaser.GameObjects.Image;
  private kannoBubble!: Phaser.GameObjects.Text;
  private kannoBubbleTimer = 0;
  private kannoBubbleCooldown = 3;
  private kannoIdleTime = 0;
  private exitSprite!: Phaser.GameObjects.Image;
  private exitGlow!: Phaser.GameObjects.Image;
  private visionGraphics!: Phaser.GameObjects.Graphics;
  private noiseGraphics!: Phaser.GameObjects.Graphics;
  private throwCooldown = 0;
  private lastVisibleAt = 0;
  private sceneEnded = false;

  constructor() {
    super('StealthScene');
  }

  init(data: SceneData): void {
    this.level = getLevel(data.levelIndex);
    this.save = data.save;
    this.forcedDebate = Boolean(data.forcedDebate);
    this.startPaused = Boolean(data.startPaused);
    this.gameplayActive = false;
    this.pausedByUi = false;
    this.levelDone = false;
    this.debateTriggered = false;
    this.hidden = false;
    this.hiddenSpot = null;
    this.hasObjective = false;
    this.noteRead = false;
    this.colorKeys = [];
    this.noteGlow = null;
    this.stallKeySpot = { x: 0, y: 0 };
    this.teleportTimer = 0;
    const objectiveSpots = this.level.objectiveSpots ?? [];
    this.objectiveSpot =
      objectiveSpots.length > 0
        ? objectiveSpots[Math.floor(Math.random() * objectiveSpots.length)]
        : { x: this.level.objective.x, y: this.level.objective.y };
    const keySetup = this.level.keySetup;
    if (keySetup?.mode === 'color') {
      const correct = keySetup.colorKeys?.find((key) => key.correct) ?? keySetup.colorKeys?.[0];
      if (correct) this.objectiveSpot = { x: correct.x, y: correct.y };
    } else if (keySetup?.mode === 'stall' && keySetup.stallSpots?.length) {
      const spot = keySetup.stallSpots[Math.floor(Math.random() * keySetup.stallSpots.length)];
      this.objectiveSpot = { x: spot.x, y: spot.y };
      this.stallKeySpot = { x: spot.x, y: spot.y };
    } else if (keySetup?.mode === 'teleport' && keySetup.teleportSpots?.length) {
      const spot = keySetup.teleportSpots[Math.floor(Math.random() * keySetup.teleportSpots.length)];
      this.objectiveSpot = { x: spot.x, y: spot.y };
    }
    this.collectedFace = 0;
    this.kannoBubbleTimer = 0;
    this.kannoBubbleCooldown = 3;
    this.kannoIdleTime = 0;
    this.stamina = staminaMax(this.save.stats);
    this.maxStamina = this.stamina;
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.stepTimer = 0;
    this.pantTimer = 0;
    this.lastHudAt = 0;
    this.lastPrompt = undefined;
    this.throwCooldown = 0;
    this.lastVisibleAt = 0;
    this.sceneEnded = false;
    this.blockers = [];
    this.propSolids = [];
    this.hideSpots = [];
    this.facePickups = [];
    input.clearActions();
    input.crouch = false;
    input.enabled = false;
  }

  create(): void {
    const room = this.level.room;
    this.physics.world.setBounds(room.left, room.top, room.right - room.left, room.bottom - room.top);
    this.cameras.main.setBackgroundColor('#0a0b0d');
    this.cameras.main.setZoom(this.level.zoom);
    this.cameras.main.centerOn(640, 360);
    this.drawRoom();
    this.buildProps();
    this.buildHideSpots();
    this.buildObjectiveAndExit();
    this.buildFacePickups();
    this.buildPlayer();
    this.buildStaminaBar();
    this.buildBoss();
    this.buildSolidsForWalls();
    this.propSolids.forEach((zone) => this.solids.add(zone));
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.boss, this.solids);
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.hidden && this.gameplayActive) this.beginDebate('touch');
    });
    this.visionGraphics = this.add.graphics().setDepth(8);
    this.noiseGraphics = this.add.graphics().setDepth(60);
    this.add
      .image(640, 360, 'prop_vignette')
      .setDisplaySize(1280, 720)
      .setDepth(50)
      .setAlpha(0.92)
      .setScrollFactor(0);
    this.add
      .text(640, 18, this.level.kicker, {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '9px',
        color: '#d8c9b1',
      })
      .setOrigin(0.5)
      .setAlpha(0.35)
      .setDepth(51);

    audio.startMusic('stealth');
    this.setPrompt(null);
    this.emitHud(true);

    if (this.forcedDebate) {
      this.gameplayActive = false;
      this.player.setVelocity(0);
      this.boss.setVelocity(0);
      this.physics.pause();
      this.time.delayedCall(220, () => bus.emit('scene:forced-ready', { levelIndex: this.level.index }));
    } else if (this.startPaused) {
      this.gameplayActive = false;
      this.pausedByUi = true;
      this.player.setVelocity(0);
      this.boss.setVelocity(0);
      this.physics.pause();
      this.time.delayedCall(160, () => bus.emit('scene:intro-ready', { levelIndex: this.level.index }));
    } else {
      this.gameplayActive = true;
      input.setEnabled(true);
    }

    this.sceneEnded = false;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audio.stopMusic();
      input.setEnabled(false);
    });
  }

  update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    if (!this.gameplayActive || this.pausedByUi || this.sceneEnded) return;
    input.update();
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.throwCooldown = Math.max(0, this.throwCooldown - dt);
    this.updatePlayer(dt);
    this.updateStaminaBar();
    this.updateBoss(dt, time);
    this.updateKannoBubble(dt);
    this.updatePickups();
    this.updateKeyTeleport(dt);
    this.updateInteraction();
    this.updateMarkers();
    this.updateVision();
    if (time - this.lastHudAt > 100) {
      this.emitHud(false);
      this.lastHudAt = time;
    }
  }

  private drawRoom(): void {
    const room = this.level.room;
    const roomW = room.right - room.left;
    const roomH = room.bottom - room.top;
    const centerX = room.left + roomW / 2;
    const centerY = room.top + roomH / 2;

    // The room is a compact inset; outside it is dark school corridor.
    this.add.rectangle(640, 360, 1280, 720, 0x090a0c, 1).setDepth(-2);
    this.add.tileSprite(centerX, centerY, roomW, roomH, 'prop_floor').setDepth(0);
    this.add.rectangle(centerX, centerY, roomW, roomH, 0x0b1623, 0.12).setDepth(2);

    // A soft falloff at the room edge makes the smaller space feel tighter.
    const edge = this.add.graphics().setDepth(3.1);
    edge.lineStyle(30, 0x08090a, 0.42).strokeRect(room.left, room.top, roomW, roomH);
    edge.lineStyle(2, 0xd8c9b1, 0.12).strokeRect(room.left + 16, room.top + 16, roomW - 32, roomH - 32);

    this.level.lightPools.forEach((pool) => {
      this.add
        .image(pool.x, pool.y, 'prop_lightpool')
        .setScale(pool.scale ?? 1)
        .setAlpha(0.5)
        .setDepth(3)
        .setBlendMode(Phaser.BlendModes.ADD);
    });
    this.level.wetZones?.forEach((zone) => {
      this.add.ellipse(zone.x, zone.y, zone.w, zone.h, 0x6fa9c9, 0.14).setDepth(3.2);
      this.add
        .ellipse(zone.x + zone.w * 0.18, zone.y - zone.h * 0.18, zone.w * 0.3, zone.h * 0.3, 0xa4d0df, 0.16)
        .setDepth(3.3);
      this.add
        .ellipse(zone.x - zone.w * 0.2, zone.y + zone.h * 0.12, zone.w * 0.2, zone.h * 0.18, 0xa4d0df, 0.12)
        .setDepth(3.3);
    });

    const wall = (x: number, y: number, w: number, h: number) => {
      this.add.tileSprite(x, y, w, h, 'prop_wall').setDepth(9);
    };
    wall(centerX, room.top - 12, roomW + 48, 28);
    wall(centerX, room.bottom + 12, roomW + 48, 28);
    wall(room.left - 12, centerY, 28, roomH + 48);
    wall(room.right + 12, centerY, 28, roomH + 48);

    // Rays that leave the room hit the walls.
    this.blockers.push(
      new Phaser.Geom.Rectangle(0, 0, 1280, room.top),
      new Phaser.Geom.Rectangle(0, room.bottom, 1280, 720 - room.bottom),
      new Phaser.Geom.Rectangle(0, room.top, room.left, roomH),
      new Phaser.Geom.Rectangle(room.right, room.top, 1280 - room.right, roomH),
    );
  }

  private buildSolidsForWalls(): void {
    this.solids = this.physics.add.staticGroup();
    const room = this.level.room;
    const addZone = (x: number, y: number, w: number, h: number) => {
      const zone = this.add.zone(x, y, w, h);
      this.physics.add.existing(zone, true);
      this.solids.add(zone);
    };
    const thickness = 36;
    addZone(640, room.top - thickness / 2, 1280, thickness);
    addZone(640, room.bottom + thickness / 2, 1280, thickness);
    addZone(room.left - thickness / 2, 360, thickness, 720);
    addZone(room.right + thickness / 2, 360, thickness, 720);
  }

  private buildProps(): void {
    this.level.props.forEach((prop) => {
      const image = this.add
        .image(prop.x, prop.y, prop.key)
        .setDisplaySize(prop.w ?? 64, prop.h ?? 64)
        .setDepth(prop.y + (prop.h ?? 64) / 2)
        .setAlpha(prop.alpha ?? 1);
      if (prop.solid) {
        const zone = this.add.zone(prop.x, prop.y, (prop.w ?? 64) * 0.86, (prop.h ?? 64) * 0.72);
        this.physics.add.existing(zone, true);
        // solids is created late; use an array of zones and add after group creation
        (zone as Phaser.GameObjects.Zone & { __solid?: boolean }).__solid = true;
        this.propSolids.push(zone);
      }
      if (prop.blocksVision) {
        this.blockers.push(
          new Phaser.Geom.Rectangle(
            prop.x - (prop.w ?? 64) / 2,
            prop.y - (prop.h ?? 64) / 2,
            prop.w ?? 64,
            prop.h ?? 64,
          ),
        );
      }
      image.setName(`prop:${prop.key}`);
    });
  }

  private propSolids: Phaser.GameObjects.Zone[] = [];

  private buildHideSpots(): void {
    this.level.hideSpots.forEach((spot) => {
      const marker = this.add
        .text(spot.x, spot.y - 4, '藏', {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: '11px',
          color: '#211d1a',
          fontStyle: 'bold',
          backgroundColor: '#f0c04e',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(2000)
        .setAlpha(0.7);
      this.hideSpots.push({ ...spot, marker });
    });
  }

  private buildObjectiveAndExit(): void {
    const obj = this.level.objective;
    const spot = this.objectiveSpot;
    const setup = this.level.keySetup;
    if (setup?.mode === 'color') {
      this.buildColorKeys();
    } else if (setup?.mode === 'stall') {
      // The toilet key has no world icon; the stall itself is the clue.
      this.objectiveSprite = this.add
        .image(spot.x, spot.y, obj.texture)
        .setDisplaySize(38, 38)
        .setDepth(510)
        .setAlpha(0);
      this.objectiveGlow = this.add
        .image(spot.x, spot.y, 'prop_lightpool')
        .setScale(0.3)
        .setTint(0xf0c04e)
        .setAlpha(0)
        .setDepth(500);
    } else {
      this.objectiveGlow = this.add
        .image(spot.x, spot.y, 'prop_lightpool')
        .setScale(0.42)
        .setTint(0xf0c04e)
        .setAlpha(0.7)
        .setDepth(500)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: this.objectiveGlow,
        alpha: 0.25,
        scale: 0.52,
        duration: 1100,
        yoyo: true,
        repeat: -1,
      });
      this.objectiveSprite = this.add
        .image(spot.x, spot.y, obj.texture)
        .setDisplaySize(42, 42)
        .setDepth(510);
      this.tweens.add({
        targets: this.objectiveSprite,
        y: spot.y - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    const exit = this.level.exit;
    this.exitSprite = this.add
      .image(exit.x, exit.y, exit.texture)
      .setDisplaySize(exit.w, exit.h)
      .setDepth(exit.y + 40)
      .setTint(0x777777);
    this.exitGlow = this.add
      .image(exit.x, exit.y, 'prop_lightpool')
      .setScale(0.4)
      .setTint(0xf0c04e)
      .setAlpha(0)
      .setDepth(3)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  private buildColorKeys(): void {
    const setup = this.level.keySetup;
    if (!setup?.colorKeys?.length) return;
    if (setup.note) {
      this.noteGlow = this.add
        .image(setup.note.x, setup.note.y, 'prop_lightpool')
        .setScale(0.26)
        .setTint(0xf0c04e)
        .setAlpha(0.24)
        .setDepth(500)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: this.noteGlow,
        alpha: 0.08,
        scale: 0.34,
        duration: 1800,
        yoyo: true,
        repeat: -1,
      });
    }
    const colors: Record<string, number> = {
      red: 0xc84938,
      white: 0xf4ead8,
      yellow: 0xf0c04e,
    };
    setup.colorKeys.forEach((key) => {
      const tint = colors[key.color] ?? 0xf0c04e;
      const glow = this.add
        .image(key.x, key.y, 'prop_lightpool')
        .setScale(0.28)
        .setTint(tint)
        .setAlpha(0.35)
        .setDepth(500)
        .setBlendMode(Phaser.BlendModes.ADD);
      const texture =
        key.color === 'red' ? 'prop_key_red' : key.color === 'white' ? 'prop_key_white' : 'prop_key_yellow';
      const sprite = this.add
        .image(key.x, key.y, texture)
        .setDisplaySize(40, 40)
        .setDepth(510);
      this.tweens.add({
        targets: [sprite, glow],
        y: key.y - 5,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      this.colorKeys.push({ def: key, sprite, glow });
      if (key.correct) {
        this.objectiveSprite = sprite;
        this.objectiveGlow = glow;
        this.objectiveSpot = { x: key.x, y: key.y };
      }
    });
    if (!this.objectiveSprite) {
      const first = this.colorKeys[0];
      this.objectiveSprite = first.sprite;
      this.objectiveGlow = first.glow;
      this.objectiveSpot = { x: first.def.x, y: first.def.y };
    }
  }

  private buildFacePickups(): void {
    this.level.facePickups.forEach((pickup) => {
      const sprite = this.add
        .image(pickup.x, pickup.y, 'prop_face_token')
        .setDisplaySize(30, 30)
        .setDepth(pickup.y + 30);
      this.tweens.add({
        targets: sprite,
        y: pickup.y - 5,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      this.facePickups.push({ ...pickup, sprite, picked: false });
    });
  }

  private buildPlayer(): void {
    this.player = this.physics.add
      .sprite(this.level.playerStart.x, this.level.playerStart.y, 'kanno')
      .setScale(0.72)
      .setDepth(this.level.playerStart.y + 30);
    this.player.setCollideWorldBounds(true);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(26, 18);
    playerBody.setOffset((this.player.width - 26) / 2, this.player.height - 29);
    this.player.setDrag(0, 0);
    this.kannoBubble = this.add
      .text(this.player.x, this.player.y - 70, '', {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '10px',
        color: '#211d1a',
        backgroundColor: '#f4ead8ee',
        padding: { x: 7, y: 4 },
        wordWrap: { width: 190, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(this.player.y + 100)
      .setAlpha(0);
  }

  private buildStaminaBar(): void {
    this.staminaBarBg = this.add
      .rectangle(0, 0, 74, 15, 0x0d0b09, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xf4ead8, 0.95)
      .setDepth(2400);
    this.staminaBarFill = this.add
      .rectangle(0, 0, 66, 8, 0x74c07a)
      .setOrigin(0, 0.5)
      .setDepth(2401);
    this.staminaBarLabel = this.add
      .text(0, 0, '体力', {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '10px',
        color: '#f4ead8',
      })
      .setOrigin(1, 0.5)
      .setDepth(2401);
  }

  private updateStaminaBar(): void {
    const ratio = Phaser.Math.Clamp(this.stamina / this.maxStamina, 0, 1);
    const x = this.player.x;
    const y = this.player.y - 54;
    this.staminaBarBg.setPosition(x, y);
    this.staminaBarFill.setPosition(x - 33, y);
    this.staminaBarFill.setDisplaySize(Math.max(4, 66 * ratio), 8);
    const color = ratio > 0.5 ? 0x74c07a : ratio > 0.25 ? 0xf0c04e : 0xc84938;
    this.staminaBarFill.setFillStyle(color, 1);
    this.staminaBarLabel.setPosition(x - 42, y);
    const visible = this.gameplayActive && !this.sceneEnded;
    this.staminaBarBg.setVisible(visible);
    this.staminaBarFill.setVisible(visible);
    this.staminaBarLabel.setVisible(visible);
  }

  private buildBoss(): void {
    const spawn = this.level.boss;
    const def = getBoss(this.level.bossId);
    this.boss = this.physics.add
      .sprite(spawn.x, spawn.y, def.sprite)
      .setScale(1.02)
      .setDepth(spawn.y + 30);
    this.boss.setImmovable(true);
    this.boss.setCollideWorldBounds(true);
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    bossBody.setSize(28, 18);
    bossBody.setOffset((this.boss.width - 28) / 2, this.boss.height - 29);
    const mark = this.add
      .text(spawn.x, spawn.y - 64, '', {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#c84938',
        fontStyle: 'bold',
        backgroundColor: '#f4ead8',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(120)
      .setAlpha(0);
    const nameplate = this.add
      .text(spawn.x, spawn.y + 50, def.shortTitle, {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '10px',
        color: '#f4ead8',
        backgroundColor: '#211d1acc',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(119)
      .setAlpha(0.75);
    const bubble = this.add
      .text(spawn.x, spawn.y - 78, '', {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '11px',
        color: '#211d1a',
        backgroundColor: '#f4ead8f2',
        padding: { x: 8, y: 5 },
        wordWrap: { width: 228, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(121)
      .setAlpha(0);
    this.bossRuntime = {
      spawn,
      def,
      state: 'patrol',
      facing: -Math.PI / 2,
      alert: 0,
      patrolIndex: 0,
      target: this.pickBossTarget(spawn.x, spawn.y),
      wait: 250,
      waitBaseFacing: -Math.PI / 2,
      lastSeen: { x: spawn.x, y: spawn.y },
      searchTimer: 0,
      confrontTimer: 0,
      lastPos: { x: spawn.x, y: spawn.y },
      stuckTimer: 0,
      mark,
      nameplate,
      bubble,
      bubbleTimer: 0,
      bubbleCooldown: 3.2,
    };
  }

  private updatePlayer(dt: number): void {
    if (this.hidden) {
      this.player.setVelocity(0);
      return;
    }
    const move = new Phaser.Math.Vector2(input.moveX, input.moveY);
    if (move.lengthSq() > 0) {
      move.normalize();
      this.facing.copy(move);
      this.player.setFlipX(move.x < -0.01);
    }
    const wet = this.isWet(this.player.x, this.player.y);
    const canSprint = input.sprint && !input.crouch && this.stamina > 0;
    const moving = move.lengthSq() > 0;
    const speedMul = this.level.speedMultiplier ?? 1;
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
      this.player.setVelocity(this.dodgeDir.x * 540 * speedMul, this.dodgeDir.y * 540 * speedMul);
    } else {
      let speed = (input.crouch ? 76 : 140) * speedScale(this.save.stats) * speedMul;
      if (canSprint) speed = 224 * speedScale(this.save.stats) * speedMul;
      this.player.setVelocity(move.x * speed, move.y * speed);
    }
    this.player.setDepth(this.player.y + 30);

    if (this.dodgeCooldown <= 0 && input.consume('dodge') && this.stamina >= 20) {
      this.dodgeCooldown = 1.05;
      this.dodgeTimer = 0.16;
      this.dodgeDir.copy(move.lengthSq() > 0 ? move : this.facing);
      this.stamina = Math.max(0, this.stamina - 20);
      this.emitNoise(this.player.x, this.player.y, 0.9, 'dodge');
      audio.step(false);
    }

    if (canSprint && moving) {
      this.stamina = Math.max(0, this.stamina - 27 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 17 * dt);
    }

    this.stepTimer -= dt;
    if (moving && !input.crouch && this.stepTimer <= 0) {
      this.stepTimer = canSprint ? 0.25 : 0.42;
      audio.step(false);
      if (canSprint) this.emitNoise(this.player.x, this.player.y, wet ? 1.35 : 0.9, 'step');
    }
    if (this.stamina <= 0 && moving) {
      this.pantTimer -= dt;
      if (this.pantTimer <= 0) {
        this.pantTimer = 1.15;
        this.emitNoise(this.player.x, this.player.y, 0.55, 'pant');
      }
    }

    if (input.consume('throw') && this.throwCooldown <= 0) {
      this.throwChalk(wet);
    }
  }

  private throwChalk(wet: boolean): void {
    this.throwCooldown = 2.8;
    const dir = this.facing.lengthSq() > 0 ? this.facing.clone() : new Phaser.Math.Vector2(1, 0);
    const room = this.level.room;
    const target = {
      x: Phaser.Math.Clamp(this.player.x + dir.x * 190, room.left + 20, room.right - 20),
      y: Phaser.Math.Clamp(this.player.y + dir.y * 190, room.top + 20, room.bottom - 20),
    };
    const chalk = this.add.image(this.player.x, this.player.y - 8, 'prop_chalk').setDisplaySize(18, 11).setDepth(100);
    this.tweens.add({
      targets: chalk,
      x: target.x,
      y: target.y,
      angle: 220,
      duration: 260,
      ease: 'Quad.out',
      onComplete: () => {
        chalk.destroy();
        this.emitNoise(target.x, target.y, wet ? 1.25 : 1.05, 'chalk');
      },
    });
    audio.throw();
  }

  private updateBoss(dt: number, time: number): void {
    const boss = this.bossRuntime;
    const visible = this.bossCanSeePlayer();
    if (visible) {
      this.lastVisibleAt = time;
      const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      const rate = 34 * (1 - Math.min(0.62, dist / this.level.boss.visionRange * 0.62)) * stealthScale(this.save.stats);
      boss.alert = Math.min(100, boss.alert + rate * dt);
      boss.state = 'chase';
      boss.lastSeen = { x: this.player.x, y: this.player.y };
      boss.facing = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      this.boss.setFlipX(Math.cos(boss.facing) < -0.01);
      boss.stuckTimer = 0;
      if (dist > 58) {
        this.moveBoss(this.player.x, this.player.y, this.level.boss.speed * 1.18);
      } else {
        this.boss.setVelocity(0);
        boss.confrontTimer += dt;
        if (boss.confrontTimer > 0.52) this.beginDebate('close');
      }
      if (boss.alert >= 100) this.beginDebate('alert');
      if (boss.alert > 8) audio.alert(boss.alert / 100);
    } else {
      boss.confrontTimer = 0;
      boss.alert = Math.max(0, boss.alert - 17 * dt);
      if (boss.state === 'chase') {
        boss.state = 'search';
        boss.searchTimer = 1.25 + Math.random() * 1.1;
      }
      if (boss.state === 'search') {
        boss.searchTimer -= dt;
        boss.facing += dt * 1.4;
        this.boss.setVelocity(0);
        this.boss.setFlipX(Math.cos(boss.facing) < -0.01);
        if (boss.searchTimer <= 0) {
          boss.state = 'patrol';
          boss.target = this.pickBossTarget(this.boss.x, this.boss.y);
          boss.wait = 180 + Math.random() * 280;
        }
      } else if (boss.state === 'investigate' && boss.target) {
        const reach = this.moveBoss(boss.target.x, boss.target.y, this.level.boss.speed * 1.05);
        if (reach) {
          boss.state = 'search';
          boss.searchTimer = 1.2 + Math.random() * 1.1;
          boss.target = null;
        }
      } else {
        this.updatePatrol(boss, dt, time);
      }

      // If a desk or wall pins the boss, don't let the patrol deadlock.
      if ((boss.state === 'patrol' || boss.state === 'investigate') && boss.wait <= 0) {
        const moved = Phaser.Math.Distance.Between(boss.lastPos.x, boss.lastPos.y, this.boss.x, this.boss.y);
        if (moved < 1.4) boss.stuckTimer += dt;
        else boss.stuckTimer = 0;
        if (boss.stuckTimer > 0.75) {
          boss.target = this.pickBossTarget(this.boss.x, this.boss.y);
          boss.wait = 0;
          boss.stuckTimer = 0;
        }
      } else {
        boss.stuckTimer = 0;
      }
    }
    boss.lastPos = { x: this.boss.x, y: this.boss.y };
    this.boss.setDepth(this.boss.y + 30);
    boss.mark.setPosition(this.boss.x, this.boss.y - 62);
    boss.nameplate.setPosition(this.boss.x, this.boss.y + 52);
    this.updateBossBubble(boss, dt, visible);
    this.bossRuntime.alert = boss.alert;
    this.updateBossMark(visible);
  }

  private updateBossBubble(boss: BossRuntime, dt: number, visible: boolean): void {
    const bubble = boss.bubble;
    bubble.setPosition(this.boss.x, this.boss.y - 78);
    if (visible || boss.state === 'chase' || this.hidden) {
      bubble.setAlpha(0);
      boss.bubbleTimer = 0;
      return;
    }
    if (this.level.keySetup?.mode === 'stall' && !this.hasObjective) {
      bubble.setText('坏了，钥匙好像被我搞到隔间里去了。');
      bubble.setAlpha(1);
      boss.bubbleTimer = 3.6;
      boss.bubbleCooldown = 4.8;
      return;
    }
    if (boss.bubbleTimer > 0) {
      boss.bubbleTimer -= dt;
      if (boss.bubbleTimer <= 0) bubble.setAlpha(0);
      return;
    }
    boss.bubbleCooldown -= dt;
    if (boss.bubbleCooldown > 0) return;
    const lines = boss.def.idleLines ?? [];
    if (!lines.length) return;
    bubble.setText(lines[Math.floor(Math.random() * lines.length)]);
    bubble.setAlpha(1);
    boss.bubbleTimer = 3.1;
    boss.bubbleCooldown = 7.5 + Math.random() * 6;
  }

  private updatePatrol(boss: BossRuntime, dt: number, time: number): void {
    if (!boss.target) {
      boss.target = this.pickBossTarget(this.boss.x, this.boss.y);
      if (!boss.target) {
        this.boss.setVelocity(0);
        return;
      }
    }
    if (boss.wait > 0) {
      boss.wait -= dt * 1000;
      boss.facing = boss.waitBaseFacing + Math.sin(time / 450) * 0.52;
      this.boss.setVelocity(0);
      this.boss.setFlipX(Math.cos(boss.facing) < -0.01);
      return;
    }
    const reached = this.moveBoss(boss.target.x, boss.target.y, this.level.boss.speed);
    if (reached) {
      boss.wait = 220 + Math.random() * 620;
      boss.waitBaseFacing = boss.facing + (Math.random() - 0.5) * Math.PI * 1.6;
      boss.target = this.pickBossTarget(this.boss.x, this.boss.y);
      boss.patrolIndex = 0;
    }
  }

  private pickBossTarget(fromX: number, fromY: number): { x: number; y: number } | null {
    const points = this.level.boss.patrol;
    if (!points.length) return null;
    const room = this.level.room;
    const options = points.filter(
      (point) => Phaser.Math.Distance.Between(fromX, fromY, point.x, point.y) > 76,
    );
    const pool = options.length > 0 ? options : points;
    const point = pool[Math.floor(Math.random() * pool.length)];
    return {
      x: Phaser.Math.Clamp(point.x + (Math.random() - 0.5) * 56, room.left + 46, room.right - 46),
      y: Phaser.Math.Clamp(point.y + (Math.random() - 0.5) * 42, room.top + 46, room.bottom - 46),
    };
  }

  private moveBoss(x: number, y: number, speed: number): boolean {
    const dx = x - this.boss.x;
    const dy = y - this.boss.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) {
      this.boss.setVelocity(0);
      return true;
    }
    this.boss.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    this.bossRuntime.facing = Math.atan2(dy, dx);
    this.boss.setFlipX(dx < 0);
    return false;
  }

  private updateBossMark(visible: boolean): void {
    const mark = this.bossRuntime.mark;
    if (visible) {
      mark.setText('!').setColor('#c84938').setAlpha(1);
    } else if (this.bossRuntime.state === 'search' || this.bossRuntime.state === 'investigate') {
      mark.setText('?').setColor('#8a6a2f').setAlpha(1);
    } else if (this.bossRuntime.alert > 15) {
      mark.setText('?').setColor('#8a6a2f').setAlpha(0.8);
    } else {
      mark.setAlpha(0);
    }
  }

  private bossCanSeePlayer(): boolean {
    if (this.hidden || !this.gameplayActive) return false;
    const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    if (dist < 38) return true;
    if (dist > this.level.boss.visionRange) return false;
    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(angle - this.bossRuntime.facing));
    if (diff > Phaser.Math.DegToRad(this.level.boss.visionAngle / 2)) return false;
    return !this.lineBlocked(this.boss.x, this.boss.y, this.player.x, this.player.y, dist);
  }

  private lineBlocked(x1: number, y1: number, x2: number, y2: number, maxDist: number): boolean {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hit = this.rayDistance(x1, y1, angle, maxDist);
    return hit.dist < maxDist - 1;
  }

  private rayDistance(ox: number, oy: number, angle: number, maxDist: number): { x: number; y: number; dist: number } {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = maxDist;
    for (const rect of this.blockers) {
      const t = this.rayRect(ox, oy, dx, dy, rect, maxDist);
      if (t !== null && t < best) best = t;
    }
    return { x: ox + dx * best, y: oy + dy * best, dist: best };
  }

  private rayRect(
    ox: number,
    oy: number,
    dx: number,
    dy: number,
    rect: Phaser.Geom.Rectangle,
    maxDist: number,
  ): number | null {
    let tmin = 0;
    let tmax = maxDist;
    const axes: Array<[number, number, number, number]> = [
      [ox, dx, rect.left, rect.right],
      [oy, dy, rect.top, rect.bottom],
    ];
    for (const [origin, direction, min, max] of axes) {
      if (Math.abs(direction) < 1e-6) {
        if (origin < min || origin > max) return null;
      } else {
        let t1 = (min - origin) / direction;
        let t2 = (max - origin) / direction;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin > 0.6 ? tmin : null;
  }

  private updateVision(): void {
    const g = this.visionGraphics;
    g.clear();
    if (!this.bossRuntime || !this.boss.active) return;
    const originX = this.boss.x;
    const originY = this.boss.y;
    const half = Phaser.Math.DegToRad(this.level.boss.visionAngle / 2);
    const rays = 26;
    const points: Array<{ x: number; y: number }> = [{ x: originX, y: originY }];
    for (let i = 0; i <= rays; i += 1) {
      const angle = this.bossRuntime.facing - half + (half * 2 * i) / rays;
      const hit = this.rayDistance(originX, originY, angle, this.level.boss.visionRange);
      points.push({ x: hit.x, y: hit.y });
    }
    const visible = this.bossCanSeePlayer();
    const fill = visible ? 0xc84938 : 0xf0c04e;
    g.fillStyle(fill, visible ? 0.2 : 0.11);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => g.lineTo(point.x, point.y));
    g.closePath();
    g.fillPath();
    g.lineStyle(1.5, fill, visible ? 0.44 : 0.24);
    g.strokePath();
    points.slice(1).forEach((point) => {
      if (visible) g.lineStyle(1, fill, 0.18).lineBetween(originX, originY, point.x, point.y);
    });
  }

  private emitNoise(x: number, y: number, strength: number, source: string): void {
    this.drawNoise(x, y, strength);
    const boss = this.bossRuntime;
    if (!boss || boss.state === 'chase') return;
    const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, x, y);
    if (dist > this.level.boss.hearingRange * strength) return;
    boss.alert = Math.min(100, boss.alert + 6 * strength);
    if (boss.state !== 'search') {
      boss.state = 'investigate';
      boss.target = { x, y };
      boss.wait = 0;
    }
    if (source === 'chalk' && boss.alert > 50) audio.alert(0.3);
  }

  private drawNoise(x: number, y: number, strength: number): void {
    const ring = this.add.circle(x, y, 8, 0xf0c04e, 0.35).setDepth(65);
    this.tweens.add({
      targets: ring,
      scale: 4 + strength * 2.4,
      alpha: 0,
      duration: 620,
      ease: 'Quad.out',
      onComplete: () => ring.destroy(),
    });
    const g = this.noiseGraphics;
    g.clear();
    g.lineStyle(2, 0xf0c04e, 0.24);
    g.strokeCircle(x, y, 22);
  }

  private kannoBubbleLines(): string[] {
    if (this.hasObjective) {
      return ['拿到了。', '现在只要出去。', '别在最后一步被看见。'];
    }
    if (this.level.id === 'classroom') {
      return this.noteRead
        ? ['白色。记住了。', '别拿错。', '门应该能开了。']
        : ['门应该没锁吧。', '今晚怎么这么安静。', '猴子这本书，真会挑时候。', '十一应该不在办公室。'];
    }
    if (this.level.id === 'toilet') {
      return ['哪个隔间……', '岛小王应该没看见我。', '这层楼怎么这么安静。', '水声有点大。'];
    }
    if (this.level.id === 'library') {
      return ['门禁卡又换地方了。', '这卡是自己长腿了吗。', '右小唐应该没在看我。', '书架后面能过去吗。'];
    }
    return ['脚怎么这么沉。', '书就在前面。', '十一……老师。', '别停，走过去。'];
  }

  private updateKannoBubble(dt: number): void {
    const bubble = this.kannoBubble;
    if (!bubble) return;
    bubble.setPosition(this.player.x, this.player.y - 68);
    bubble.setDepth(this.player.y + 100);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 24;
    if (this.hidden || moving) {
      bubble.setAlpha(0);
      this.kannoBubbleTimer = 0;
      this.kannoIdleTime = 0;
      return;
    }
    if (this.kannoBubbleTimer > 0) {
      this.kannoBubbleTimer -= dt;
      if (this.kannoBubbleTimer <= 0) bubble.setAlpha(0);
      return;
    }
    this.kannoIdleTime += dt;
    this.kannoBubbleCooldown -= dt;
    if (this.kannoIdleTime < 1.4 || this.kannoBubbleCooldown > 0) return;
    const lines = this.kannoBubbleLines();
    if (lines.length === 0) return;
    bubble.setText(lines[Math.floor(Math.random() * lines.length)]);
    bubble.setAlpha(1);
    this.kannoBubbleTimer = 3.8;
    this.kannoBubbleCooldown = 6 + Math.random() * 4;
    this.kannoIdleTime = 0;
  }

  private updateKeyTeleport(dt: number): void {
    const setup = this.level.keySetup;
    if (setup?.mode !== 'teleport' || this.hasObjective) return;
    const spots = setup.teleportSpots ?? [];
    if (spots.length === 0) return;
    this.teleportTimer += dt * 1000;
    if (this.teleportTimer < (setup.teleportInterval ?? 5000)) return;
    this.teleportTimer = 0;
    const options = spots.filter(
      (spot) => Phaser.Math.Distance.Between(spot.x, spot.y, this.objectiveSpot.x, this.objectiveSpot.y) > 70,
    );
    const pool = options.length > 0 ? options : spots;
    const spot = pool[Math.floor(Math.random() * pool.length)];
    this.objectiveSpot = { x: spot.x, y: spot.y };
    this.tweens.killTweensOf(this.objectiveSprite);
    this.objectiveSprite.setPosition(spot.x, spot.y);
    this.objectiveGlow.setPosition(spot.x, spot.y);
    this.tweens.add({
      targets: this.objectiveSprite,
      y: spot.y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  private updatePickups(): void {
    this.facePickups.forEach((pickup) => {
      if (pickup.picked) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y) < 31) {
        pickup.picked = true;
        const faceValue = Math.round(pickup.value * 1.6);
        this.collectedFace += faceValue;
        pickup.sprite.destroy();
        audio.pickup();
        bus.emit('face:collect', faceValue);
        this.toast(`捡到 ${faceValue} 点面子`);
      }
    });
  }

  private updateInteraction(): void {
    if (this.hidden) {
      if (input.consume('interact')) this.unhidePlayer();
      this.setPrompt('E 从藏身处出来');
      return;
    }
    const interact = input.consume('interact');
    const setup = this.level.keySetup;
    const mode = setup?.mode ?? 'normal';
    const nearHide = this.nearestHide();
    const nearObject = this.distanceTo(this.objectiveSpot.x, this.objectiveSpot.y) < 74 && !this.hasObjective;
    const nearObjective = mode === 'normal' || mode === 'teleport' ? nearObject : false;
    const nearExit = this.distanceTo(this.level.exit.x, this.level.exit.y) < 92;
    const nearNote =
      mode === 'color' && setup?.note
        ? this.distanceTo(setup.note.x, setup.note.y) < 72 && !this.noteRead
        : false;
    const nearColor = mode === 'color' && !this.hasObjective ? this.nearestColorKey() : null;
    const nearStall =
      mode === 'stall' && !this.hasObjective
        ? this.distanceTo(this.stallKeySpot.x, this.stallKeySpot.y) < 82
        : false;

    if (interact) {
      if (nearNote) {
        this.readNote();
      } else if (nearColor) {
        this.tryColorKey(nearColor);
      } else if (nearStall) {
        this.collectObjective();
      } else if (nearObjective) {
        this.collectObjective();
      } else if (nearExit) {
        if (this.hasObjective) this.finishStealth();
        else this.toast('门锁着。先找到东西。');
      } else if (nearHide && !this.bossCanSeePlayer()) {
        this.hidePlayer(nearHide);
      } else if (nearHide) {
        this.toast('他正看着你。先甩开视线。');
      }
    }

    if (this.hidden) {
      this.setPrompt('E 从藏身处出来');
      return;
    }
    if (nearObjective) this.setPrompt(this.level.objective.prompt);
    else if (nearExit) {
      this.setPrompt(this.hasObjective ? this.level.exit.prompt : '门锁着。先找到钥匙。');
    } else if (nearHide && !nearStall) this.setPrompt(nearHide.prompt);
    else this.setPrompt(null);
  }

  private nearestColorKey(): { x: number; y: number; color: string; correct?: boolean } | null {
    let best: { x: number; y: number; color: string; correct?: boolean } | null = null;
    let bestDist = 62;
    for (const key of this.colorKeys) {
      const dist = this.distanceTo(key.def.x, key.def.y);
      if (dist < bestDist) {
        best = key.def;
        bestDist = dist;
      }
    }
    return best;
  }

  private readNote(): void {
    const note = this.level.keySetup?.note;
    if (!note || this.noteRead) return;
    this.noteRead = true;
    audio.pickup();
    this.toast(`纸条上写着：${note.text}。`);
  }

  private tryColorKey(key: { x: number; y: number; color: string; correct?: boolean }): void {
    if (!this.noteRead) {
      this.toast('你还不知道该拿哪一把。');
      return;
    }
    if (key.correct) {
      this.collectObjective();
      return;
    }
    this.toast('不是这把。');
    this.emitNoise(key.x, key.y, 0.65, 'key');
  }

  private nearestHide(): HideSpotRuntime | null {
    let best: HideSpotRuntime | null = null;
    let bestDist = 78;
    for (const spot of this.hideSpots) {
      const dist = this.distanceTo(spot.x, spot.y);
      if (dist < bestDist) {
        best = spot;
        bestDist = dist;
      }
    }
    return best;
  }

  private distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
  }

  private hidePlayer(spot: HideSpotRuntime): void {
    this.hidden = true;
    this.hiddenSpot = spot;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.player.setVelocity(0);
    this.player.setPosition(spot.x, spot.y);
    this.player.setAlpha(0.28);
    this.player.setDepth(spot.y + 5);
    input.crouch = false;
    audio.hide();
    this.emitNoise(spot.x, spot.y, 0.35, 'hide');
    this.toast(`藏进${spot.label}。等 Boss 转过去。`);
  }

  private unhidePlayer(): void {
    this.hidden = false;
    if (this.hiddenSpot) {
      this.player.setPosition(this.hiddenSpot.x, this.hiddenSpot.y + 24);
      this.hiddenSpot = null;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    this.player.setAlpha(1);
    input.enabled = true;
    audio.hide();
  }

  private collectObjective(): void {
    if (this.hasObjective) return;
    this.hasObjective = true;
    audio.pickup();
    this.toast(`拿到${this.level.objective.label}。现在离开这里。`);
    if (this.colorKeys.length > 0) {
      this.colorKeys.forEach((key) => {
        key.sprite.destroy();
        key.glow.destroy();
      });
      this.colorKeys = [];
      this.noteGlow?.destroy();
      this.noteGlow = null;
    } else {
      this.tweens.add({
        targets: [this.objectiveSprite, this.objectiveGlow],
        alpha: 0,
        scale: 0.2,
        duration: 260,
        onComplete: () => {
          this.objectiveSprite.destroy();
          this.objectiveGlow.destroy();
        },
      });
    }
    this.exitSprite.clearTint();
    this.exitSprite.setTint(0xf0c04e);
    this.tweens.add({
      targets: this.exitGlow,
      alpha: 0.58,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.emitHud(true);
    this.setPrompt(this.level.exit.prompt);
  }

  private finishStealth(): void {
    if (this.levelDone) return;
    this.levelDone = true;
    this.gameplayActive = false;
    input.setEnabled(false);
    this.player.setVelocity(0);
    this.boss.setVelocity(0);
    audio.bossWin();
    audio.stopMusic();
    bus.emit('level:complete', {
      levelIndex: this.level.index,
      levelId: this.level.id,
      method: 'stealth',
      faceCollected: this.collectedFace,
      hasObjective: this.hasObjective,
    });
  }

  private beginDebate(reason: string): void {
    if (this.debateTriggered || this.levelDone) return;
    this.debateTriggered = true;
    this.gameplayActive = false;
    input.setEnabled(false);
    this.player.setVelocity(0);
    this.boss.setVelocity(0);
    this.physics.pause();
    audio.debateStart();
    audio.startMusic('debate');
    bus.emit('debate:start', {
      bossId: this.level.bossId,
      levelIndex: this.level.index,
      levelId: this.level.id,
      reason,
    });
  }

  startForcedDebate(): void {
    if (!this.forcedDebate) return;
    this.beginDebate('forced');
  }

  resolveDebate(win: boolean): void {
    if (this.sceneEnded) return;
    if (win) {
      this.levelDone = true;
      this.gameplayActive = false;
      input.setEnabled(false);
      audio.bossWin();
      audio.stopMusic();
      bus.emit('level:complete', {
        levelIndex: this.level.index,
        levelId: this.level.id,
        method: 'debate',
        faceCollected: this.collectedFace,
        bossId: this.level.bossId,
      });
    } else {
      this.levelDone = true;
      this.gameplayActive = false;
      input.setEnabled(false);
      audio.caught();
      audio.stopMusic();
      bus.emit('level:failed', {
        levelIndex: this.level.index,
        levelId: this.level.id,
        bossId: this.level.bossId,
      });
    }
  }

  pauseGameplay(): void {
    if (!this.gameplayActive) return;
    this.pausedByUi = true;
    this.player.setVelocity(0);
    this.boss.setVelocity(0);
    this.physics.pause();
    input.setEnabled(false);
  }

  resumeGameplay(): void {
    if (this.levelDone || this.debateTriggered) return;
    this.pausedByUi = false;
    this.gameplayActive = true;
    this.physics.resume();
    input.setEnabled(true);
    input.clearActions();
  }

  private emitHud(force: boolean): void {
    if (!this.level) return;
    bus.emit('hud:update', {
      area: this.level.name,
      time: this.level.time,
      objective: this.hasObjective ? this.level.objectiveAfter : this.level.objective.label,
      alert: this.bossRuntime?.alert ?? 0,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      hidden: this.hidden,
      force,
    });
  }

  private setPrompt(text: string | null): void {
    if (this.lastPrompt === text) return;
    this.lastPrompt = text;
    bus.emit('ui:prompt', text);
  }

  private toast(text: string): void {
    bus.emit('ui:toast', text);
  }

  private updateMarkers(): void {
    this.hideSpots.forEach((spot) => {
      const dist = this.distanceTo(spot.x, spot.y);
      spot.marker.setAlpha(this.hidden && this.hiddenSpot?.id === spot.id ? 0 : dist < 170 ? 0.95 : 0.28);
    });
    this.facePickups.forEach((pickup) => {
      if (pickup.picked) return;
      const dist = this.distanceTo(pickup.x, pickup.y);
      pickup.sprite.setAlpha(dist < 300 ? 1 : 0.55);
    });
  }

  private isWet(x: number, y: number): boolean {
    if (!this.level.wetZones) return false;
    return this.level.wetZones.some(
      (zone) => x > zone.x - zone.w / 2 && x < zone.x + zone.w / 2 && y > zone.y - zone.h / 2 && y < zone.y + zone.h / 2,
    );
  }

  debugTriggerDebate(): void {
    this.beginDebate('debug');
  }

  debugTeleport(x: number, y: number): void {
    this.player.setPosition(x, y);
  }

  getDebugInfo(): Record<string, unknown> {
    return {
      active: this.gameplayActive,
      pausedByUi: this.pausedByUi,
      hidden: this.hidden,
      hasObjective: this.hasObjective,
      alert: this.bossRuntime?.alert ?? 0,
      bossState: this.bossRuntime?.state,
      boss: this.boss ? { x: Math.round(this.boss.x), y: Math.round(this.boss.y), facing: this.bossRuntime?.facing } : null,
      player: this.player ? { x: Math.round(this.player.x), y: Math.round(this.player.y) } : null,
      objective: this.objectiveSpot ? { x: Math.round(this.objectiveSpot.x), y: Math.round(this.objectiveSpot.y) } : null,
      level: this.level?.id,
    };
  }
}
