import { type HidButtonTarget } from '../hidParser.js';
import type { ControllerState, DeviceDescriptor, GameSirController, RumbleOptions } from '../types.js';
/**
 * WebHID transport (desktop Chromium only).
 *
 * The X2 is a genuine HID device (05AC:3B06), so raw input reports are
 * reachable here at full report rate — lower latency than rAF-paced Gamepad
 * API polling. WebHID hands us the parsed report descriptor
 * (`device.collections`), so decoding is descriptor-driven (RESEARCH.md Q2):
 * `WebHidController` maps each report's usages to Xbox-semantic state, and
 * `openX2Hid` remains as the raw capture path for protocol analysis.
 */
export declare const X2_HID_FILTER: {
    vendorId: number;
    productId: number;
};
/** GameSir's own vendor id (newer devices: X2 Pro, X3, G7, T4 Kaleid…). */
export declare const GAMESIR_VENDOR_FILTER: {
    vendorId: number;
};
export interface WebHidOptions {
    deadzone?: number;
    /** Apply the X2 'nintendo-layout' A/B–X/Y swap. Default: per descriptor quirk. */
    swapFaceButtons?: boolean;
    /** Override the 1-based Button-usage → Xbox map (see hidParser.ts). */
    buttonMap?: readonly HidButtonTarget[];
    /** Extra chooser filters, appended to the GameSir defaults. */
    filters?: HIDDeviceFilter[];
    onState?: (state: ControllerState, controller: WebHidController) => void;
    onDisconnect?: (controller: WebHidController) => void;
}
export declare class WebHidController implements GameSirController {
    readonly device: HIDDevice;
    private readonly opts;
    readonly transport: "webhid";
    readonly descriptor: DeviceDescriptor | null;
    state: ControllerState;
    private readonly reportMaps;
    private readonly listener;
    private constructor();
    get id(): string;
    /** The device's report descriptor as WebHID parsed it (Q2 capture aid). */
    get descriptorDump(): string;
    /**
     * Show the HID chooser (user gesture + HTTPS required) and start streaming
     * parsed state. Filters default to the X2 + GameSir vendor ids.
     */
    static request(opts?: WebHidOptions): Promise<WebHidController>;
    private onReport;
    close(): Promise<void>;
    rumble(_opts?: RumbleOptions): Promise<boolean>;
}
export interface RawReport {
    reportId: number;
    data: DataView;
    device: HIDDevice;
}
/**
 * Raw capture path: show the HID chooser and stream unparsed input reports
 * (plus log the parsed descriptor via `describeCollections`). Returns a stop
 * function that closes the device.
 */
export declare function openX2Hid(onReport: (report: RawReport) => void): Promise<() => Promise<void>>;
