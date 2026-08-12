import type { ControllerState, DeviceDescriptor, GameSirController, RumbleOptions } from '../types.js';
export declare class GamepadApiController implements GameSirController {
    readonly index: number;
    readonly gamepadId: string;
    readonly transport: "gamepad-api";
    readonly descriptor: DeviceDescriptor | null;
    state: ControllerState;
    constructor(index: number, gamepadId: string);
    get id(): string;
    /** Re-sample from a live Gamepad snapshot. Returns true if state changed. */
    sample(gp: Gamepad, swapFaceButtons: boolean, deadzone: number): boolean;
    rumble(opts?: RumbleOptions): Promise<boolean>;
}
