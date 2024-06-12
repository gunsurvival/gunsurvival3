import { AsyncEE, MapSchema, Schema, Server, type } from "multiplayer-world";
import { Item } from "../item/Item";

export class Backpack extends Schema {
  declare ee: AsyncEE<{
    add: (item: Item) => void;
    remove: (item: Item) => void;
    "*": () => void;
  }>;
  @type({ map: Item }) items = new MapSchema<Item>();
  arr = new Array<Item>();

  @Server({ sync: true })
  add(entityId: number): void {
    const item = this.world.entities.get(entityId);
    if (item instanceof Item) {
      this.arr.push(item);
      this.items.set(entityId, item);
      this.ee.emit("add", item); // TODO: không tự emit như này, nó nên được emit tự động từ chỗ khác
    }
  }

  @Server({ sync: true })
  remove(entityId: number): void {
    const item = this.items.get(entityId);
    if (item instanceof Item) {
      this.items.delete(entityId);

      const index = this.arr.indexOf(item);
      if (index !== -1) {
        this.arr.splice(index, 1);
        this.ee.emit("remove", item);
      }
    }
  }

  index(index: number) {
    return this.arr[index];
  }

  getById(id: string) {
    return this.items.get(id);
  }
}
