import type { ControllerState } from './types.js';
export declare function applyDeadzone(x: number, y: number, deadzone: number): [number, number];
/**
 * Convert a standard-mapping Gamepad snapshot to Xbox-semantic state.
 *
 * `swapFaceButtons` applies the X2 'nintendo-layout' quirk: the pad's physical
 * labels follow the Switch layout (A right, B bottom, X top, Y left), so to make
 * `state.buttons.a` mean "the button labeled A" we read A from the *right*
 * position and B from the *bottom* (and X/Y likewise). See RESEARCH.md §4.2.
 */
export declare function normalizeStandardGamepad(gp: Gamepad, swapFaceButtons: boolean, deadzone: number): ControllerState;
export declare function statesEqual(a: ControllerState, b: ControllerState): boolean;
