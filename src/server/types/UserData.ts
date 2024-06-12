import type { ServerController } from 'multiplayer-world';

export type UserData = {
  controllers: Map<number, ServerController>;
};
