import type { DeviceDescriptor } from './types.js';
/**
 * Known GameSir identities. One physical product can appear under several
 * identities depending on connection mode and firmware (see RESEARCH.md §2.5),
 * so this is a flat match table, not one entry per product.
 *
 * Sources for the VID/PID rows (all verified, see RESEARCH.md §3):
 * Linux xpad.c (GameSir vendor 0x3537), SDL_GameControllerDB + SDL's built-in
 * DB, xpadneo docs, linux-hardware.org. GameSir's own USB VID is 0x3537
 * ("Guangzhou Chicken Run Network Technology", their legal name); older
 * devices spoof Apple's 0x05ac or use OEM VIDs (0x20bc, 0x8585, 0x1949).
 *
 * Not in this table on purpose: modern GameSir pads in Bluetooth Xbox mode
 * clone the real Xbox Wireless Controller (045e:02e0, randomized MAC) and are
 * indistinguishable from one by ID — they normalize fine through the standard
 * mapping, so we let them surface as unknown/standard pads.
 *
 * Order matters: `identify` name-matching returns the first hit, so put more
 * specific patterns (x2s, x2 pro) before general ones (x2).
 */
export declare const DEVICES: DeviceDescriptor[];
/** Match a Gamepad API id string (or BLE/HID device name) to a known descriptor. */
export declare function identify(id: string): DeviceDescriptor | null;
