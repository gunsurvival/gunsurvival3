import { Circle } from 'detect-collisions';
import debounce from 'lodash/debounce';
import { Server, type, type SerializedResponse } from 'multiplayer-world';
import { Assets, Sprite } from 'pixi.js';
import { getZIndexByName } from '../settings';
import { lerpAngle } from '../utils/common';
import { Gunner } from './Gunner';
import { PixiEntity } from './PixiEntity';

enum LOUDNESS {
  QUIET,
  NOISE,
  LOUD,
}

export class Bush extends PixiEntity {
  declare display: Sprite;
  @type('number') loudness: number = LOUDNESS.QUIET;

  body = new Circle({ x: 0, y: 0 }, 100);
  frameStartShake = 0;
  __loudness: LOUDNESS = LOUDNESS.QUIET;

  async prepare(options: Parameters<this['init']>[0] = {}): Promise<void> {
    this.display = new Sprite(await Assets.load('images/Bush.png'));
    this.display.width = 200;
    this.display.height = 200;
    this.display.anchor.x = 0.5;
    this.display.anchor.y = 0.5;
    super.prepare(options);

    if (options.pos)
      for (let i = 0; i < Math.random() * 4; i++) {
        const leaf1 = new Sprite(await Assets.load('images/leaf1.png'));
        const leaf2 = new Sprite(await Assets.load('images/leaf2.png'));
        leaf1.zIndex = getZIndexByName('background');
        leaf2.zIndex = getZIndexByName('background');
        const wide = 300;
        leaf1.x = options.pos.x + Math.random() * wide - wide / 2;
        leaf1.y = options.pos.y + Math.random() * wide - wide / 2;
        leaf2.x = options.pos.x + Math.random() * wide - wide / 2;
        leaf2.y = options.pos.y + Math.random() * wide - wide / 2;
        this.world.viewport.addChild(leaf1);
        this.world.viewport.addChild(leaf2);
      }
  }

  nextTick(delta: number) {
    if (this.isClient) {
      // shaking the tree
      let intensity = 0.1;
      if (this.loudness === LOUDNESS.QUIET) {
        intensity = 0;
      } else if (this.loudness === LOUDNESS.LOUD) {
        intensity = 0.2;
      } else if (this.loudness === LOUDNESS.NOISE) {
        intensity = 0.05;
      }
      let targetRotation =
        Math.sin((this.world.frameCount - this.frameStartShake) / 10) *
        intensity;
      this.rotation = lerpAngle(this.rotation, targetRotation, 0.1);
    }

    this.__loudness = LOUDNESS.QUIET;
    this.updateDisplay(delta);
  }

  finalizeTick(deltaTime: number): void {
    this.setLoudness(this.__loudness);
  }

  reconcileServerState(serverState: this): void {
    // super.reconcileServerState(serverState)
    if (
      this.loudness !== serverState.loudness &&
      serverState.loudness >= LOUDNESS.NOISE
    ) {
      this.frameStartShake = this.world.frameCount - 5;
    }
    this.loudness = serverState.loudness;
  }

  // @Server()
  // onCollisionEnter(otherId: number, response: SerializedResponse): void {
  // 	// @ts-ignore
  // 	const other = this.world.entities.get(otherId)

  // 	if (this.isClient) {

  // 		// this.lastEnterTime = this.world.frameCount
  // 	}
  // }

  onCollisionStay(otherId: number, response: SerializedResponse): void {
    // @ts-ignore
    const other = this.world.entities.get(otherId);

    if (other) {
      if (other.vel.len() > 4) {
        this.__loudness = Math.max(this.__loudness, LOUDNESS.LOUD);
      } else if (other.vel.len() > 2) {
        this.__loudness = Math.max(this.__loudness, LOUDNESS.NOISE);
      }

      if (other instanceof Gunner) {
        if (this.isClient && other.isControlling) {
          this.display.alpha = 0.5;
          this.normalBush();
        }
      }
    }
  }

  @Server()
  onCollisionExit(otherId: number, response: SerializedResponse): void {
    // @ts-ignore
    const other = this.world.entities.get(otherId);
    if (other instanceof Gunner && this.isClient && other.isControlling) {
      // this.display.alpha = 1
    }
  }

  @Server()
  setLoudness(loudness: LOUDNESS) {
    // console.log("loudless", this._loudness)
    if (this.loudness !== loudness) {
      this.loudness = loudness;
    }
  }

  normalBush = debounce(() => {
    this.display.alpha = 1;
  }, 100);
}
