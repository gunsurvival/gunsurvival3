import { Container, Sprite } from 'pixi.js';
// import { createHealthBar } from "../graphics/createMobHealthBar"
import anime from 'animejs';
import type { SerializedResponse } from 'multiplayer-world';
import { Client, Server, type } from 'multiplayer-world';
import { createHealthBar } from '../graphics/createHealthBar';
import { Bullet } from './Bullet';
import { PixiEntity } from './PixiEntity';

export class Mob extends PixiEntity {
  @type('number') health: number = 100;
  healthBar!: ReturnType<typeof createHealthBar>;
  sprite!: Sprite;

  randomSeed = Math.floor(Math.random() * 1000);
  display!: Container;
  lastMoveFrame = 0;
  speed = 5;
  friction = 0.96;

  async prepare(options: Parameters<this['init']>[0] = {}): Promise<void> {
    this.healthBar = createHealthBar({
      width: 150,
      height: 10,
      borderWeight: 3,
      round: 10,
      lowPercent: 0,
    });
    this.updateHealthBarPos(options.pos?.x ?? 0, options.pos?.y ?? 0);
    this.healthBar.container.zIndex = this.sprite.zIndex + 1;
    // this.display.addChild(this.healthBar.container)
    this.world.viewport.addChild(this.healthBar.container);
    this.display.on('removed', () => {
      this.healthBar.destroy();
    });
  }

  nextTick(deltaTime: number): void {
    this.updateDisplay(deltaTime);
    this.calculateMovement(deltaTime);

    if (this.health < 0) {
      this.destroy();
    }

    if (this.isClient) {
      const bubbleScale = Math.sin((Date.now() + this.randomSeed) / 400) * 0.05;
      // const scale = this.health / 100 + bubbleScale
      const scale = 1 + bubbleScale;
      this.display.scale = scale;
      this.updateHealthBarPos();
      this.healthBar.setHealth(this.health / 100);
      this.healthBar.update();
    }
  }

  @Client()
  updateHealthBarPos(x = this.pos.x, y = this.pos.y) {
    if (this.healthBar.isDestroyed()) return;
    this.healthBar.container.x = x - this.healthBar.container.width / 2;
    this.healthBar.container.y = y - 110;
  }

  @Server()
  calculateMovement(deltaTime: number): void {
    if (this.world.frameCount - this.lastMoveFrame > Math.random() * 100 + 80) {
      this.vel.x = 0;
      this.vel.y = 0;
      switch (Math.floor(Math.random() * 5)) {
        case 0: // Only change angle
          this.rotation = Math.random() * Math.PI * 2;
          break;

        case 1: {
          // Change angle and move
          this.rotation = Math.random() * Math.PI * 2;
          this.vel.x = Math.cos(this.rotation) * this.speed;
          this.vel.y = Math.sin(this.rotation) * this.speed;
          break;
        }

        case 2: {
          // Only move
          this.vel.x = Math.cos(this.rotation) * this.speed;
          this.vel.y = Math.sin(this.rotation) * this.speed;
          break;
        }

        default:
          break;
      }

      this.lastMoveFrame = this.world.frameCount;
    }
  }

  @Server({ sync: true })
  onCollisionEnter(otherId: number, response: SerializedResponse): void {
    const other = this.world.entities.get(otherId);
    if (other instanceof Bullet) {
      const damage = other.vel.len() / 5;
      this.injure(damage);
    }
  }

  @Client()
  emitInjury() {
    this.sprite.tint = 0x990000;
    anime.remove(this.sprite);
    anime.remove(this.sprite.scale);
    anime({
      targets: this.sprite,
      alpha: 0.5,
      duration: 150,
      direction: 'alternate',
      loop: 2,
      easing: 'easeOutSine',
    }).complete = () => {
      this.sprite.tint = 0xffffff;
      this.sprite.alpha = 1;
    };
    anime({
      targets: this.sprite.scale,
      x: 1.1,
      y: 1.1,
      duration: 1500,
      direction: 'alternate',
      loop: 2,
      easing: 'easeOutSine',
    }).complete = () => {
      this.sprite.scale = 1;
    };
  }

  @Server({ sync: true })
  injure(damage: number): void {
    this.health -= damage;
    this.emitInjury();
  }
}

globalThis.anime = anime;
