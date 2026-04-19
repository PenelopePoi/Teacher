/**
 * Friction Notification Bridge
 *
 * Connects StudentFrictionService to the NotificationOrbitService.
 * When friction is detected (moderate or high), creates a non-interrupting
 * notification. Clicking it opens the Tutor chat with the intervention
 * pre-loaded.
 *
 * Never interrupts. Always peripheral. The student notices when they glance.
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { StudentFrictionService } from './student-friction-service';
import { NotificationOrbitService } from '../pulse/notification-orbit-service';
import { FrictionEvent, FrictionType } from '../../common/friction-protocol';

/** Human-readable labels for friction types. */
const FRICTION_LABELS: Record<FrictionType, string> = {
    [FrictionType.UndoRedoCycle]: 'Undo loop detected',
    [FrictionType.ErrorPause]: 'Stuck on an error',
    [FrictionType.RepeatedTestFailure]: 'Test keeps failing',
    [FrictionType.ExcessiveDeletions]: 'Rewriting a lot',
    [FrictionType.HelpSeeking]: 'Searching for help',
    [FrictionType.AssessmentRetries]: 'Assessment retry',
    [FrictionType.SessionAbandonment]: 'Session paused',
    [FrictionType.ConceptConfusion]: 'Concept confusion',
};

@injectable()
export class FrictionNotificationBridge {

    @inject(StudentFrictionService)
    protected readonly frictionService: StudentFrictionService;

    @inject(NotificationOrbitService)
    protected readonly orbitService: NotificationOrbitService;

    @postConstruct()
    protected init(): void {
        this.frictionService.onDidDetectFriction(event => this.handleFriction(event));
    }

    protected handleFriction(event: FrictionEvent): void {
        // Only notify on moderate or high severity — mild is tracked but silent.
        if (event.severity === 'mild') {
            return;
        }

        const notificationType = event.severity === 'high' ? 'warning' : 'info';
        const label = FRICTION_LABELS[event.type];

        this.orbitService.addNotification(
            notificationType,
            `${label}: ${event.suggestedIntervention}`,
            {
                source: 'Friction Detection',
                onAction: () => {
                    // Mark the friction as resolved — the student engaged.
                    this.frictionService.resolveFriction(event.id);

                    // Open Tutor chat with intervention pre-loaded.
                    // Uses the Theia command system if available.
                    this.openTutorWithIntervention(event);
                },
            },
        );
    }

    /**
     * Attempt to open the Tutor chat panel with the suggested intervention.
     * Falls back gracefully if the command system isn't available.
     */
    protected openTutorWithIntervention(event: FrictionEvent): void {
        // The Tutor chat can be opened via the 'teacher.askTutor' command.
        // The friction context is passed so the Tutor knows what happened.
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const commandService = (globalThis as any).__theiaCommandService;
            if (commandService) {
                commandService.executeCommand(
                    'teacher.askTutor',
                    `[Friction: ${event.type}] ${event.suggestedIntervention}`,
                );
            }
        } catch {
            // Silently fail — the notification itself is sufficient.
            console.info('[FrictionBridge] Could not open Tutor chat; notification remains visible.');
        }
    }
}
