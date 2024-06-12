import { Server, type } from "multiplayer-world";
import { Assets, Sprite } from "pixi.js";
import { Gunner } from "../entity";
import { Gun } from "./Gun";

export class Ak47 extends Gun {
  display: undefined;
  @type("uint32") holderId = 0;

  sprite!: Sprite;
  frameStartFire = 0;
  isFiring = false;

  async prepare(options: Parameters<this["init"]>[0]): Promise<void> {
    this.sprite = new Sprite(await Assets.load("images/ak47.png"));
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.width = 160;
    this.sprite.height = 40;
  }

  init(
    options: Partial<{
      holderId: number;
    }>,
  ): void {
    this.holderId = options.holderId ?? 0;
  }

  getSnapshot(): Parameters<Ak47["init"]>[0] {
    return {
      holderId: this.holderId,
    };
  }

  nextTick(deltaTime: number): void {
    if (this.isFiring) {
      this.hookShoot();
    }
  }

  @Server()
  startUse(): void {
    this.isFiring = true;
    this.hookShoot();
  }

  @Server()
  stopUse(): void {
    this.isFiring = false;
    this.frameStartFire = this.world.frameCount;
  }

  @Server()
  hookShoot() {
    const holder = this.world.entities.get(this.holderId) as Gunner;
    if (!holder) return;

    if (this.world.frameCount - this.frameStartFire > 8) {
      const angle = holder.rotation;
      this.frameStartFire = this.world.frameCount;
      this.world.addEntity("Bullet", {
        pos: {
          x: holder.pos.x + holder.vel.x + Math.cos(angle) * 60,
          y: holder.pos.y + holder.vel.y + Math.sin(angle) * 60,
        },
        vel: {
          x: holder.vel.x + Math.cos(angle) * 60,
          y: holder.vel.y + Math.sin(angle) * 60,
        },
        rotation: angle,
      });
    }
  }
}
