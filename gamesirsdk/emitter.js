/** Minimal typed event emitter (no Node dependency — runs in any browser/WebKit). */
export class Emitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, fn) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(fn);
        return () => this.off(event, fn);
    }
    off(event, fn) {
        this.listeners.get(event)?.delete(fn);
    }
    emit(event, ...args) {
        const set = this.listeners.get(event);
        if (!set)
            return;
        for (const fn of set)
            fn(...args);
    }
}
//# sourceMappingURL=emitter.js.map