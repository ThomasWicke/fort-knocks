// The phone's side of an online room: a WebSocket (PartySocket reconnects by itself) that says hello on every
// (re)open, so a dropped connection or a reload gets the same seat back.
import PartySocket from 'partysocket';
import type { C2S, S2C } from '../../party/protocol';

/** A random id kept on this device, so the room recognises the phone when it comes back. */
export function playerId(): string {
  // ?as=<name> is a second player in another tab of the same browser (tests), which otherwise share the device's id
  const key = `fk-player${new URLSearchParams(location.search).get('as') ?? ''}`;
  try {
    let id = localStorage.getItem(key);
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem(key, id); }
    return id;
  } catch { return (sessionId ??= Math.random().toString(36).slice(2, 10)); }
}
let sessionId: string | undefined;

/** Four letters that can't be mixed up when read aloud or typed (no I, O, Q). */
export function newCode(): string {
  const a = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  return Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join('');
}

export class RoomConn {
  private socket: PartySocket;
  private queue: C2S[] = [];
  open = false;

  constructor(public code: string, onMsg: (m: S2C) => void, onStatus: (open: boolean) => void, hello: () => C2S) {
    this.socket = new PartySocket({ host: location.host, party: 'rooms', room: code });
    this.socket.addEventListener('open', () => {
      this.open = true; onStatus(true);
      this.socket.send(JSON.stringify(hello()));
      const q = this.queue; this.queue = [];
      for (const m of q) this.send(m);
    });
    this.socket.addEventListener('close', () => { this.open = false; onStatus(false); });
    this.socket.addEventListener('message', e => { try { onMsg(JSON.parse(e.data as string) as S2C); } catch { /* not ours */ } });
  }

  /** Snapshots are a live picture: dropped while offline. Everything else waits for the connection. */
  send(m: C2S): void {
    if (!this.open) { if (m.t !== 'snap' && this.queue.length < 40) this.queue.push(m); return; }
    this.socket.send(JSON.stringify(m));
  }
  close(): void { this.socket.close(); }
}
