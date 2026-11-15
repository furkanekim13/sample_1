import Phaser from 'phaser';
import Creature from '../entities/Creature.js';
import { LEVELS } from '../data/levels.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioSystem from '../systems/AudioSystem.js';

const COLORS = {
  paper: 0xf3e7d5,
  soft: 0xb6a28d,
  muted: 0x857767,
  ember: 0xe7a052,
  dark: 0x100d0b,
  panel: 0x181411
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
    this.mode = 'menu';
    this.save = SaveSystem.load();
    this.audio = new AudioSystem(this.save.settings);
    this.particles = [];
    this.flyingByTouch = false;
    this.toast = '';
    this.toastTimer = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b0908');
    this.keys = this.input.keyboard.addKeys('SPACE,W,UP');
    this.windowKeyHandler = (event) => {
      if (event.repeat) return;
      if (event.code === 'Escape' || event.code === 'KeyP') this.handleEscape();
      else if (event.code === 'KeyR' && ['play', 'pause', 'gameover'].includes(this.mode)) this.startLevel(this.levelIndex);
      else if (event.code === 'KeyM') this.toggleMute();
    };
    window.addEventListener('keydown', this.windowKeyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.windowKeyHandler));
    this.input.on('pointerdown', () => {
      this.audio.unlock();
      if (this.mode === 'play') this.flyingByTouch = true;
    });
    this.input.on('pointerup', () => { this.flyingByTouch = false; });
    this.scale.on('resize', () => this.handleResize());
    this.showMenu();
  }

  get width() { return this.scale.width; }
  get height() { return this.scale.height; }

  setMode(mode) {
    this.mode = mode;
    const root = this.game.canvas.parentElement;
    root.classList.toggle('gameplay', mode === 'play');
    root.dataset.state = mode;
  }

  handleResize() {
    if (this.mode === 'menu') this.showMenu();
    else if (this.mode === 'levels') this.showLevelSelect();
    else if (this.mode === 'settings') this.showSettings();
    else if (this.mode === 'credits') this.showCredits();
    else if (this.mode === 'play') this.layoutHud();
  }

  clearUi() {
    if (this.ui) this.ui.destroy(true);
    this.ui = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    this.uiItems = [];
  }

  addText(text, x, y, size, color = COLORS.paper, options = {}) {
    const obj = this.add.text(x, y, text, {
      fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
      fontSize: `${size}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: options.bold ? 'bold' : 'normal',
      letterSpacing: options.spacing || 0,
      align: options.align || 'center',
      lineSpacing: options.lineSpacing || 5
    }).setOrigin(options.originX ?? .5, options.originY ?? .5);
    this.ui.add(obj);
    this.uiItems.push(obj);
    return obj;
  }

  addButton(label, x, y, action, options = {}) {
    const w = options.width || 220;
    const h = options.height || 48;
    const box = this.add.rectangle(0, 0, w, h, options.fill || COLORS.panel, options.alpha ?? .78)
      .setStrokeStyle(1, options.stroke || 0x554331, .75);
    const title = this.add.text(0, 0, label, {
      fontFamily: 'Avenir Next, Trebuchet MS, sans-serif',
      fontSize: `${options.fontSize || 13}px`,
      color: options.color || '#f3e7d5',
      fontStyle: options.bold ? 'bold' : 'normal',
      letterSpacing: 1.5,
      align: 'center'
    }).setOrigin(.5);
    const button = this.add.container(x, y, [box, title])
      .setSize(w, h)
      .setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains, { useHandCursor: true });
    this.ui.add(button);
    this.uiItems.push(button);
    button.on('pointerover', () => {
      box.setFillStyle(options.hover || 0x3a291b, .96);
      title.setColor('#ffdca9');
    });
    button.on('pointerout', () => {
      box.setFillStyle(options.fill || COLORS.panel, options.alpha ?? .78);
      title.setColor(options.color || '#f3e7d5');
    });
    button.on('pointerdown', () => {
      this.audio.unlock();
      this.audio.play('tick');
      action();
    });
    return { box, title, button };
  }

  showMenu() {
    this.setMode('menu');
    this.clearWorld();
    this.clearUi();
    this.drawMenuAtmosphere();
    const cx = this.width * .5;
    const cy = this.height * .5;
    this.addText('A LITTLE LIGHT IN THE DARK', cx, cy - 142, 11, COLORS.ember, { spacing: 4 });
    this.addText('FURKANEKIM', cx, cy - 86, Math.min(76, this.width * .095), COLORS.paper, { bold: true, spacing: 5 });
    this.addText('A journey through the hush between worlds', cx, cy - 34, 15, COLORS.soft);
    this.addButton('BEGIN FLIGHT', cx, cy + 40, () => this.startLevel(this.save.unlocked), { width: 240, height: 54, stroke: COLORS.ember, color: '#f5d6a5' });
    this.addButton('CHOOSE A PATH', cx, cy + 107, () => this.showLevelSelect());
    this.addButton('SETTINGS', cx, cy + 166, () => this.showSettings('menu'), { width: 136, height: 38, fontSize: 11 });
    this.addButton('CREDITS', cx, cy + 211, () => this.showCredits(), { width: 136, height: 34, fontSize: 10 });
    this.addText('SPACE / W / ↑  TO FLY     •     HOLD TOUCH TO RISE', cx, this.height - 44, 10, COLORS.muted, { spacing: 1.5 });
    this.addText('© FURKANEKIM STUDIO  ·  AN ORIGINAL FLIGHT', this.width - 22, this.height - 20, 9, COLORS.muted, { originX: 1, spacing: 1 });
    this.fadeUi();
  }

  showLevelSelect() {
    this.setMode('levels');
    this.clearUi();
    this.addText('CHOOSE YOUR PATH', this.width / 2, 70, 27, COLORS.paper, { bold: true, spacing: 2 });
    this.addText('Each light remembers the way you travelled.', this.width / 2, 103, 13, COLORS.soft);
    const columns = this.width < 700 ? 2 : 3;
    const gap = Math.min(270, (this.width - 80) / columns);
    const rows = Math.ceil(LEVELS.length / columns);
    const startY = Math.max(205, (this.height - rows * 120) / 2);
    LEVELS.forEach((level, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = this.width / 2 + (col - (columns - 1) / 2) * gap;
      const y = startY + row * 123;
      const unlocked = index <= this.save.unlocked;
      const completed = this.save.completed.includes(index);
      const best = Math.round((this.save.best[index] || 0) * 100);
      const panel = this.add.rectangle(x, y, Math.min(240, gap - 14), 99, unlocked ? 0x211a14 : 0x151210, .9)
        .setStrokeStyle(1, unlocked ? level.color : 0x3c3530, .8)
        .setInteractive({ useHandCursor: unlocked });
      this.ui.add(panel);
      this.uiItems.push(panel);
      this.addText(`0${index + 1}`, x - 91, y - 25, 10, level.color, { originX: 0 });
      this.addText(unlocked ? level.name : 'LOCKED PATH', x, y - 8, 13, unlocked ? COLORS.paper : COLORS.muted, { bold: true });
      this.addText(unlocked ? `${completed ? '✦ COMPLETE' : `${best}% BEST`}   ·   ${level.subtitle}` : 'Reach the previous light to open', x, y + 20, 9, unlocked ? COLORS.soft : COLORS.muted);
      panel.on('pointerover', () => unlocked && panel.setFillStyle(0x302318, 1));
      panel.on('pointerout', () => panel.setFillStyle(unlocked ? 0x211a14 : 0x151210, .9));
      panel.on('pointerdown', () => {
        if (!unlocked) return;
        this.audio.unlock();
        this.audio.play('tick');
        this.startLevel(index);
      });
    });
    this.addButton('BACK', 78, this.height - 48, () => this.showMenu(), { width: 116, height: 38, fontSize: 11 });
    this.addText(`✦  ${this.save.orbs} GLOWING SEEDS`, this.width - 28, this.height - 46, 10, COLORS.ember, { originX: 1, spacing: 1 });
    this.fadeUi();
  }

  showSettings(from = 'menu') {
    if (this.mode !== 'settings') this.settingsFrom = from;
    this.setMode('settings');
    this.clearUi();
    this.addText('SETTINGS', this.width / 2, this.height * .23, 30, COLORS.paper, { bold: true, spacing: 2 });
    this.addText('An easier flight starts with a comfortable rhythm.', this.width / 2, this.height * .23 + 34, 13, COLORS.soft);
    const cx = this.width / 2;
    this.addText(`SOUND  ·  ${this.save.settings.muted ? 'MUTED' : 'ON'}`, cx, this.height * .32, 12, COLORS.ember, { spacing: 2 });
    this.addButton(this.save.settings.muted ? 'TURN SOUND ON' : 'MUTE SOUND', cx, this.height * .32 + 38, () => {
      this.save.settings.muted = !this.save.settings.muted;
      this.audio.setMuted(this.save.settings.muted);
      this.persist();
      this.showSettings(this.settingsFrom);
    }, { width: 220 });
    [
      ['volume', 'MASTER VOLUME'],
      ['musicVolume', 'MUSIC'],
      ['sfxVolume', 'SOUND EFFECTS']
    ].forEach(([key, label], index) => {
      const y = this.height * .48 + index * 58;
      this.addText(`${label}  ·  ${Math.round(this.save.settings[key] * 100)}%`, cx, y, 10, COLORS.soft, { spacing: 1 });
      this.addButton('−', cx - 126, y, () => this.adjustVolume(key, -.1), { width: 42, height: 34, fontSize: 16 });
      this.addButton('+', cx + 126, y, () => this.adjustVolume(key, .1), { width: 42, height: 34, fontSize: 16 });
    });
    this.addButton('RESET PROGRESS', cx, this.height * .81, () => this.showResetConfirmation(), { width: 220, fontSize: 11, stroke: 0x68423a });
    this.addButton('BACK', 78, this.height - 48, () => this.returnFromSettings(), { width: 116, height: 38, fontSize: 11 });
    this.fadeUi();
  }

  showResetConfirmation() {
    this.clearUi();
    this.addText('LET THE JOURNEY BEGIN AGAIN?', this.width / 2, this.height * .39, 20, COLORS.paper, { bold: true });
    this.addText('All unlocked paths, records and collected seeds will be cleared.', this.width / 2, this.height * .39 + 36, 12, COLORS.soft);
    this.addButton('KEEP MY PROGRESS', this.width / 2, this.height * .55, () => this.showSettings(this.settingsFrom), { width: 220 });
    this.addButton('RESET EVERYTHING', this.width / 2, this.height * .55 + 61, () => {
      this.save = SaveSystem.reset();
      this.audio.settings = this.save.settings;
      this.audio.setMuted(false);
      this.audio.setVolume(this.save.settings.volume);
      this.audio.setMusicVolume(this.save.settings.musicVolume);
      this.audio.setSfxVolume(this.save.settings.sfxVolume);
      this.showSettings(this.settingsFrom);
    }, { width: 220, stroke: 0x965249 });
  }

  adjustVolume(key, delta) {
    this.save.settings[key] = Math.max(0, Math.min(1, this.save.settings[key] + delta));
    if (key === 'volume') this.audio.setVolume(this.save.settings[key]);
    else if (key === 'musicVolume') this.audio.setMusicVolume(this.save.settings[key]);
    else this.audio.setSfxVolume(this.save.settings[key]);
    this.persist();
    this.showSettings(this.settingsFrom);
  }

  showCredits() {
    this.setMode('credits');
    this.clearUi();
    this.addText('A WORLD OF OUR OWN', this.width / 2, this.height * .34, 26, COLORS.paper, { bold: true, spacing: 2 });
    this.addText('FURKANEKIM is an original game about a small creature,\\na stubborn light, and the places between.', this.width / 2, this.height * .47, 15, COLORS.soft, { lineSpacing: 10 });
    this.addText('Procedural art  ·  Generated sound  ·  Made for curious wings', this.width / 2, this.height * .58, 11, COLORS.ember);
    this.addButton('BACK', 78, this.height - 48, () => this.showMenu(), { width: 116, height: 38, fontSize: 11 });
  }

  drawMenuAtmosphere() {
    if (this.menuBg) this.menuBg.destroy();
    this.menuBg = this.add.graphics().setDepth(-10).setScrollFactor(0);
    const g = this.menuBg;
    const w = this.width;
    const h = this.height;
    g.fillStyle(0x17120e, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x24170e, .18).fillCircle(w * .5, h * .55, Math.min(w, h) * .53);
    for (let i = 0; i < 13; i++) {
      const x = (i / 12) * w;
      const top = h * (.52 + Math.sin(i * 2.7) * .13);
      g.fillStyle(0x090807, .82);
      g.fillTriangle(x - 100, h, x + 80, h, x + (i % 2 ? 25 : -25), top);
      g.fillStyle(0x090807, .72);
      g.fillRect(x - 5, top - h * .14, 11, h * .5);
      for (let j = 0; j < 3; j++) g.fillCircle(x + Math.sin(i + j) * 34, top - 40 - j * 24, 35 + (j % 2) * 12);
    }
    this.menuDust = [];
    for (let i = 0; i < 46; i++) {
      this.menuDust.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2, speed: 4 + Math.random() * 11, phase: Math.random() * 6 });
    }
    if (this.menuParticles) this.menuParticles.destroy();
    this.menuParticles = this.add.graphics().setDepth(-1).setScrollFactor(0);
  }

  drawMenuParticles(delta) {
    if (!this.menuParticles || !this.menuDust) return;
    const g = this.menuParticles;
    g.clear();
    this.menuDust.forEach((p) => {
      p.y -= p.speed * delta / 1000;
      p.x += Math.sin(p.phase + this.time.now / 1800) * .12;
      if (p.y < -4) p.y = this.height + 4;
      g.fillStyle(0xf1ad61, .15 + (Math.sin(p.phase + this.time.now / 800) + 1) * .16);
      g.fillCircle(p.x, p.y, p.r);
    });
  }

  fadeUi() {
    this.ui.setAlpha(0);
    this.tweens.add({ targets: this.ui, alpha: 1, duration: 480, ease: 'Sine.Out' });
  }

  clearWorld() {
    ['world', 'bgFar', 'bgMid', 'bgNear', 'playerGraphics', 'particleGraphics', 'worldUi', 'menuBg', 'menuParticles', 'veil']
      .forEach((key) => {
        if (this[key]) {
          this[key].destroy();
          this[key] = null;
        }
      });
    this.particles = [];
  }

  startLevel(index) {
    this.levelIndex = clamp(index, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.setMode('play');
    this.flyingByTouch = false;
    this.clearUi();
    this.clearWorld();
    this.audio.unlock();
    this.levelWidth = this.width * this.level.length;
    this.world = this.add.container(0, 0).setDepth(1);
    this.buildBackground();
    this.buildHazards();
    this.buildCollectibles();
    this.playerGraphics = this.add.graphics().setDepth(8);
    this.particleGraphics = this.add.graphics().setDepth(6);
    this.worldUi = this.add.container(0, 0).setDepth(12);
    const startX = this.width * .12;
    const startY = this.height * .5;
    this.creatures = [new Creature(startX, startY, true)];
    this.elapsed = 0;
    this.runOrbs = 0;
    this.cameraX = 0;
    this.baseSpeed = this.width * .15;
    this.checkpointX = startX;
    this.checkpointReached = false;
    this.checkpointUsed = false;
    this.effects = { speed: 0, gravity: 0, shield: 0 };
    this.levelProgress = 0;
    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, this.levelWidth, this.height);
    this.camera.scrollX = 0;
    this.camera.scrollY = 0;
    this.makeHud();
    this.showToast(this.level.name, 2.2);
    this.fadeUi();
  }

  buildBackground() {
    this.bgFar = this.add.graphics().setDepth(-20).setScrollFactor(.1, 0);
    this.bgMid = this.add.graphics().setDepth(-19).setScrollFactor(.28, 0);
    this.bgNear = this.add.graphics().setDepth(-18).setScrollFactor(.62, 0);
    const rng = rand(100 + this.levelIndex * 21);
    const h = this.height;
    const w = this.levelWidth;
    this.bgFar.fillStyle(this.level.deep, .95);
    this.bgFar.fillPoints([
      new Phaser.Geom.Point(0, h * .75),
      ...Array.from({ length: 20 }, (_, i) => new Phaser.Geom.Point(i * w / 19, h * (.31 + rng() * .28))),
      new Phaser.Geom.Point(w, h)
    ], true);
    for (let i = 0; i < 90; i++) {
      const x = rng() * w;
      const y = h * (.2 + rng() * .55);
      this.bgFar.fillStyle(this.level.color, .07 + rng() * .12);
      this.bgFar.fillCircle(x, y, 1 + rng() * 2);
    }
    for (let i = 0; i < w / 120; i++) {
      const x = i * 120 + rng() * 90;
      const base = h * (.81 + rng() * .08);
      const trunk = h * (.11 + rng() * .17);
      this.bgMid.fillStyle(0x090807, .58);
      this.bgMid.fillRect(x - 5, base - trunk, 10, trunk);
      this.bgMid.fillTriangle(x - 60, base - trunk * .15, x + 62, base - trunk * .15, x, base - trunk * 1.65);
      this.bgMid.fillTriangle(x - 48, base - trunk * .55, x + 51, base - trunk * .55, x + 4, base - trunk * 1.9);
    }
    for (let i = 0; i < w / 95; i++) {
      const x = i * 95 + rng() * 45;
      const base = h * (.88 + rng() * .04);
      this.bgNear.fillStyle(0x070605, .76);
      this.bgNear.fillTriangle(x - 39, base, x + 39, base, x + rng() * 12, base - h * (.08 + rng() * .14));
      this.bgNear.fillRect(x - 3, base - h * .1, 6, h * .18);
    }
    this.world.add(this.add.graphics().fillStyle(0x080706, .94).fillRect(0, h * .92, w, h * .08).setDepth(1));
    this.world.add(this.add.graphics().fillStyle(0x080706, .72).fillRect(0, 0, w, h * .055).setDepth(1));
    this.world.add(this.add.graphics().fillStyle(0x301b10, .45).fillRect(this.levelWidth - 68, 0, 5, h).setDepth(2));
    this.world.add(this.add.graphics().fillStyle(this.level.color, .52).fillCircle(this.levelWidth - 65, h * .5, 58).setDepth(2));
    this.world.add(this.add.graphics().fillStyle(0x140e0b, .95).fillCircle(this.levelWidth - 65, h * .5, 38).setDepth(2));
  }

  buildHazards() {
    this.hazards = this.level.hazards.map((source, index) => ({
      ...source,
      baseX: this.levelWidth * source.x,
      baseY: this.height * source.y,
      phase: index * 1.71,
      radius: Math.min(this.width, this.height) * .046 * source.size,
      width: Math.min(this.width, this.height) * (source.type === 'tunnel' ? .13 : .14) * source.size,
      height: Math.min(this.width, this.height) * (source.type === 'tunnel' ? .76 : .15) * source.size,
      x: this.levelWidth * source.x,
      y: this.height * source.y,
      angle: index * .7
    }));
    this.hazardGraphics = this.add.graphics().setDepth(4);
    this.world.add(this.hazardGraphics);
  }

  buildCollectibles() {
    this.collectibles = this.level.items.map((source, index) => ({
      ...source,
      x: this.levelWidth * source.x,
      y: this.height * source.y,
      phase: index * 1.4,
      collected: false
    }));
    this.collectibleGraphics = this.add.graphics().setDepth(5);
    this.world.add(this.collectibleGraphics);
  }

  makeHud() {
    this.clearUi();
    this.hud = {};
    this.hud.level = this.addText(this.level.name.toUpperCase(), 28, 25, 10, COLORS.paper, { originX: 0, spacing: 1.3 });
    this.hud.count = this.addText('✦  1', 28, 51, 13, COLORS.ember, { originX: 0, bold: true });
    this.hud.orbs = this.addText('SEEDS  0', 28, 72, 9, COLORS.soft, { originX: 0, spacing: 1 });
    this.hud.progressBg = this.add.rectangle(this.width / 2, 28, Math.min(300, this.width * .36), 3, 0x594531, .8);
    this.hud.progress = this.add.rectangle(this.width / 2 - Math.min(300, this.width * .36) / 2, 28, 0, 3, this.level.color, 1).setOrigin(0, .5);
    this.ui.add([this.hud.progressBg, this.hud.progress]);
    this.uiItems.push(this.hud.progressBg, this.hud.progress);
    this.hud.pause = this.addButton('Ⅱ', this.width - 42, 34, () => this.pauseGame(), { width: 48, height: 40, fontSize: 16, alpha: .68 });
    this.layoutHud();
  }

  layoutHud() {
    if (!this.hud || this.mode !== 'play') return;
    this.hud.level.setPosition(28, 25);
    this.hud.count.setPosition(28, 51);
    this.hud.orbs.setPosition(28, 72);
    this.hud.progressBg.setPosition(this.width / 2, 28);
    this.hud.progress.setPosition(this.width / 2 - this.hud.progressBg.width / 2, 28);
    if (this.hud.pause) this.hud.pause.button.setPosition(this.width - 42, 34);
  }

  update(time, delta) {
    if (this.mode !== 'play') {
      if (this.mode === 'menu') this.drawMenuParticles(delta);
      return;
    }
    const dt = Math.min(delta / 1000, .04);
    this.elapsed += dt;
    this.updateWorld(dt);
    this.updateParticles(dt);
    this.renderWorld();
    this.renderParticles();
    this.updateHud();
  }

  updateWorld(dt) {
    const thrusting = this.flyingByTouch || this.keys.SPACE.isDown || this.keys.W.isDown || this.keys.UP.isDown;
    const gravity = this.height * .56 * (this.effects.gravity > 0 ? .42 : 1);
    const thrust = this.height * 1.02;
    this.lastThrusting = thrusting;
    this.lastPhysics = { dt, gravity, thrust };
    const speed = this.baseSpeed * (this.effects.speed > 0 ? 1.38 : 1);
    if (this.effects.speed > 0) this.effects.speed = Math.max(0, this.effects.speed - dt);
    if (this.effects.gravity > 0) this.effects.gravity = Math.max(0, this.effects.gravity - dt);
    if (this.effects.shield > 0) this.effects.shield = Math.max(0, this.effects.shield - dt);
    this.hazards.forEach((hazard) => {
      hazard.angle += dt * (hazard.type === 'gear' ? 1.5 : 2.4);
      if (hazard.drift) hazard.y = hazard.baseY + Math.sin(this.elapsed * 1.2 + hazard.phase) * hazard.drift;
    });
    for (const creature of this.creatures) {
      if (!creature.alive) continue;
      creature.invulnerable = Math.max(0, creature.invulnerable - dt);
      creature.shield = Math.max(0, creature.shield - dt);
      const isPrimary = creature.primary;
      const localThrust = thrusting ? (isPrimary ? 1 : .86) : 0;
      const follow = isPrimary ? 0 : Math.sin(this.elapsed * 1.7 + creature.phase) * this.height * .045;
      creature.vy += (gravity - thrust * localThrust + follow) * dt;
      creature.vy = clamp(creature.vy, -this.height * .56, this.height * .62);
      const targetSpeed = speed * (creature.primary ? 1 : .97);
      creature.vx += (targetSpeed - creature.vx) * Math.min(1, dt * 2.1);
      creature.x += creature.vx * dt;
      creature.y += creature.vy * dt;
      creature.phase += dt * (thrusting ? 13 : 7);
      if (creature.y < this.height * .075 || creature.y > this.height * .915) {
        this.killCreature(creature);
        continue;
      }
      if (creature.invulnerable <= 0) {
        const hit = this.hazards.find((hazard) => !hazard.destroyed && this.intersectsHazard(creature, hazard));
        if (hit) this.hitCreature(creature, hit);
      }
      if (creature.alive) this.checkCollectibles(creature);
      if (creature.alive && Math.random() < dt * 12) this.emit(creature.x - 12, creature.y + 2, this.level.color, 1);
    }
    this.creatures = this.creatures.filter((creature) => creature.alive);
    if (!this.creatures.length) {
      if (this.checkpointReached && !this.checkpointUsed) {
        this.checkpointUsed = true;
        const restored = new Creature(this.checkpointX + 10, this.height * .5, true);
        restored.invulnerable = 2;
        restored.vx = speed;
        this.creatures.push(restored);
        this.showToast('THE CHECKPOINT KEEPS ONE LAST SPARK', 2);
      } else {
        this.showGameOver();
        return;
      }
    }
    const primary = this.creatures.find((creature) => creature.primary) || this.creatures[0];
    this.levelProgress = clamp(primary.x / this.levelWidth, 0, 1);
    if (!this.checkpointReached && primary.x > this.levelWidth * .5) {
      this.checkpointReached = true;
      this.checkpointX = primary.x;
      this.showToast('A quiet place to rest. CHECKPOINT REACHED', 2);
    }
    this.cameraX += ((primary.x - this.width * .32) - this.cameraX) * Math.min(1, dt * 2.4);
    this.camera.scrollX = clamp(this.cameraX, 0, Math.max(0, this.levelWidth - this.width));
    if (primary.x >= this.levelWidth - this.width * .055) this.completeLevel();
  }

  intersectsHazard(creature, hazard) {
    const r = hazard.radius;
    const dx = Math.abs(creature.x - hazard.baseX);
    const dy = Math.abs(creature.y - hazard.y);
    if (hazard.type === 'tunnel') return dx < hazard.width * .42 && dy > this.height * .17 && dy < hazard.height * .52;
    if (hazard.type === 'platform') {
      return dx < hazard.width * .55 && dy < hazard.height * .33 && creature.vy > 0;
    }
    if (hazard.type === 'destructible') return dx < hazard.width * .43 && dy < hazard.height * .48;
    if (hazard.type === 'crusher') return dx < hazard.width * .46 && dy < hazard.height * .47;
    if (hazard.type === 'laser') return dx < hazard.width * .55 && dy < Math.max(10, r * .2);
    if (hazard.type === 'spikes') return dx < hazard.width * .47 && dy < r * .9;
    if (hazard.type === 'rock') return dx < r * .95 && dy < r * 1.08;
    return dx * dx + dy * dy < (r + 15) ** 2;
  }

  hitCreature(creature, hazard) {
    if (creature.shield > 0 || this.effects.shield > 0) {
      creature.shield = 0;
      this.effects.shield = 0;
      creature.invulnerable = 1.25;
      creature.vy = -this.height * .24;
      this.audio.play('hit');
      this.burst(creature.x, creature.y, 0xffc167, 16);
      this.showToast('SHIELD SPENT', 1.1);
      return;
    }
    if (hazard.type === 'platform') {
      creature.vy = -this.height * .25;
      creature.invulnerable = .38;
      this.audio.play('hit');
      return;
    }
    if (hazard.type === 'destructible') {
      hazard.destroyed = true;
      creature.vy = -this.height * .14;
      creature.invulnerable = .35;
      this.audio.play('hit');
      this.burst(hazard.baseX, hazard.y, this.level.color, 14);
      this.showToast('OLD WOOD GIVES WAY', 1.1);
      return;
    }
    this.killCreature(creature);
  }

  killCreature(creature) {
    if (!creature.alive) return;
    creature.alive = false;
    this.burst(creature.x, creature.y, 0xed8d4c, 20);
    this.audio.play('death');
  }

  checkCollectibles(creature) {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const y = item.y + Math.sin(this.elapsed * 2 + item.phase) * 7;
      const r = item.type === 'orb' ? 23 : 26;
      if ((creature.x - item.x) ** 2 + (creature.y - y) ** 2 > r * r) continue;
      item.collected = true;
      this.audio.play(item.type === 'clone' ? 'clone' : 'collect');
      this.burst(item.x, y, this.collectibleColor(item.type), item.type === 'orb' ? 12 : 18);
      if (item.type === 'orb') {
        this.runOrbs++;
        this.save.orbs++;
        this.showToast('+1 GLOWING SEED', 1.2);
      } else if (item.type === 'clone') {
        const source = this.creatures.filter((entry) => entry.alive).slice(0, 6);
        source.forEach((entry, index) => {
          if (this.creatures.length >= 8) return;
          const clone = new Creature(entry.x - 22 - index * 5, entry.y + (index % 2 ? 26 : -26), false, entry.size);
          clone.phase = index * 1.8;
          this.creatures.push(clone);
        });
        this.showToast('THE LIGHT SPLITS · WINGS MULTIPLIED', 1.6);
      } else if (item.type === 'speed') {
        this.effects.speed = 7;
        this.showToast('SWIFT CURRENT · 7 SECONDS', 1.3);
      } else if (item.type === 'gravity') {
        this.effects.gravity = 8;
        this.showToast('FEATHERFALL · 8 SECONDS', 1.3);
      } else if (item.type === 'shield') {
        this.effects.shield = 5;
        this.creatures.forEach((entry) => { entry.shield = 5; });
        this.showToast('A LITTLE MORE LIGHT · SHIELD READY', 1.4);
      } else if (item.type === 'grow' || item.type === 'shrink') {
        const factor = item.type === 'grow' ? 1.28 : .76;
        this.creatures.forEach((entry) => { entry.size = clamp(entry.size * factor, .58, 1.5); });
        this.showToast(item.type === 'grow' ? 'ROOT-GIANT · GROWN LARGE' : 'SMALL AS A FIREFLY', 1.3);
      }
      this.persist();
      break;
    }
  }

  collectibleColor(type) {
    return ({
      orb: 0xffd77b, clone: 0xa2e6c6, speed: 0x81d8e6, gravity: 0xb6a3ee,
      shield: 0xffa66d, grow: 0x9be283, shrink: 0x8dd8ee
    })[type] || 0xffd77b;
  }

  completeLevel() {
    if (this.mode !== 'play') return;
    this.setMode('victory');
    this.audio.play('win');
    if (this.levelIndex === LEVELS.length - 1) this.cameras.main.flash(900, 245, 156, 80);
    this.burst(this.levelWidth - 65, this.height / 2, this.level.color, 48);
    this.cameras.main.shakeEffect.reset();
    if (!this.save.completed.includes(this.levelIndex)) this.save.completed.push(this.levelIndex);
    this.save.unlocked = Math.max(this.save.unlocked, Math.min(4, this.levelIndex + 1));
    this.save.best[this.levelIndex] = Math.max(this.save.best[this.levelIndex] || 0, this.levelProgress);
    this.persist();
    this.clearUi();
    const cx = this.width / 2;
    this.addText('✦', cx, this.height * .27, 38, COLORS.ember);
    this.addText(this.levelIndex === LEVELS.length - 1 ? 'DAWN, AT LAST' : 'THE LIGHT CARRIES ON', cx, this.height * .36, 27, COLORS.paper, { bold: true, spacing: 2 });
    this.addText(`${this.level.name}  ·  ${this.runOrbs} glowing seeds gathered`, cx, this.height * .44, 13, COLORS.soft);
    this.addButton(this.levelIndex < LEVELS.length - 1 ? 'NEXT PATH' : 'RETURN TO FIRST PATH', cx, this.height * .56, () => this.startLevel((this.levelIndex + 1) % LEVELS.length), { width: 220, stroke: COLORS.ember });
    this.addButton('FLY AGAIN', cx, this.height * .56 + 62, () => this.startLevel(this.levelIndex), { width: 220 });
    this.addButton('MAIN MENU', cx, this.height * .56 + 124, () => this.showMenu(), { width: 220 });
    this.fadeUi();
  }

  showGameOver() {
    if (this.mode !== 'play') return;
    this.setMode('gameover');
    this.cameras.main.shakeEffect.reset();
    this.audio.play('death');
    this.save.best[this.levelIndex] = Math.max(this.save.best[this.levelIndex] || 0, this.levelProgress);
    this.persist();
    this.clearUi();
    const cx = this.width / 2;
    this.addText('THE WIND FELL QUIET', cx, this.height * .36, 26, COLORS.paper, { bold: true, spacing: 2 });
    this.addText(`${Math.round(this.levelProgress * 100)}% of ${this.level.name} travelled  ·  ${this.runOrbs} seeds`, cx, this.height * .44, 13, COLORS.soft);
    this.addButton('TRY AGAIN', cx, this.height * .56, () => this.startLevel(this.levelIndex), { width: 220, stroke: COLORS.ember });
    this.addButton('MAIN MENU', cx, this.height * .56 + 62, () => this.showMenu(), { width: 220 });
    this.fadeUi();
  }

  pauseGame() {
    if (this.mode !== 'play') return;
    this.setMode('pause');
    this.cameras.main.shakeEffect.reset();
    this.flyingByTouch = false;
    this.clearUi();
    const cx = this.width / 2;
    this.addText('TAKE A BREATH', cx, this.height * .35, 26, COLORS.paper, { bold: true, spacing: 2 });
    this.addText(this.level.name, cx, this.height * .35 + 34, 13, COLORS.soft);
    this.addButton('RESUME FLIGHT', cx, this.height * .5, () => this.resumeGame(), { width: 220, stroke: COLORS.ember });
    this.addButton('RESTART LEVEL', cx, this.height * .5 + 60, () => this.startLevel(this.levelIndex), { width: 220 });
    this.addButton('SETTINGS', cx, this.height * .5 + 120, () => this.showSettings('pause'), { width: 220 });
    this.addButton('MAIN MENU', cx, this.height * .5 + 180, () => this.showMenu(), { width: 220 });
    this.fadeUi();
  }

  resumeGame() {
    this.setMode('play');
    this.makeHud();
    this.showToast('BACK TO THE WIND', 1);
  }

  returnFromSettings() {
    if (this.settingsFrom === 'pause') {
      this.setMode('pause');
      this.clearUi();
      const cx = this.width / 2;
      this.addText('TAKE A BREATH', cx, this.height * .35, 26, COLORS.paper, { bold: true, spacing: 2 });
      this.addText(this.level.name, cx, this.height * .35 + 34, 13, COLORS.soft);
      this.addButton('RESUME FLIGHT', cx, this.height * .5, () => this.resumeGame(), { width: 220, stroke: COLORS.ember });
      this.addButton('RESTART LEVEL', cx, this.height * .5 + 60, () => this.startLevel(this.levelIndex), { width: 220 });
      this.addButton('SETTINGS', cx, this.height * .5 + 120, () => this.showSettings('pause'), { width: 220 });
      this.addButton('MAIN MENU', cx, this.height * .5 + 180, () => this.showMenu(), { width: 220 });
      return;
    }
    this.showMenu();
  }

  handleEscape() {
    if (this.mode === 'play') this.pauseGame();
    else if (this.mode === 'pause') this.resumeGame();
    else if (this.mode === 'settings' && this.settingsFrom === 'pause') this.returnFromSettings();
    else if (this.mode === 'levels' || this.mode === 'settings' || this.mode === 'credits') this.showMenu();
  }

  toggleMute() {
    this.save.settings.muted = !this.save.settings.muted;
    this.audio.setMuted(this.save.settings.muted);
    this.persist();
    if (this.mode === 'settings') this.showSettings(this.settingsFrom);
    else this.showToast(this.save.settings.muted ? 'SOUND MUTED' : 'SOUND RESTORED', 1.1);
  }

  updateHud() {
    if (!this.hud || this.mode !== 'play') return;
    this.hud.count.setText(`✦  ${this.creatures.length}`);
    this.hud.orbs.setText(`SEEDS  ${this.runOrbs}`);
    this.hud.progress.width = this.hud.progressBg.width * this.levelProgress;
    if (this.toastTimer > 0) {
      this.toastTimer -= .016;
      if (this.toastLabel) this.toastLabel.setText(this.toastTimer > 0 ? this.toast : '');
    }
  }

  showToast(text, duration = 1.5) {
    this.toast = text;
    this.toastTimer = duration;
    if (this.toastLabel) this.toastLabel.destroy();
    if (!this.ui || !this.ui.active) return;
    this.toastLabel = this.addText(text, this.width / 2, this.height - 62, 10, COLORS.ember, { spacing: 1.2 });
  }

  emit(x, y, color, count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 230) this.particles.shift();
      this.particles.push({
        x, y, vx: (Math.random() - .5) * 45, vy: (Math.random() - .5) * 45,
        life: .45 + Math.random() * .55, age: 0, radius: 1 + Math.random() * 2.3, color
      });
    }
  }

  burst(x, y, color, count = 18) {
    this.emit(x, y, color, count);
    this.cameras.main.shake(100, .0025);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .985;
      p.vy *= .985;
    }
  }

  renderParticles() {
    const g = this.particleGraphics;
    g.clear();
    this.particles.forEach((p) => {
      g.fillStyle(p.color, 1 - p.age / p.life);
      g.fillCircle(p.x, p.y, p.radius * (1 - p.age / p.life * .45));
    });
  }

  renderWorld() {
    this.hazardGraphics.clear();
    this.hazards.forEach((h) => this.drawHazard(h));
    this.collectibleGraphics.clear();
    this.collectibles.forEach((item) => {
      if (item.collected) return;
      const y = item.y + Math.sin(this.elapsed * 2 + item.phase) * 7;
      const color = this.collectibleColor(item.type);
      const radius = 10 + Math.sin(this.elapsed * 3 + item.phase) * 1.8;
      this.collectibleGraphics.fillStyle(color, .08).fillCircle(item.x, y, 30);
      this.collectibleGraphics.fillStyle(color, .2).fillCircle(item.x, y, 19);
      this.collectibleGraphics.lineStyle(2, color, .86);
      if (item.type === 'clone') {
        this.collectibleGraphics.strokeCircle(item.x - 5, y, radius * .62);
        this.collectibleGraphics.strokeCircle(item.x + 5, y, radius * .62);
      } else if (item.type === 'shield') {
        this.collectibleGraphics.strokeCircle(item.x, y, radius + 1);
        this.collectibleGraphics.strokeCircle(item.x, y, radius - 4);
      } else {
        this.collectibleGraphics.strokeCircle(item.x, y, radius);
        this.collectibleGraphics.fillStyle(color, .85).fillCircle(item.x, y, 3.2);
      }
    });
    const g = this.playerGraphics;
    g.clear();
    this.creatures.forEach((creature) => {
      if (!creature.alive) return;
      const size = Math.min(this.width, this.height) * .023 * creature.size;
      const angle = clamp(creature.vy / (this.height * .56), -1, 1) * .4;
      const flap = Math.sin(creature.phase) * size * .47;
      if (creature.invulnerable > 0 && Math.floor(this.elapsed * 14) % 2) return;
      g.fillStyle(0xf6a850, .055).fillCircle(creature.x, creature.y, size * 2.55);
      if (creature.shield > 0 || this.effects.shield > 0) {
        g.lineStyle(1.5, 0xffd982, .78).strokeCircle(creature.x, creature.y, size * 1.7);
      }
      const wingX = Math.cos(angle) * size * .35;
      g.fillStyle(0x100e0c, .97);
      g.fillEllipse(creature.x - wingX - size * .47, creature.y + flap * .35, size * 1.05, size * (.39 + Math.abs(flap) * .012));
      g.fillEllipse(creature.x + wingX + size * .47, creature.y - flap * .35, size * 1.05, size * (.39 + Math.abs(flap) * .012));
      g.fillStyle(0x090807, 1).fillEllipse(creature.x, creature.y, size * 1.55, size * 1.27);
      g.fillStyle(0xffd47c, .95);
      g.fillCircle(creature.x + size * .33, creature.y - size * .12, Math.max(1.5, size * .105));
      g.fillCircle(creature.x + size * .55, creature.y - size * .1, Math.max(1.2, size * .075));
      g.fillStyle(0xffb84f, .16).fillCircle(creature.x + size * .39, creature.y - size * .12, size * .42);
    });
  }

  drawHazard(h) {
    const g = this.hazardGraphics;
    if (h.destroyed) return;
    const x = h.baseX;
    const y = h.y;
    const r = h.radius;
    const color = this.level.color;
    if (h.type === 'platform') {
      g.fillStyle(0x0b0908, .97).fillRoundedRect(x - h.width * .6, y - h.height * .27, h.width * 1.2, h.height * .54, 7);
      g.lineStyle(2, color, .62).strokeRoundedRect(x - h.width * .6, y - h.height * .27, h.width * 1.2, h.height * .54, 7);
      g.fillStyle(color, .28).fillRect(x - h.width * .48, y - h.height * .27, h.width * .96, 3);
      return;
    }
    if (h.type === 'crusher') {
      g.fillStyle(0x0c0a08, .98).fillRoundedRect(x - h.width * .38, y - h.height * .5, h.width * .76, h.height, 5);
      g.lineStyle(2, color, .55).strokeRoundedRect(x - h.width * .38, y - h.height * .5, h.width * .76, h.height, 5);
      for (let i = 0; i < 3; i++) g.fillTriangle(x - h.width * .3 + i * h.width * .2, y + h.height * .5, x - h.width * .17 + i * h.width * .2, y + h.height * .5, x - h.width * .235 + i * h.width * .2, y + h.height * .66);
      g.lineStyle(1, color, .3).lineBetween(x, y - h.height * .8, x, y - h.height * .5);
      return;
    }
    if (h.type === 'laser') {
      g.fillStyle(0x0b0908, .95).fillRoundedRect(x - h.width * .52, y - 7, h.width * 1.04, 14, 5);
      g.fillStyle(0xff6a4e, .24).fillRect(x - h.width * .62, y - 3, h.width * 1.24, 6);
      g.fillStyle(0xff9673, .92).fillRect(x - h.width * .52, y - 1, h.width * 1.04, 2);
      return;
    }
    if (h.type === 'tunnel') {
      const gap = this.height * .17;
      const top = this.height * .055;
      const bottom = this.height * .92;
      g.fillStyle(0x0b0908, .97);
      g.fillRoundedRect(x - h.width * .46, top, h.width * .92, Math.max(0, y - gap - top), 5);
      g.fillRoundedRect(x - h.width * .46, y + gap, h.width * .92, Math.max(0, bottom - y - gap), 5);
      g.lineStyle(1.5, color, .4);
      g.lineBetween(x - h.width * .46, y - gap, x + h.width * .46, y - gap);
      g.lineBetween(x - h.width * .46, y + gap, x + h.width * .46, y + gap);
      return;
    }
    if (h.type === 'destructible') {
      g.fillStyle(0x100d0b, .98).fillRoundedRect(x - h.width * .45, y - h.height * .4, h.width * .9, h.height * .8, 4);
      g.lineStyle(1.5, color, .62).strokeRoundedRect(x - h.width * .45, y - h.height * .4, h.width * .9, h.height * .8, 4);
      g.lineStyle(1.2, color, .46);
      g.lineBetween(x - h.width * .2, y - h.height * .17, x + h.width * .07, y + h.height * .05);
      g.lineBetween(x + h.width * .07, y + h.height * .05, x - h.width * .03, y + h.height * .3);
      g.lineBetween(x + h.width * .07, y + h.height * .05, x + h.width * .27, y - h.height * .2);
      return;
    }
    if (h.type === 'spikes') {
      const base = y + r * .65;
      g.fillStyle(0x0a0807, .98);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const left = x - h.width * .48 + i * h.width * .19;
        g.fillTriangle(left, base, left + h.width * .19, base, left + h.width * .095, base - r * 1.25);
      }
      g.lineStyle(1, color, .3).lineBetween(x - h.width * .5, base, x + h.width * .5, base);
      return;
    }
    if (h.type === 'rock') {
      g.fillStyle(0x0b0908, 1).fillPoints([
        new Phaser.Geom.Point(x - r * .86, y - r * .25), new Phaser.Geom.Point(x - r * .42, y - r * .9),
        new Phaser.Geom.Point(x + r * .47, y - r * .8), new Phaser.Geom.Point(x + r * .94, y - r * .06),
        new Phaser.Geom.Point(x + r * .62, y + r * .72), new Phaser.Geom.Point(x - r * .53, y + r * .78)
      ], true);
      g.lineStyle(1, color, .27).strokeCircle(x, y, r * .78);
      return;
    }
    const gear = h.type === 'gear';
    const teeth = gear ? 12 : 8;
    g.fillStyle(0x090807, .98);
    for (let i = 0; i < teeth; i++) {
      const a = h.angle + i * Math.PI * 2 / teeth;
      const tx = x + Math.cos(a) * r * (gear ? 1.1 : .92);
      const ty = y + Math.sin(a) * r * (gear ? 1.1 : .92);
      g.fillRect(tx - r * .12, ty - r * .12, r * .24, r * .24);
    }
    g.fillCircle(x, y, r * .92);
    g.lineStyle(2, color, gear ? .54 : .4).strokeCircle(x, y, r * .83);
    g.fillStyle(0x21150e, .96).fillCircle(x, y, r * .24);
    for (let i = 0; i < (gear ? 6 : 3); i++) {
      const a = h.angle + i * Math.PI * 2 / (gear ? 6 : 3);
      g.lineStyle(r * .13, 0x070605, 1).lineBetween(x + Math.cos(a) * r * .25, y + Math.sin(a) * r * .25, x + Math.cos(a) * r * .74, y + Math.sin(a) * r * .74);
    }
  }

  persist() {
    SaveSystem.store(this.save);
  }
}
