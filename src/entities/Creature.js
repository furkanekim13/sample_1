export default class Creature {
  constructor(x, y, primary = false, size = 1) {
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.vx = 0;
    this.primary = primary;
    this.size = size;
    this.phase = Math.random() * Math.PI * 2;
    this.alive = true;
    this.invulnerable = 0;
    this.shield = 0;
  }
}
