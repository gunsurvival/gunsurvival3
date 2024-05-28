import {Room} from '@colyseus/core';
import {Room as RoomClient} from 'colyseus.js';

import {Schema} from './schema/Schema';
import {
	addWorldRecursive, pairClientServer, waitFor,
} from './utils';

export class World extends Schema {
	__holderMap = new Map<string, Schema>();
	isServer = false;
	isClient = false;
	room?: Room;

	isServerOnly(): this is {room: Room} {
		return this.isServer && !this.isClient;
	}

	isClientOnly(): this is {room: undefined} {
		return !this.isServer && this.isClient;
	}

	isBoth(): this is {room: undefined} {
		return this.isServer && this.isClient;
	}

	constructor({mode, room}: WorldOptions) {
		super();
		if (mode === 'server') {
			this.isServer = true;
			this.isClient = false;
			this.room = room;
			if (!room) {
				throw new Error('Room is required for server mode!');
			}
		} else if (mode === 'client') {
			this.isServer = false;
			this.isClient = true;
			if (room) {
				throw new Error('Do not pass "room" in client mode!');
			}
		} else if (mode === 'both') {
			this.isServer = true;
			this.isClient = true;
			if (room) {
				throw new Error('Do not pass "room" in mode "both"!');
			}
		} else {
			throw new Error('Invalid mode!');
		}
	}

	initialize() {
		addWorldRecursive(this, this);
	}

	setupRPC(room: RoomClient) {
		room.onStateChange.once(state => {
			pairClientServer(this, room.state, this.__holderMap);

			const a = () => Boolean();
			type q = ReturnType<typeof a>

			room.onMessage<RPCRequest>('rpc', async message => {
				try {
					await waitFor(() => this.__holderMap.has(message.id), {
						waitForWhat: `holderMap has ${message.id}`,
						timeoutMs: 5000,
						immediate: true,
					});
					const holder = this.__holderMap.get(message.id);
					const method = holder?.serverHandlers.get(message.method);
					if (method) {
						// console.log(`CLIENT: Invoking ${message.method} with args:`, message.args);
						holder?.eventHandlers.get(message.method)?.forEach(handler => handler.bind(holder)(...message.args));
						method.bind(holder)(...message.args);
					}
				} catch (error) {
					console.error('RPC error:', error);
				}
			});
		});
	}
}

type WorldOptions = {
	mode: 'server';
	room: Room;
} | {
	mode: 'client' | 'both';
	room?: undefined;
}

export type RPCRequest = {
	id: string;
	method: string;
	args: any[];
}
