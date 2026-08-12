import { identify } from '../devices.js';
import { normalizeStandardGamepad, statesEqual } from '../normalize.js';
import { neutralState } from '../types.js';
export class GamepadApiController {
    constructor(index, gamepadId) {
        this.index = index;
        this.gamepadId = gamepadId;
        this.transport = 'gamepad-api';
        this.state = neutralState();
        this.descriptor = identify(gamepadId);
    }
    get id() {
        return `gamepad:${this.index}`;
    }
    /** Re-sample from a live Gamepad snapshot. Returns true if state changed. */
    sample(gp, swapFaceButtons, deadzone) {
        // Non-standard mappings expose raw report order; without a per-device axis
        // map we can only pass through the standard path (works for every pad we
        // have data on — see RESEARCH.md Q1/Q2 for the raw-mapping follow-up).
        const next = normalizeStandardGamepad(gp, swapFaceButtons, deadzone);
        if (statesEqual(this.state, next)) {
            this.state.timestamp = next.timestamp;
            return false;
        }
        this.state = next;
        return true;
    }
    async rumble(opts = {}) {
        const gp = navigator.getGamepads()[this.index];
        const actuator = gp
            ?.vibrationActuator;
        if (!actuator)
            return false;
        try {
            await actuator.playEffect('dual-rumble', {
                duration: opts.duration ?? 150,
                strongMagnitude: opts.strongMagnitude ?? 1,
                weakMagnitude: opts.weakMagnitude ?? 0.5,
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=gamepadApi.js.map