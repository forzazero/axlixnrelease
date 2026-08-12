import { neutralState } from './types.js';
import { applyDeadzone } from './normalize.js';
/**
 * Generic HID gamepad report parser driven by the device's own report
 * descriptor, which WebHID exposes pre-parsed as `HIDDevice.collections`
 * (RESEARCH.md Q2). Instead of hardcoding a captured byte layout, we walk the
 * descriptor's input-report items, note where each usage lives (bit offset,
 * size, logical range), and decode live reports against that map.
 *
 * Pure logic — no WebHID objects — so it is unit-testable and reusable for
 * offline analysis of captured descriptors.
 */
// Usage pages / usages we understand.
const PAGE_GENERIC_DESKTOP = 0x01;
const PAGE_SIMULATION = 0x02;
const PAGE_BUTTON = 0x09;
const USAGE_X = 0x30;
const USAGE_Y = 0x31;
const USAGE_Z = 0x32;
const USAGE_RX = 0x33;
const USAGE_RY = 0x34;
const USAGE_RZ = 0x35;
const USAGE_HAT = 0x39;
const USAGE_ACCELERATOR = 0xc4;
const USAGE_BRAKE = 0xc5;
/**
 * Default 1-based button-usage → Xbox-semantic map, following the W3C
 * standard-mapping order (the layout every capture we have data on follows).
 * Override per device once a real descriptor capture says otherwise.
 */
export const DEFAULT_BUTTON_MAP = [
    'a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'view', 'menu', 'ls', 'rs', 'home',
];
/** Flatten a WebHID collection tree into (reportId → field map) entries. */
export function buildReportMaps(collections) {
    const maps = new Map();
    const visit = (col) => {
        for (const report of col.inputReports ?? []) {
            const id = report.reportId ?? 0;
            let map = maps.get(id);
            if (!map) {
                map = { reportId: id, buttons: [], values: [] };
                maps.set(id, map);
            }
            let bit = 0;
            for (const item of report.items ?? []) {
                const size = item.reportSize ?? 0;
                const count = item.reportCount ?? 0;
                const total = size * count;
                // Constant items are padding; array items (keyboard-style selectors)
                // don't occur on the pads we target — skip both but keep the offset.
                if (item.isConstant || item.isArray) {
                    bit += total;
                    continue;
                }
                for (let i = 0; i < count; i++) {
                    const usage = item.isRange
                        ? (item.usageMinimum ?? 0) + i
                        : (item.usages?.[i] ?? item.usages?.[item.usages.length - 1] ?? 0);
                    const field = {
                        usage,
                        bitOffset: bit + i * size,
                        bitSize: size,
                        logicalMin: item.logicalMinimum ?? 0,
                        logicalMax: item.logicalMaximum ?? (size >= 32 ? 0xffffffff : (1 << size) - 1),
                    };
                    const page = usage >>> 16;
                    if (page === PAGE_BUTTON)
                        map.buttons.push(field);
                    else if (page === PAGE_GENERIC_DESKTOP || page === PAGE_SIMULATION)
                        map.values.push(field);
                }
                bit += total;
            }
        }
        for (const child of col.children ?? [])
            visit(child);
    };
    for (const col of collections)
        visit(col);
    return [...maps.values()];
}
/** HID fields are packed LSB-first; read `bitCount` bits at `bitOffset`. */
function readBits(data, bitOffset, bitCount) {
    let result = 0;
    for (let i = 0; i < bitCount; i++) {
        const bit = bitOffset + i;
        const byteIndex = bit >> 3;
        if (byteIndex >= data.byteLength)
            break;
        result |= ((data.getUint8(byteIndex) >> (bit & 7)) & 1) << i;
    }
    return result >>> 0;
}
function readField(data, f) {
    let raw = readBits(data, f.bitOffset, f.bitSize);
    if (f.logicalMin < 0 && f.bitSize < 32) {
        // Sign-extend two's-complement fields.
        const signBit = 1 << (f.bitSize - 1);
        if (raw & signBit)
            raw -= 1 << f.bitSize;
    }
    return raw;
}
/** Scale a raw absolute value to 0..1 over its logical range. */
function scale01(raw, f) {
    const range = f.logicalMax - f.logicalMin;
    if (range <= 0)
        return 0;
    return Math.min(1, Math.max(0, (raw - f.logicalMin) / range));
}
const FACE_SWAP = {
    a: 'b', b: 'a', x: 'y', y: 'x',
};
/**
 * Decode one input report into Xbox-semantic state.
 *
 * Axis assignment heuristic (matches every HID gamepad layout in our
 * references): X/Y are the left stick; if both Z and Rz exist they are the
 * right stick and Rx/Ry (or Brake/Accelerator) are analog triggers, otherwise
 * Rx/Ry are the right stick.
 */
export function parseHidReport(map, data, opts = {}) {
    const s = neutralState();
    const values = new Map();
    for (const f of map.values)
        values.set(f.usage, { raw: readField(data, f), f });
    const gd = (id) => values.get((PAGE_GENERIC_DESKTOP << 16) | id);
    const sim = (id) => values.get((PAGE_SIMULATION << 16) | id);
    const axis = (v) => v ? scale01(v.raw, v.f) * 2 - 1 : 0;
    const z = gd(USAGE_Z);
    const rz = gd(USAGE_RZ);
    const rx = gd(USAGE_RX);
    const ry = gd(USAGE_RY);
    const rightIsZRz = z !== undefined && rz !== undefined;
    const lxRaw = axis(gd(USAGE_X));
    const lyRaw = axis(gd(USAGE_Y));
    const rxRaw = axis(rightIsZRz ? z : rx);
    const ryRaw = axis(rightIsZRz ? rz : ry);
    const deadzone = opts.deadzone ?? 0;
    const [lx, ly] = applyDeadzone(lxRaw, lyRaw, deadzone);
    const [rxD, ryD] = applyDeadzone(rxRaw, ryRaw, deadzone);
    s.axes = { lx, ly, rx: rxD, ry: ryD };
    const brake = sim(USAGE_BRAKE) ?? (rightIsZRz ? rx : undefined);
    const accel = sim(USAGE_ACCELERATOR) ?? (rightIsZRz ? ry : undefined);
    if (brake)
        s.triggers.lt = scale01(brake.raw, brake.f);
    if (accel)
        s.triggers.rt = scale01(accel.raw, accel.f);
    const hat = gd(USAGE_HAT);
    if (hat) {
        const dir = hat.raw - hat.f.logicalMin; // 0=N, clockwise; out of range = released
        if (dir >= 0 && dir <= 7) {
            s.buttons.dpadUp = dir === 7 || dir === 0 || dir === 1;
            s.buttons.dpadRight = dir >= 1 && dir <= 3;
            s.buttons.dpadDown = dir >= 3 && dir <= 5;
            s.buttons.dpadLeft = dir >= 5 && dir <= 7;
        }
    }
    const buttonMap = opts.buttonMap ?? DEFAULT_BUTTON_MAP;
    for (const f of map.buttons) {
        const usageId = f.usage & 0xffff; // 1-based
        let target = buttonMap[usageId - 1];
        if (!target)
            continue;
        if (opts.swapFaceButtons)
            target = FACE_SWAP[target] ?? target;
        const pressed = readField(data, f) !== 0;
        if (!pressed)
            continue;
        if (target === 'lt')
            s.triggers.lt = Math.max(s.triggers.lt, 1);
        else if (target === 'rt')
            s.triggers.rt = Math.max(s.triggers.rt, 1);
        else
            s.buttons[target] = true;
    }
    s.timestamp = typeof performance !== 'undefined' ? performance.now() : 0;
    return s;
}
/**
 * Human-readable dump of a device's report descriptor as WebHID parsed it —
 * the in-browser answer to RESEARCH.md Q2's "capture the descriptor" step.
 */
export function describeCollections(collections) {
    const lines = [];
    const hex = (n) => `0x${(n ?? 0).toString(16).padStart(2, '0')}`;
    const walk = (col, depth) => {
        const pad = '  '.repeat(depth);
        lines.push(`${pad}collection usagePage=${hex(col.usagePage)} usage=${hex(col.usage)}`);
        for (const [kind, reports] of [
            ['input', col.inputReports],
            ['output', col.outputReports],
            ['feature', col.featureReports],
        ]) {
            for (const report of reports ?? []) {
                lines.push(`${pad}  ${kind} report ${report.reportId ?? 0}:`);
                let bit = 0;
                for (const item of report.items ?? []) {
                    const size = item.reportSize ?? 0;
                    const count = item.reportCount ?? 0;
                    const usages = item.isRange
                        ? `usages ${hex(item.usageMinimum)}..${hex(item.usageMaximum)}`
                        : `usages [${(item.usages ?? []).map((u) => hex(u)).join(', ')}]`;
                    const flags = [
                        item.isConstant ? 'const' : null,
                        item.isArray ? 'array' : null,
                    ].filter(Boolean).join(' ');
                    lines.push(`${pad}    @bit ${bit}: ${count}×${size}b ${usages} ` +
                        `logical ${item.logicalMinimum ?? 0}..${item.logicalMaximum ?? 0}${flags ? ` (${flags})` : ''}`);
                    bit += size * count;
                }
            }
        }
        for (const child of col.children ?? [])
            walk(child, depth + 1);
    };
    for (const col of collections)
        walk(col, 0);
    return lines.join('\n');
}
//# sourceMappingURL=hidParser.js.map