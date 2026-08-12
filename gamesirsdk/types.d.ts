/** Digital buttons, named with Xbox semantics regardless of the physical device. */
export type XboxButton = 'a' | 'b' | 'x' | 'y' | 'lb' | 'rb' | 'ls' | 'rs' | 'dpadUp' | 'dpadDown' | 'dpadLeft' | 'dpadRight' | 'menu' | 'view' | 'home';
/**
 * Normalized controller state. Axes are -1..1 with up/left negative
 * (Gamepad API convention); triggers are 0..1.
 */
export interface ControllerState {
    buttons: Record<XboxButton, boolean>;
    triggers: {
        lt: number;
        rt: number;
    };
    axes: {
        lx: number;
        ly: number;
        rx: number;
        ry: number;
    };
    /** ms timestamp of the sample (performance.now() domain). */
    timestamp: number;
}
export type Quirk = 
/** Physical A/B and X/Y labels are swapped vs. standard-mapping positions (Switch layout). */
'nintendo-layout'
/** Device never exposes a vibrationActuator in this mode. */
 | 'no-rumble';
export interface DeviceDescriptor {
    /** Canonical slug, e.g. "x2-typec". */
    device: string;
    /** Human-readable name. */
    name: string;
    /** 4-hex-digit lowercase USB/BT vendor id, if known. */
    vendor?: string;
    /** 4-hex-digit lowercase product id, if known. */
    product?: string;
    /** Fallback matcher against the Gamepad API id string / BLE name. */
    namePattern?: RegExp;
    quirks: Quirk[];
}
export type TransportKind = 'gamepad-api' | 'webhid' | 'web-bluetooth';
/** A connected controller as exposed by the SDK. */
export interface GameSirController {
    /** Stable id within the session (transport-specific). */
    readonly id: string;
    readonly transport: TransportKind;
    /** Matched descriptor, or null for an unrecognized (non-GameSir) pad. */
    readonly descriptor: DeviceDescriptor | null;
    /** Last sampled state. */
    readonly state: ControllerState;
    /** Dual-rumble, if the transport/device supports it. Resolves false otherwise. */
    rumble(opts?: RumbleOptions): Promise<boolean>;
}
export interface RumbleOptions {
    duration?: number;
    strongMagnitude?: number;
    weakMagnitude?: number;
}
export interface SdkEvents {
    /** A controller appeared (for Gamepad API pads: after the first button press). */
    connect: (controller: GameSirController) => void;
    disconnect: (controller: GameSirController) => void;
    /** Fired whenever a controller's state changes. */
    state: (state: ControllerState, controller: GameSirController) => void;
}
export interface SdkOptions {
    /**
     * Radial deadzone applied to each stick, 0..1. Default 0.08.
     * Set 0 to disable.
     */
    deadzone?: number;
    /**
     * Whether to apply the A/B–X/Y swap for devices with the 'nintendo-layout'
     * quirk (GameSir X2 family). 'auto' (default) applies it only on Android,
     * where the raw Switch-style ordering is known to leak through
     * (see RESEARCH.md §4.2 / Q1); true/false force it.
     */
    remapNintendoLayout?: 'auto' | boolean;
    /**
     * Emit unrecognized (non-GameSir) gamepads too, with descriptor null.
     * Default true.
     */
    includeUnknownGamepads?: boolean;
}
export declare function neutralState(): ControllerState;
