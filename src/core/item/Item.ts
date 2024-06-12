import { Sprite } from 'pixi.js';
import { PixiEntity } from '../entity/PixiEntity';

export abstract class Item extends PixiEntity {
  sprite!: Sprite;
  init(options: {} = {}): void {}

  getSnapshot(): Parameters<this['init']>[0] {
    return;
  }

  startUse(): void {}

  stopUse(): void {}
}
