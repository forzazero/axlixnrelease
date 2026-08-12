import type { ControllerState, DeviceDescriptor, GameSirController, RumbleOptions } from '../types.js';
/**
 * GameSir T1d driver over Web Bluetooth.
 *
 * The T1d is not a BLE-HID gamepad — it exposes a custom GATT service, so it is
 * invisible to the Gamepad API and must be driven directly. Protocol reverse-
 * engineered by Diallomm/hack_GamesirT1d and Cubixor/GameSirT1D (RESEARCH.md §2.3).
 */
export declare const T1D_SERVICE = "00008650-0000-1000-8000-00805f9b34fb";
export declare const T1D_CHARACTERISTIC = "00008651-0000-1000-8000-00805f9b34fb";
/**
 * Parse a 12-byte T1d state frame. Sticks are 10-bit values bit-packed across
 * bytes 2–6 (0–1023, center 512); triggers are bytes 7–8 (0–255).
 * Returns null for non-state frames.
 */
export declare function parseT1dFrame(d: Uint8Array, deadzone?: number): ControllerState | null;
export interface T1dOptions {
    deadzone?: number;
    /** Polling interval (ms) used if notifications don't deliver. Default 50 (20 Hz). */
    pollInterval?: number;
    onState?: (state: ControllerState, controller: T1dBleController) => void;
    onDisconnect?: (controller: T1dBleController) => void;
}
export declare class T1dBleController implements GameSirController {
    private readonly device;
    private readonly char;
    private readonly opts;
    readonly transport: "web-bluetooth";
    readonly descriptor: DeviceDescriptor;
    state: ControllerState;
    private pollTimer;
    private notifying;
    private constructor();
    get id(): string;
    /**
     * Show the browser chooser and connect. Must be called from a user gesture
     * over HTTPS; requires Web Bluetooth (Chromium desktop/Android — not WebKit).
     */
    static request(opts?: T1dOptions): Promise<T1dBleController>;
    private start;
    private ingest;
    private stopPolling;
    disconnect(): void;
    rumble(_opts?: RumbleOptions): Promise<boolean>;
}
