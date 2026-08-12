/** Minimal typed event emitter (no Node dependency — runs in any browser/WebKit). */
export declare class Emitter<Events extends {
    [K in keyof Events]: (...args: never[]) => void;
}> {
    private listeners;
    on<K extends keyof Events>(event: K, fn: Events[K]): () => void;
    off<K extends keyof Events>(event: K, fn: Events[K]): void;
    protected emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void;
}
