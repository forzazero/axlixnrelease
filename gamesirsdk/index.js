import { Emitter } from './emitter.js';
import { GamepadApiController } from './transports/gamepadApi.js';
import { T1dBleController } from './transports/t1dBle.js';
import { WebHidController } from './transports/webhid.js';
export { neutralState } from './types.js';
export { DEVICES, identify } from './devices.js';
export { normalizeStandardGamepad, applyDeadzone } from './normalize.js';
export { GamepadApiController } from './transports/gamepadApi.js';
export { T1dBleController, parseT1dFrame, T1D_SERVICE, T1D_CHARACTERISTIC, } from './transports/t1dBle.js';
export { openX2Hid, WebHidController, X2_HID_FILTER, GAMESIR_VENDOR_FILTER, } from './transports/webhid.js';
export { buildReportMaps, describeCollections, parseHidReport, DEFAULT_BUTTON_MAP, } from './hidParser.js';
export { decodeShareCode, encodeShareCode, evpBytesToKey, SHARE_CODE_PREFIX, } from './codec.js';
export { md5 } from './md5.js';
/**
 * Main entry point.
 *
 * ```ts
 * const sdk = new GameSirSDK();
 * sdk.on('connect', (c) => console.log('pad:', c.descriptor?.name ?? c.id));
 * sdk.on('state', (s) => player.move(s.axes.lx, s.axes.ly));
 * sdk.start(); // pads appear after the user presses any button
 * ```
 *
 * The Gamepad API transport works in every engine (including WebKit/WKWebView,
 * where it is the only option). `requestT1d()` adds the BLE-only T1d on
 * Chromium. See RESEARCH.md for the full device/transport matrix.
 */
export class GameSirSDK extends Emitter {
    constructor(options = {}) {
        super();
        this.pads = new Map();
        this.bleControllers = new Set();
        this.hidControllers = new Set();
        this.rafId = null;
        this.running = false;
        this.onConnected = (ev) => this.addPad(ev.gamepad);
        this.onDisconnected = (ev) => {
            const pad = this.pads.get(ev.gamepad.index);
            if (!pad)
                return;
            this.pads.delete(ev.gamepad.index);
            this.emit('disconnect', pad);
        };
        this.poll = () => {
            if (!this.running)
                return;
            const snapshots = navigator.getGamepads();
            for (const [index, pad] of this.pads) {
                const gp = snapshots[index];
                if (!gp)
                    continue;
                const changed = pad.sample(gp, this.shouldSwapFaceButtons(pad), this.options.deadzone);
                if (changed)
                    this.emit('state', pad.state, pad);
            }
            this.rafId = requestAnimationFrame(this.poll);
        };
        this.options = {
            deadzone: options.deadzone ?? 0.08,
            remapNintendoLayout: options.remapNintendoLayout ?? 'auto',
            includeUnknownGamepads: options.includeUnknownGamepads ?? true,
        };
    }
    /** All currently connected controllers across transports. */
    get controllers() {
        return [...this.pads.values(), ...this.bleControllers, ...this.hidControllers];
    }
    /** Begin listening for gamepads and polling their state. */
    start() {
        if (this.running)
            return;
        this.running = true;
        addEventListener('gamepadconnected', this.onConnected);
        addEventListener('gamepaddisconnected', this.onDisconnected);
        // Pick up pads that connected before start() (already-pressed pads are
        // visible in getGamepads() immediately).
        for (const gp of navigator.getGamepads()) {
            if (gp)
                this.addPad(gp);
        }
        this.rafId = requestAnimationFrame(this.poll);
    }
    stop() {
        if (!this.running)
            return;
        this.running = false;
        removeEventListener('gamepadconnected', this.onConnected);
        removeEventListener('gamepaddisconnected', this.onDisconnected);
        if (this.rafId !== null)
            cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }
    /**
     * Connect a GameSir T1d over Web Bluetooth (Chromium only; must be called
     * from a user gesture). The controller joins `controllers` and feeds the
     * same 'state' event stream.
     */
    async requestT1d(opts = {}) {
        const controller = await T1dBleController.request({
            deadzone: opts.deadzone ?? this.options.deadzone,
            pollInterval: opts.pollInterval,
            onState: (state, c) => this.emit('state', state, c),
            onDisconnect: (c) => {
                this.bleControllers.delete(c);
                this.emit('disconnect', c);
            },
        });
        this.bleControllers.add(controller);
        this.emit('connect', controller);
        return controller;
    }
    /**
     * Open a GameSir pad over WebHID (desktop Chromium only; must be called from
     * a user gesture over HTTPS). Parses reports straight off the device's own
     * report descriptor — lower latency than the rAF-paced Gamepad API path.
     * The controller joins `controllers` and feeds the same 'state' stream.
     */
    async requestHid(opts = {}) {
        const controller = await WebHidController.request({
            ...opts,
            deadzone: opts.deadzone ?? this.options.deadzone,
            onState: (state, c) => this.emit('state', state, c),
            onDisconnect: (c) => {
                this.hidControllers.delete(c);
                this.emit('disconnect', c);
            },
        });
        this.hidControllers.add(controller);
        this.emit('connect', controller);
        return controller;
    }
    addPad(gp) {
        if (this.pads.has(gp.index))
            return;
        const pad = new GamepadApiController(gp.index, gp.id);
        if (!pad.descriptor && !this.options.includeUnknownGamepads)
            return;
        this.pads.set(gp.index, pad);
        this.emit('connect', pad);
    }
    shouldSwapFaceButtons(pad) {
        if (!pad.descriptor?.quirks.includes('nintendo-layout'))
            return false;
        const mode = this.options.remapNintendoLayout;
        if (mode !== 'auto')
            return mode;
        // Auto: the raw Switch-style ordering is confirmed on Android (the Magisk
        // fix exists precisely for this). Neither Chromium's gamepad_id_list nor
        // SDL ships any fixup for 05ac:3b06 (verified — RESEARCH.md Q1), so the
        // firmware's order passes through everywhere; still, desktop ordering is
        // unobserved on real hardware, so auto stays Android-only. Capture with
        // demo/verify.html and force `remapNintendoLayout: true` if it leaks.
        return /android/i.test(navigator.userAgent);
    }
}
//# sourceMappingURL=index.js.map