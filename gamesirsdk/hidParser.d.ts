import type { ControllerState, XboxButton } from './types.js';
export interface HidField {
    /** 32-bit WebHID usage: (usagePage << 16) | usageId. */
    usage: number;
    bitOffset: number;
    bitSize: number;
    logicalMin: number;
    logicalMax: number;
}
export interface HidReportMap {
    reportId: number;
    /** Variable (bitmap) buttons, keyed by 1-based Button-page usage id. */
    buttons: HidField[];
    /** Absolute values: axes, triggers, hat. */
    values: HidField[];
}
/** Where a Button-page usage lands in ControllerState. */
export type HidButtonTarget = XboxButton | 'lt' | 'rt';
/**
 * Default 1-based button-usage → Xbox-semantic map, following the W3C
 * standard-mapping order (the layout every capture we have data on follows).
 * Override per device once a real descriptor capture says otherwise.
 */
export declare const DEFAULT_BUTTON_MAP: readonly HidButtonTarget[];
/** Flatten a WebHID collection tree into (reportId → field map) entries. */
export declare function buildReportMaps(collections: readonly HIDCollectionInfo[]): HidReportMap[];
export interface ParseOptions {
    deadzone?: number;
    /** 1-based Button-usage → target map. Default {@link DEFAULT_BUTTON_MAP}. */
    buttonMap?: readonly HidButtonTarget[];
    /** Swap A↔B / X↔Y for 'nintendo-layout' devices. */
    swapFaceButtons?: boolean;
}
/**
 * Decode one input report into Xbox-semantic state.
 *
 * Axis assignment heuristic (matches every HID gamepad layout in our
 * references): X/Y are the left stick; if both Z and Rz exist they are the
 * right stick and Rx/Ry (or Brake/Accelerator) are analog triggers, otherwise
 * Rx/Ry are the right stick.
 */
export declare function parseHidReport(map: HidReportMap, data: DataView, opts?: ParseOptions): ControllerState;
/**
 * Human-readable dump of a device's report descriptor as WebHID parsed it —
 * the in-browser answer to RESEARCH.md Q2's "capture the descriptor" step.
 */
export declare function describeCollections(collections: readonly HIDCollectionInfo[]): string;
