import { Server } from "multiplayer-world";
import { Gunner } from "./Gunner";

export class GunnerBot extends Gunner {
  targetAngle = 0;

  nextTick(delta: number) {
    if (this.world.frameCount % Math.floor(Math.random() * 100 + 100) === 0) {
      this.randomTargetAngle();
    }
    this.updateVelocity();
    this.updateDisplay(delta);
  }

  @Server()
  randomTargetAngle() {
    this.targetAngle = Math.random() * Math.PI * 2;
    this.rotation = this.targetAngle;
    this.world.addEntity("Bullet", {
      pos: {
        x: this.pos.x + Math.cos(this.rotation) * 70,
        y: this.pos.y + Math.sin(this.rotation) * 70,
      },
      vel: {
        x: Math.cos(this.rotation) * 40,
        y: Math.sin(this.rotation) * 40,
      },
      rotation: this.rotation,
    });
  }

  @Server()
  updateVelocity() {
    this.vel.x = Math.cos(this.targetAngle) * 2;
    this.vel.y = Math.sin(this.targetAngle) * 2;
  }
}
