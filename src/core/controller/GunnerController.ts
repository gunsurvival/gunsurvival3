
import { AsyncEE, Controller, ServerController } from "multiplayer-world";
import { Gunner } from "../entity/Gunner";
import { createHealthBar } from "../graphics/createHealthBar";
import { createSlotBar } from "../graphics/createSlotBar";
import { lerpAngle } from "../utils/common";
import type { PixiWorld } from "../world/PixiWorld"

export class GunnerController extends ServerController<Gunner> {
  // TODO: refactor this to use generic ServerController
  get pixiWorld() {
    return this.world as PixiWorld;
  }

  speed = 0.5;
  state = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    dash: false,
    walk: false,
  };
  mouse = {
    x: 0,
    y: 0,
  };
  ee = new AsyncEE<{
    "state-add": (key: keyof GunnerController["state"]) => void;
    "state-remove": (key: keyof GunnerController["state"]) => void;
    "*": () => void;
  }>();

  setupClient() {
    console.log("Setting up client");
    if (this.pixiWorld?.camera) {
      this.pixiWorld.camera.follow(this.target.pos);
    }
    const healthBar = createHealthBar({
      width: 300,
      height: 25,
      borderWeight: 4,
      round: 6,
    });
    healthBar.container.x = this.pixiWorld.app.screen.width / 2;
    healthBar.container.y =
      this.pixiWorld.app.screen.height - healthBar.container.height - 100;
    healthBar.container.pivot.x = healthBar.container.width / 2;
    healthBar.container.pivot.y = healthBar.container.height / 2;
    this.pixiWorld.app.stage.addChild(healthBar.container);

    const slotBar = createSlotBar({
      amount: 5,
    });
    slotBar.container.x = this.pixiWorld.app.screen.width / 2;
    slotBar.container.y =
      this.pixiWorld.app.screen.height - slotBar.container.height;
    slotBar.container.pivot.x = slotBar.container.width / 2;
    slotBar.container.pivot.y = slotBar.container.height / 2;
    this.pixiWorld.app.stage.addChild(slotBar.container);

    this.target.backpack.ee.addListener("add", (item) => {
      console.log("Adding item to slot");
      slotBar.add(item);
    });

    this.pixiWorld.app.ticker.add(() => {
      healthBar.setHealth(this.target.health / 100);
      healthBar.update();
    });

    const handleKeydown = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      if (lowerKey === "w") {
        this.enable("up");
      }
      if (lowerKey === "s") {
        this.enable("down");
      }
      if (lowerKey === "a") {
        this.enable("left");
      }
      if (lowerKey === "d") {
        this.enable("right");
      }
      if (lowerKey === " ") {
        this.enable("dash");
      }
      if (lowerKey === "shift") {
        this.enable("walk");
      }
    };
    const handleKeyup = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      if (lowerKey === "w") {
        this.disable("up");
      }
      if (lowerKey === "s") {
        this.disable("down");
      }
      if (lowerKey === "a") {
        this.disable("left");
      }
      if (lowerKey === "d") {
        this.disable("right");
      }
      if (lowerKey === " ") {
        this.disable("dash");
      }
      if (lowerKey === "shift") {
        this.disable("walk");
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      this.enable("shoot");
    };
    const handleMouseUp = (e: MouseEvent) => {
      this.disable("shoot");
    };

    this.ee.addListener("state-add", (key) => {
      this.onStateAdd(key);
    });

    this.ee.addListener("state-remove", (key) => {
      this.onStateRemove(key);
    });

    setInterval(() => {
      const targetScreenPos = this.pixiWorld.viewport.toScreen(this.target.pos);
      // console.log("targetScreenPos", targetScreenPos)
      // console.log("this.mouse", this.mouse)
      this.rotateTarget(
        Math.atan2(
          this.mouse.y - targetScreenPos.y,
          this.mouse.x - targetScreenPos.x,
        ),
      );
    }, 1000 / 10);

    this.pixiWorld.app.stage.eventMode = "static";
    this.pixiWorld.app.stage.hitArea = this.pixiWorld.app.screen;
    this.pixiWorld.app.stage.addEventListener("pointermove", (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);
    this.pixiWorld.app.canvas.addEventListener("mousedown", handleMouseDown);
    this.pixiWorld.app.canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      // this.pixiWorld.app.canvas.removeEventListener("keydown", handleKeydown)
      // this.pixiWorld.app.canvas.removeEventListener("keyup", handleKeyup)
      // this.pixiWorld.app.canvas.removeEventListener(
      // 	"mousedown",
      // 	handleMouseDown
      // )
    };
  }

  enable(key: keyof typeof this.state) {
    if (!this.state[key]) {
      this.setState(key, true);
      this.ee.emit("state-add", key);
    }
  }

  disable(key: keyof typeof this.state) {
    if (this.state[key]) {
      this.setState(key, false);
      this.ee.emit("state-remove", key);
    }
  }

  @Controller({ serverOnly: true })
  rotateTarget(rotation: number) {
    this.target.rotation = rotation;
  }

  @Controller()
  setState(key: keyof typeof this.state & string, value: boolean) {
    // if (value) {
    // 	console.log("Enabling", key)
    // } else {
    // 	console.log("Disabling", key)
    // }
    this.state[key] = value;
  }

  nextTick() {
    if (this.target) {
      const speed = this.state.walk ? this.speed / 2 : this.speed;
      if (this.state.up) {
        this.target.vel.y -= speed;
      }
      if (this.state.down) {
        this.target.vel.y += speed;
      }
      if (this.state.left) {
        this.target.vel.x -= speed;
      }
      if (this.state.right) {
        this.target.vel.x += speed;
      }

      if (this.isClient) {
        const targetScreenPos = this.pixiWorld.viewport.toScreen(
          this.target.pos,
        );
        this.target.rotation = lerpAngle(
          this.target.rotation,
          Math.atan2(
            this.mouse.y - targetScreenPos.y,
            this.mouse.x - targetScreenPos.x,
          ),
          0.3,
        );
      }
    }
  }

  @Controller()
  onStateAdd(key: keyof GunnerController["state"]) {
    if (key === "dash") {
      const moveVec = {
        x: (this.state.right ? 1 : 0) - (this.state.left ? 1 : 0),
        y: (this.state.down ? 1 : 0) - (this.state.up ? 1 : 0),
      };
      this.target.vel.x += moveVec.x * 10;
      this.target.vel.y += moveVec.y * 10;
    }

    if (key === "shoot") {
      this.target.startUse();
    }
  }

  @Controller()
  onStateRemove(key: keyof GunnerController["state"]) {
    if (key === "shoot") {
      this.target.stopUse();
    }
  }
}
