import { DEVICES } from '../devices.js';
import { applyDeadzone } from '../normalize.js';
import { neutralState } from '../types.js';
/**
 * GameSir T1d driver over Web Bluetooth.
 *
 * The T1d is not a BLE-HID gamepad — it exposes a custom GATT service, so it is
 * invisible to the Gamepad API and must be driven directly. Protocol reverse-
 * engineered by Diallomm/hack_GamesirT1d and Cubixor/GameSirT1D (RESEARCH.md §2.3).
 */
export const T1D_SERVICE = '00008650-0000-1000-8000-00805f9b34fb';
export const T1D_CHARACTERISTIC = '00008651-0000-1000-8000-00805f9b34fb';
/** Valid state frames start with this little-endian u16 magic. */
const FRAME_MAGIC = 0xc5a1;
/** Frames starting 0xC9 are keep-alive/battery, not state. */
const FRAME_SKIP = 0xc9;
/**
 * Parse a 12-byte T1d state frame. Sticks are 10-bit values bit-packed across
 * bytes 2–6 (0–1023, center 512); triggers are bytes 7–8 (0–255).
 * Returns null for non-state frames.
 */
export function parseT1dFrame(d, deadzone = 0) {
    if (d.length < 12)
        return null;
    if (d[0] === FRAME_SKIP)
        return null;
    if ((d[0] | (d[1] << 8)) !== FRAME_MAGIC)
        return null;
    const s = neutralState();
    const lxRaw = (d[2] << 2) | (d[3] >> 6);
    const lyRaw = ((d[3] & 0x3f) << 4) + (d[4] >> 4);
    const rxRaw = ((d[4] & 0x0f) << 6) | (d[5] >> 2);
    const ryRaw = ((d[5] & 0x03) << 8) + d[6];
    // 0..1023 → -1..1. Orientation verified (RESEARCH.md Q3): the T1d reports
    // up as *decreasing* raw Y (up≈0, center 512, down≈1023) — both Cubixor's
    // and ElishaAz's drivers negate raw Y to feed up-positive XInput APIs — so
    // this linear map already lands on the Gamepad API convention (up = -1).
    const norm = (v) => (v - 512) / 512;
    const [lx, ly] = applyDeadzone(norm(lxRaw), norm(lyRaw), deadzone);
    const [rx, ry] = applyDeadzone(norm(rxRaw), norm(ryRaw), deadzone);
    s.axes = { lx, ly, rx, ry };
    s.triggers.lt = d[7] / 255;
    s.triggers.rt = d[8] / 255;
    const b9 = d[9];
    s.buttons.a = !!(b9 & 0x01);
    s.buttons.b = !!(b9 & 0x02);
    s.buttons.menu = !!(b9 & 0x04);
    s.buttons.x = !!(b9 & 0x08);
    s.buttons.y = !!(b9 & 0x10);
    s.buttons.lb = !!(b9 & 0x40);
    s.buttons.rb = !!(b9 & 0x80);
    const b10 = d[10];
    s.buttons.view = !!(b10 & 0x04); // C1
    s.buttons.ls = !!(b10 & 0x08); // C2 — T1d has no stick clicks; C1/C2 stand in
    s.buttons.home = !!(b10 & 0x10); // power
    const dpad = d[11];
    s.buttons.dpadUp = dpad === 0x01;
    s.buttons.dpadRight = dpad === 0x03;
    s.buttons.dpadDown = dpad === 0x05;
    s.buttons.dpadLeft = dpad === 0x07;
    s.timestamp = typeof performance !== 'undefined' ? performance.now() : 0;
    return s;
}
export class T1dBleController {
    constructor(device, char, opts) {
        this.device = device;
        this.char = char;
        this.opts = opts;
        this.transport = 'web-bluetooth';
        this.state = neutralState();
        this.pollTimer = null;
        this.notifying = false;
        this.descriptor = DEVICES.find((d) => d.device === 't1d');
    }
    get id() {
        return `ble:${this.device.id}`;
    }
    /**
     * Show the browser chooser and connect. Must be called from a user gesture
     * over HTTPS; requires Web Bluetooth (Chromium desktop/Android — not WebKit).
     */
    static async request(opts = {}) {
        const bluetooth = navigator.bluetooth;
        if (!bluetooth)
            throw new Error('Web Bluetooth is not available in this browser');
        const device = await bluetooth.requestDevice({
            filters: [{ namePrefix: 'Gamesir-T1d' }],
            optionalServices: [T1D_SERVICE],
        });
        if (!device.gatt)
            throw new Error('Selected device has no GATT server');
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(T1D_SERVICE);
        const char = await service.getCharacteristic(T1D_CHARACTERISTIC);
        const controller = new T1dBleController(device, char, opts);
        await controller.start();
        return controller;
    }
    async start() {
        this.device.addEventListener('gattserverdisconnected', () => {
            this.stopPolling();
            this.opts.onDisconnect?.(this);
        });
        this.char.addEventListener('characteristicvaluechanged', (ev) => {
            this.notifying = true;
            const view = ev.target.value;
            if (view)
                this.ingest(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
        });
        try {
            await this.char.startNotifications();
        }
        catch {
            // Some stacks reject notifications on this characteristic — fall back to polling.
        }
        // Poll as a safety net; drops out automatically once notifications flow.
        const interval = this.opts.pollInterval ?? 50;
        this.pollTimer = setInterval(() => {
            if (this.notifying) {
                this.stopPolling();
                return;
            }
            this.char
                .readValue()
                .then((view) => this.ingest(new Uint8Array(view.buffer, view.byteOffset, view.byteLength)))
                .catch(() => {
                /* transient read failure; disconnect event handles the fatal case */
            });
        }, interval);
    }
    ingest(bytes) {
        const state = parseT1dFrame(bytes, this.opts.deadzone ?? 0);
        if (!state)
            return;
        this.state = state;
        this.opts.onState?.(state, this);
    }
    stopPolling() {
        if (this.pollTimer !== null) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    disconnect() {
        this.stopPolling();
        this.device.gatt?.disconnect();
    }
    async rumble(_opts) {
        return false; // T1d has no rumble
    }
}
//# sourceMappingURL=t1dBle.js.map