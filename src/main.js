import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import '../style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b0908',
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  render: {
    powerPreference: 'high-performance',
    transparent: false
  },
  scene: [GameScene]
});
