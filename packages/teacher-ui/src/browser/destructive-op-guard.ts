import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { DestructiveOpInfo, DestructiveOpSeverity, TrustEvent } from '../common/trust-protocol';

/**
 * Destructive Operation Guard (G4a) — labeled confirmation for dangerous commands.
 *
 * Maintains a registry of destructive operation patterns. When a command
 * or code snippet is classified as destructive, the guard emits an event
 * carrying a human-readable label explaining what it does and why it's
 * dangerous. The UI renders an amber confirmation card with Accept/Reject.
 */

interface DestructivePattern {
    id: string;
    label: string;
    description: string;
    severity: DestructiveOpSeverity;
    /** Regex patterns that match against the raw command string. */
    patterns: RegExp[];
}

const BUILTIN_PATTERNS: DestructivePattern[] = [
    {
        id: 'writes-to-remote-database',
        label: 'Writes to remote database',
        description: 'This command performs SQL INSERT, UPDATE, or DELETE operations, or Prisma mutations that modify remote data. Data loss or corruption is possible.',
        severity: 'warn',
        patterns: [
            /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i,
            /\bprisma\.(create|update|upsert|delete|deleteMany|updateMany|createMany)\b/,
        ],
    },
    {
        id: 'deletes-files',
        label: 'Deletes files',
        description: 'This command removes files from disk. Deleted files may not be recoverable without version control.',
        severity: 'warn',
        patterns: [
            /\b(rm\s|rm\s+-\w*[rf]|unlink|rimraf|del\s|Remove-Item)\b/,
            /\bfs\.(unlink|rmdir|rm)Sync?\b/,
        ],
    },
    {
        id: 'pushes-to-remote',
        label: 'Pushes to remote',
        description: 'This command pushes code to a remote repository. Force-pushes can overwrite others\' work.',
        severity: 'warn',
        patterns: [
            /\bgit\s+push\b/,
        ],
    },
    {
        id: 'deploys-to-production',
        label: 'Deploys to production',
        description: 'This command triggers a deployment to a live environment. Production deployments affect real users.',
        severity: 'block',
        patterns: [
            /\b(vercel\s+deploy|netlify\s+deploy|docker\s+push)\b/,
            /\b(fly\s+deploy|railway\s+up|heroku\s+container:push)\b/,
        ],
    },
    {
        id: 'modifies-schema',
        label: 'Modifies database schema',
        description: 'This command runs a migration or alters table structure. Schema changes can break existing queries and cause downtime.',
        severity: 'block',
        patterns: [
            /\b(ALTER\s+TABLE|DROP\s+TABLE|DROP\s+COLUMN)\b/i,
            /\b(prisma\s+migrate|knex\s+migrate|sequelize\s+db:migrate)\b/,
            /\b(npx\s+prisma\s+db\s+push)\b/,
        ],
    },
    {
        id: 'sends-external-request',
        label: 'Sends external request',
        description: 'This command makes an HTTP request to a non-localhost endpoint. External requests can leak data or trigger side effects on third-party services.',
        severity: 'warn',
        patterns: [
            /\b(fetch|axios|got|request|http\.request|https\.request)\s*\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/,
            /\bcurl\s+(?!.*localhost|.*127\.0\.0\.1)/,
        ],
    },
    {
        id: 'installs-packages',
        label: 'Installs packages',
        description: 'This command installs dependencies. Malicious or compromised packages can execute arbitrary code during installation.',
        severity: 'warn',
        patterns: [
            /\b(npm\s+install|npm\s+i\s|yarn\s+add|pnpm\s+add|pip\s+install|pip3\s+install)\b/,
        ],
    },
];

@injectable()
export class DestructiveOpGuard {

    private readonly registry: DestructivePattern[] = [...BUILTIN_PATTERNS];

    private readonly onDidDetectDestructiveOpEmitter = new Emitter<TrustEvent.DestructiveOpDetected>();
    readonly onDidDetectDestructiveOp: Event<TrustEvent.DestructiveOpDetected> = this.onDidDetectDestructiveOpEmitter.event;

    private readonly onDidAcceptDestructiveOpEmitter = new Emitter<TrustEvent.DestructiveOpAccepted>();
    readonly onDidAcceptDestructiveOp: Event<TrustEvent.DestructiveOpAccepted> = this.onDidAcceptDestructiveOpEmitter.event;

    private readonly onDidRejectDestructiveOpEmitter = new Emitter<TrustEvent.DestructiveOpRejected>();
    readonly onDidRejectDestructiveOp: Event<TrustEvent.DestructiveOpRejected> = this.onDidRejectDestructiveOpEmitter.event;

    @postConstruct()
    protected init(): void {
        console.info(`[DestructiveOpGuard] Initialized with ${this.registry.length} patterns`);
    }

    /**
     * Classify a command string against the destructive pattern registry.
     * Returns the first matching DestructiveOpInfo, or undefined if safe.
     */
    classify(command: string): DestructiveOpInfo | undefined {
        for (const entry of this.registry) {
            for (const pattern of entry.patterns) {
                if (pattern.test(command)) {
                    return {
                        id: entry.id,
                        label: entry.label,
                        description: entry.description,
                        severity: entry.severity,
                        command,
                    };
                }
            }
        }
        return undefined;
    }

    /**
     * Classify and, if destructive, emit a detection event.
     * Returns the info if destructive, undefined if safe.
     */
    guard(command: string): DestructiveOpInfo | undefined {
        const info = this.classify(command);
        if (info) {
            this.onDidDetectDestructiveOpEmitter.fire({
                kind: 'destructive-op-detected',
                info,
                timestamp: Date.now(),
            });
            console.warn(`[DestructiveOpGuard] Destructive op detected: ${info.label} — ${command}`);
        }
        return info;
    }

    /** Signal that the user accepted a destructive operation. */
    accept(info: DestructiveOpInfo): void {
        this.onDidAcceptDestructiveOpEmitter.fire({
            kind: 'destructive-op-accepted',
            info,
            timestamp: Date.now(),
        });
        console.info(`[DestructiveOpGuard] Accepted: ${info.label}`);
    }

    /** Signal that the user rejected a destructive operation. */
    reject(info: DestructiveOpInfo): void {
        this.onDidRejectDestructiveOpEmitter.fire({
            kind: 'destructive-op-rejected',
            info,
            timestamp: Date.now(),
        });
        console.info(`[DestructiveOpGuard] Rejected: ${info.label}`);
    }

    /** Register a custom destructive pattern at runtime. */
    registerPattern(pattern: {
        id: string;
        label: string;
        description: string;
        severity: DestructiveOpSeverity;
        patterns: RegExp[];
    }): void {
        this.registry.push(pattern);
        console.info(`[DestructiveOpGuard] Registered custom pattern: ${pattern.id}`);
    }

    /** Get all registered pattern IDs. */
    getPatternIds(): string[] {
        return this.registry.map(p => p.id);
    }
}
