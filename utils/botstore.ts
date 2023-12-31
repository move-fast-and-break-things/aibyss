import EventEmitter from 'node:events';

interface Bot {
  id: string;
  code: string;
}

export type Bots = Record<string, Bot>;

let STORE: Bots = {};

const botEventEmitter = new EventEmitter();

export function submitBot(code: string) {
  const id = Math.random().toString(36).substring(5);
  STORE[id] = { id, code };
  botEventEmitter.emit('update', STORE);
}

export function clearBots() {
  STORE = {};
}

export function getBots() {
  return { ...STORE };
}

export function subscribeToBotsUpdate(onUpdate: (bots: Bots) => void): () => void {
  botEventEmitter.on('update', onUpdate);
  return () => botEventEmitter.off('update', onUpdate);
}
