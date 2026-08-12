export function neutralState() {
    return {
        buttons: {
            a: false,
            b: false,
            x: false,
            y: false,
            lb: false,
            rb: false,
            ls: false,
            rs: false,
            dpadUp: false,
            dpadDown: false,
            dpadLeft: false,
            dpadRight: false,
            menu: false,
            view: false,
            home: false,
        },
        triggers: { lt: 0, rt: 0 },
        axes: { lx: 0, ly: 0, rx: 0, ry: 0 },
        timestamp: 0,
    };
}
//# sourceMappingURL=types.js.map