import { Emitter } from './emitter.js';
import { T1dBleController, type T1dOptions } from './transports/t1dBle.js';
import { WebHidController, type WebHidOptions } from './transports/webhid.js';
import type { GameSirController, SdkEvents, SdkOptions } from './types.js';
export type { ControllerState, DeviceDescriptor, GameSirController, Quirk, RumbleOptions, SdkEvents, SdkOptions, TransportKind, XboxButton, } from './types.js';
export { neutralState } from './types.js';
export { DEVICES, identify } from './devices.js';
export { normalizeStandardGamepad, applyDeadzone } from './normalize.js';
export { GamepadApiController } from './transports/gamepadApi.js';
export { T1dBleController, parseT1dFrame, T1D_SERVICE, T1D_CHARACTERISTIC, } from './transports/t1dBle.js';
export { openX2Hid, WebHidController, X2_HID_FILTER, GAMESIR_VENDOR_FILTER, type WebHidOptions, } from './transports/webhid.js';
export { buildReportMaps, describeCollections, parseHidReport, DEFAULT_BUTTON_MAP, type HidButtonTarget, type HidField, type HidReportMap, } from './hidParser.js';
export { decodeShareCode, encodeShareCode, evpBytesToKey, SHARE_CODE_PREFIX, type ConnectProfile, } from './codec.js';
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
export declare class GameSirSDK extends Emitter<SdkEvents> {
    private readonly options;
    private pads;
    private bleControllers;
    private hidControllers;
    private rafId;
    private running;
    constructor(options?: SdkOptions);
    /** All currently connected controllers across transports. */
    get controllers(): GameSirController[];
    /** Begin listening for gamepads and polling their state. */
    start(): void;
    stop(): void;
    /**
     * Connect a GameSir T1d over Web Bluetooth (Chromium only; must be called
     * from a user gesture). The controller joins `controllers` and feeds the
     * same 'state' event stream.
     */
    requestT1d(opts?: Omit<T1dOptions, 'onState' | 'onDisconnect'>): Promise<T1dBleController>;
    /**
     * Open a GameSir pad over WebHID (desktop Chromium only; must be called from
     * a user gesture over HTTPS). Parses reports straight off the device's own
     * report descriptor — lower latency than the rAF-paced Gamepad API path.
     * The controller joins `controllers` and feeds the same 'state' stream.
     */
    requestHid(opts?: Omit<WebHidOptions, 'onState' | 'onDisconnect'>): Promise<WebHidController>;
    private onConnected;
    private onDisconnected;
    private addPad;
    private shouldSwapFaceButtons;
    private poll;
}
