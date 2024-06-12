import { Assets, Container, Sprite } from 'pixi.js';
import { PixiEntity } from './PixiEntity';
// import { createHealthBar } from "../graphics/createMobHealthBar"
import { Circle } from 'detect-collisions';
import { Mob } from './Mob';

export class Spider extends Mob {
  body = new Circle({ x: 0, y: 0 }, 50);
  display!: Container;
  sprite!: Sprite;

  async prepare(options: Parameters<PixiEntity['init']>[0]): Promise<void> {
    this.display = new Container();

    // spider sprite
    this.sprite = new Sprite(await Assets.load('images/Spider.png'));
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.width = 280;
    this.sprite.height = 280;
    this.display.addChild(this.sprite);
    super.prepare(options);
  }
}
