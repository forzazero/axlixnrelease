import { neutralState } from './types.js';
/** W3C standard-mapping button indices. */
const STD = {
    bottom: 0,
    right: 1,
    left: 2,
    top: 3,
    lb: 4,
    rb: 5,
    lt: 6,
    rt: 7,
    view: 8,
    menu: 9,
    ls: 10,
    rs: 11,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15,
    home: 16,
};
function pressed(gp, i) {
    return gp.buttons[i]?.pressed ?? false;
}
function value(gp, i) {
    return gp.buttons[i]?.value ?? 0;
}
export function applyDeadzone(x, y, deadzone) {
    if (deadzone <= 0)
        return [x, y];
    const mag = Math.hypot(x, y);
    if (mag < deadzone)
        return [0, 0];
    // Rescale so output is continuous from the deadzone edge.
    const scale = Math.min(1, (mag - deadzone) / (1 - deadzone)) / mag;
    return [x * scale, y * scale];
}
/**
 * Convert a standard-mapping Gamepad snapshot to Xbox-semantic state.
 *
 * `swapFaceButtons` applies the X2 'nintendo-layout' quirk: the pad's physical
 * labels follow the Switch layout (A right, B bottom, X top, Y left), so to make
 * `state.buttons.a` mean "the button labeled A" we read A from the *right*
 * position and B from the *bottom* (and X/Y likewise). See RESEARCH.md §4.2.
 */
export function normalizeStandardGamepad(gp, swapFaceButtons, deadzone) {
    const s = neutralState();
    s.buttons.a = pressed(gp, swapFaceButtons ? STD.right : STD.bottom);
    s.buttons.b = pressed(gp, swapFaceButtons ? STD.bottom : STD.right);
    s.buttons.x = pressed(gp, swapFaceButtons ? STD.top : STD.left);
    s.buttons.y = pressed(gp, swapFaceButtons ? STD.left : STD.top);
    s.buttons.lb = pressed(gp, STD.lb);
    s.buttons.rb = pressed(gp, STD.rb);
    s.buttons.ls = pressed(gp, STD.ls);
    s.buttons.rs = pressed(gp, STD.rs);
    s.buttons.dpadUp = pressed(gp, STD.dpadUp);
    s.buttons.dpadDown = pressed(gp, STD.dpadDown);
    s.buttons.dpadLeft = pressed(gp, STD.dpadLeft);
    s.buttons.dpadRight = pressed(gp, STD.dpadRight);
    s.buttons.menu = pressed(gp, STD.menu);
    s.buttons.view = pressed(gp, STD.view);
    s.buttons.home = pressed(gp, STD.home);
    s.triggers.lt = value(gp, STD.lt);
    s.triggers.rt = value(gp, STD.rt);
    const [lx, ly] = applyDeadzone(gp.axes[0] ?? 0, gp.axes[1] ?? 0, deadzone);
    const [rx, ry] = applyDeadzone(gp.axes[2] ?? 0, gp.axes[3] ?? 0, deadzone);
    s.axes = { lx, ly, rx, ry };
    s.timestamp = gp.timestamp;
    return s;
}
export function statesEqual(a, b) {
    for (const k of Object.keys(a.buttons)) {
        if (a.buttons[k] !== b.buttons[k])
            return false;
    }
    return (a.triggers.lt === b.triggers.lt &&
        a.triggers.rt === b.triggers.rt &&
        a.axes.lx === b.axes.lx &&
        a.axes.ly === b.axes.ly &&
        a.axes.rx === b.axes.rx &&
        a.axes.ry === b.axes.ry);
}
//# sourceMappingURL=normalize.js.map