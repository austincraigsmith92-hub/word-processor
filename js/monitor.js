export class Monitor {
    constructor(callbacks) {
        this.HEARTBEAT_MS = 60000;
        this.IDLE_WARNING_THRESHOLD = 3;

        this.callbacks = callbacks; // { onActive, onIdle, onError }

        this.lastTypedTime = Date.now();
        this.idleCount = 0;
        this.isActive = false;

        // Watchdog timer reference
        this.watchdogId = null;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.lastTypedTime = Date.now();
        this.idleCount = 0;

        // Use a watchdog pattern if intervals get throttled by the browser
        this.runHeartbeatLoop();

        if (this.callbacks.onActive) this.callbacks.onActive("Monitoring started");
    }

    runHeartbeatLoop() {
        // clear old if exists
        if (this.watchdogId) clearTimeout(this.watchdogId);

        this.watchdogId = setTimeout(() => {
            if (!this.isActive) return;
            this.heartbeat();
            this.runHeartbeatLoop(); // schedule next
        }, this.HEARTBEAT_MS);
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        if (this.watchdogId) {
            clearTimeout(this.watchdogId);
            this.watchdogId = null;
        }
    }

    registerKeypress() {
        if (!this.isActive) return;
        this.lastTypedTime = Date.now();
        this.idleCount = 0;
    }

    heartbeat() {
        const now = Date.now();
        const timeSinceLastTyped = now - this.lastTypedTime;

        if (timeSinceLastTyped < this.HEARTBEAT_MS) {
            // Active
            this.idleCount = 0;
            if (this.callbacks.onActive) this.callbacks.onActive("Active heartbeat");
        } else {
            // Idle
            this.idleCount++;
            let isErrorLevel = this.idleCount >= this.IDLE_WARNING_THRESHOLD;
            if (isErrorLevel && this.callbacks.onError) {
                this.callbacks.onError(`Idle for ${this.idleCount} minutes. Wake up!`);
            } else if (this.callbacks.onIdle) {
                this.callbacks.onIdle(`Idle heartbeat (${this.idleCount})`);
            }
        }
    }
}
