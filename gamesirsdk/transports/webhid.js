import { identify } from '../devices.js';
import { buildReportMaps, describeCollections, parseHidReport, } from '../hidParser.js';
import { statesEqual } from '../normalize.js';
import { neutralState } from '../types.js';
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
export const X2_HID_FILTER = { vendorId: 0x05ac, productId: 0x3b06 };
/** GameSir's own vendor id (newer devices: X2 Pro, X3, G7, T4 Kaleid…). */
export const GAMESIR_VENDOR_FILTER = { vendorId: 0x3537 };
export class WebHidController {
    constructor(device, opts) {
        this.device = device;
        this.opts = opts;
        this.transport = 'webhid';
        this.state = neutralState();
        this.reportMaps = new Map();
        this.listener = (ev) => this.onReport(ev);
        const vidPid = `${device.vendorId.toString(16).padStart(4, '0')}-` +
            `${device.productId.toString(16).padStart(4, '0')}`;
        this.descriptor = identify(`${vidPid}-${device.productName}`);
        for (const map of buildReportMaps(device.collections)) {
            this.reportMaps.set(map.reportId, map);
        }
    }
    get id() {
        return `hid:${this.device.vendorId.toString(16)}:${this.device.productId.toString(16)}`;
    }
    /** The device's report descriptor as WebHID parsed it (Q2 capture aid). */
    get descriptorDump() {
        return describeCollections(this.device.collections);
    }
    /**
     * Show the HID chooser (user gesture + HTTPS required) and start streaming
     * parsed state. Filters default to the X2 + GameSir vendor ids.
     */
    static async request(opts = {}) {
        const hid = navigator.hid;
        if (!hid)
            throw new Error('WebHID is not available in this browser');
        const [device] = await hid.requestDevice({
            filters: [X2_HID_FILTER, GAMESIR_VENDOR_FILTER, ...(opts.filters ?? [])],
        });
        if (!device)
            throw new Error('No device selected');
        if (!device.opened)
            await device.open();
        const controller = new WebHidController(device, opts);
        device.addEventListener('inputreport', controller.listener);
        return controller;
    }
    onReport(ev) {
        const map = this.reportMaps.get(ev.reportId);
        if (!map)
            return;
        const next = parseHidReport(map, ev.data, {
            deadzone: this.opts.deadzone,
            buttonMap: this.opts.buttonMap,
            swapFaceButtons: this.opts.swapFaceButtons ??
                this.descriptor?.quirks.includes('nintendo-layout') ??
                false,
        });
        if (statesEqual(this.state, next)) {
            this.state.timestamp = next.timestamp;
            return;
        }
        this.state = next;
        this.opts.onState?.(next, this);
    }
    async close() {
        this.device.removeEventListener('inputreport', this.listener);
        await this.device.close();
        this.opts.onDisconnect?.(this);
    }
    async rumble(_opts) {
        // No captured vendor output report for rumble yet (RESEARCH.md Q6);
        // use the Gamepad API transport's vibrationActuator instead.
        return false;
    }
}
/**
 * Raw capture path: show the HID chooser and stream unparsed input reports
 * (plus log the parsed descriptor via `describeCollections`). Returns a stop
 * function that closes the device.
 */
export async function openX2Hid(onReport) {
    const hid = navigator.hid;
    if (!hid)
        throw new Error('WebHID is not available in this browser');
    const [device] = await hid.requestDevice({
        filters: [X2_HID_FILTER, GAMESIR_VENDOR_FILTER],
    });
    if (!device)
        throw new Error('No device selected');
    if (!device.opened)
        await device.open();
    const listener = (ev) => onReport({ reportId: ev.reportId, data: ev.data, device: ev.device });
    device.addEventListener('inputreport', listener);
    return async () => {
        device.removeEventListener('inputreport', listener);
        await device.close();
    };
}
//# sourceMappingURL=webhid.js.map