import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';

export type NotificationType = 'info' | 'success' | 'warning';

export interface OrbitNotification {
    readonly id: string;
    readonly type: NotificationType;
    readonly message: string;
    readonly timestamp: number;
    read: boolean;
    readonly source?: string;
    /** Optional callback triggered when the user clicks the notification. */
    readonly onAction?: () => void;
}

/**
 * G12 — Peripheral-orbit notifications via the Pulse.
 *
 * Non-interrupting notifications that orbit the Pulse indicator.
 * The Companion never pings — it flags quietly.
 * The user notices when they glance.
 *
 * Injectable singleton that maintains up to 5 pending notifications
 * and auto-expires them after 30 minutes.
 */
@injectable()
export class NotificationOrbitService {

    /** Max notifications kept in orbit at once. */
    protected static readonly MAX_NOTIFICATIONS = 5;

    /** Time-to-live in milliseconds (30 minutes). */
    protected static readonly TTL_MS = 30 * 60 * 1000;

    protected readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    protected notifications: OrbitNotification[] = [];
    protected expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
    protected nextId = 1;

    /**
     * Add a notification to the orbit.
     * If the orbit is full the oldest notification is silently dropped.
     */
    addNotification(
        type: NotificationType,
        message: string,
        opts: { source?: string; onAction?: () => void } = {},
    ): OrbitNotification {
        const notification: OrbitNotification = {
            id: `orbit-${this.nextId++}`,
            type,
            message,
            timestamp: Date.now(),
            read: false,
            source: opts.source,
            onAction: opts.onAction,
        };

        // Evict oldest if at capacity.
        if (this.notifications.length >= NotificationOrbitService.MAX_NOTIFICATIONS) {
            const evicted = this.notifications.shift();
            if (evicted) {
                this.clearExpiry(evicted.id);
            }
        }

        this.notifications.push(notification);
        this.scheduleExpiry(notification.id);
        this._onDidChange.fire();
        return notification;
    }

    /** Return only unread notifications (newest first). */
    getUnread(): readonly OrbitNotification[] {
        return this.notifications.filter(n => !n.read).reverse();
    }

    /** Return all notifications (newest first). */
    getAll(): readonly OrbitNotification[] {
        return [...this.notifications].reverse();
    }

    /** Number of unread notifications. */
    getCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    /** Mark a single notification as read. */
    markRead(id: string): void {
        const n = this.notifications.find(x => x.id === id);
        if (n && !n.read) {
            n.read = true;
            this._onDidChange.fire();
        }
    }

    /** Mark every notification as read. */
    markAllRead(): void {
        let changed = false;
        for (const n of this.notifications) {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        }
        if (changed) {
            this._onDidChange.fire();
        }
    }

    /** Remove a notification by id. */
    dismiss(id: string): void {
        const idx = this.notifications.findIndex(x => x.id === id);
        if (idx !== -1) {
            this.notifications.splice(idx, 1);
            this.clearExpiry(id);
            this._onDidChange.fire();
        }
    }

    // ── Expiry helpers ──────────────────────────────────────────────

    protected scheduleExpiry(id: string): void {
        const timer = setTimeout(() => {
            this.dismiss(id);
        }, NotificationOrbitService.TTL_MS);
        this.expiryTimers.set(id, timer);
    }

    protected clearExpiry(id: string): void {
        const timer = this.expiryTimers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.expiryTimers.delete(id);
        }
    }
}
