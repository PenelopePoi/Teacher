import * as React from '@theia/core/shared/react';
import { NotificationOrbitService, OrbitNotification, NotificationType } from './notification-orbit-service';

// ── Helpers ─────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotificationType, string> = {
    info:    'codicon codicon-info',
    success: 'codicon codicon-pass',
    warning: 'codicon codicon-warning',
};

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) {
        return 'just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

// ── Badge (collapsed view) ─────────────────────────────────────────

export interface NotificationOrbitBadgeProps {
    readonly service: NotificationOrbitService;
}

/**
 * A small amber count badge shown beside the Pulse dot.
 * Renders nothing when there are zero unread notifications.
 */
export function NotificationOrbitBadge({ service }: NotificationOrbitBadgeProps): React.ReactElement | null {
    const [count, setCount] = React.useState<number>(() => service.getCount());

    React.useEffect(() => {
        const sub = service.onDidChange(() => setCount(service.getCount()));
        return () => sub.dispose();
    }, [service]);

    if (count === 0) {
        return null;
    }

    return (
        <span className="teacher-orbit-badge">{count > 9 ? '9+' : count}</span>
    );
}

// ── Single notification card ────────────────────────────────────────

interface NotificationCardProps {
    readonly notification: OrbitNotification;
    readonly onDismiss: (id: string) => void;
    readonly onClick: (notification: OrbitNotification) => void;
}

function NotificationCard({ notification, onDismiss, onClick }: NotificationCardProps): React.ReactElement {
    const handleDismiss = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDismiss(notification.id);
    }, [notification.id, onDismiss]);

    const handleClick = React.useCallback(() => {
        onClick(notification);
    }, [notification, onClick]);

    const cardClass = notification.read
        ? 'teacher-orbit-card teacher-orbit-card--read'
        : 'teacher-orbit-card teacher-orbit-card--unread';

    return (
        <div className={cardClass} onClick={handleClick} role="button" tabIndex={0}>
            <span className={`teacher-orbit-card-icon ${TYPE_ICONS[notification.type]}`} />
            <div className="teacher-orbit-card-body">
                <span className="teacher-orbit-card-message">{notification.message}</span>
                <span className="teacher-orbit-card-meta">
                    {notification.source ? `${notification.source} · ` : ''}{timeAgo(notification.timestamp)}
                </span>
            </div>
            <button className="teacher-orbit-card-dismiss" onClick={handleDismiss} title="Dismiss">
                <span className="codicon codicon-close" />
            </button>
        </div>
    );
}

// ── Expanded panel ──────────────────────────────────────────────────

export interface NotificationOrbitPanelProps {
    readonly service: NotificationOrbitService;
}

/**
 * Expandable notification panel that attaches near the Pulse Panel.
 * Collapsed: shows only the badge (via NotificationOrbitBadge).
 * Expanded: shows notification cards with dismiss controls.
 */
export function NotificationOrbitPanel({ service }: NotificationOrbitPanelProps): React.ReactElement {
    const [expanded, setExpanded] = React.useState(false);
    const [notifications, setNotifications] = React.useState<readonly OrbitNotification[]>(() => service.getAll());
    const [count, setCount] = React.useState<number>(() => service.getCount());

    React.useEffect(() => {
        const sub = service.onDidChange(() => {
            setNotifications(service.getAll());
            setCount(service.getCount());
        });
        return () => sub.dispose();
    }, [service]);

    const handleToggle = React.useCallback(() => {
        setExpanded(prev => !prev);
    }, []);

    const handleMarkAllRead = React.useCallback(() => {
        service.markAllRead();
    }, [service]);

    const handleDismiss = React.useCallback((id: string) => {
        service.dismiss(id);
    }, [service]);

    const handleClick = React.useCallback((notification: OrbitNotification) => {
        service.markRead(notification.id);
        if (notification.onAction) {
            notification.onAction();
        }
    }, [service]);

    return (
        <div className={`teacher-orbit-panel ${expanded ? 'teacher-orbit-panel--expanded' : ''}`}>
            <div className="teacher-orbit-header" onClick={handleToggle} role="button" tabIndex={0}>
                <NotificationOrbitBadge service={service} />
                <span className="teacher-orbit-header-label">
                    {expanded ? 'Notifications' : ''}
                </span>
                {expanded && count > 0 && (
                    <button
                        className="teacher-orbit-mark-all"
                        onClick={e => { e.stopPropagation(); handleMarkAllRead(); }}
                        title="Mark all read"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {expanded && (
                <div className="teacher-orbit-list">
                    {notifications.length === 0 ? (
                        <div className="teacher-orbit-empty">
                            No notifications. The Pulse stays quiet.
                        </div>
                    ) : (
                        notifications.map(n => (
                            <NotificationCard
                                key={n.id}
                                notification={n}
                                onDismiss={handleDismiss}
                                onClick={handleClick}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
