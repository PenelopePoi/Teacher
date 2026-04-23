import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { MilestoneService } from '../../common/milestone-protocol';

type MilestoneStatus = 'done' | 'current' | 'upcoming';

interface Milestone {
    readonly id: string;
    readonly title: string;
    readonly status: MilestoneStatus;
    readonly skills: string[];
    readonly description: string;
}

const DEMO_MILESTONES: Milestone[] = [
    {
        id: 'ms-1',
        title: 'Project Setup',
        status: 'done',
        skills: ['npm', 'Git', 'TypeScript Config'],
        description: 'Initialize repository, install dependencies, and configure build tools.',
    },
    {
        id: 'ms-2',
        title: 'Data Model',
        status: 'done',
        skills: ['TypeScript Interfaces', 'JSON Schema'],
        description: 'Define core data types and validation schemas.',
    },
    {
        id: 'ms-3',
        title: 'API Layer',
        status: 'current',
        skills: ['REST APIs', 'Error Handling', 'Async/Await'],
        description: 'Build service layer with fetch wrappers and error handling.',
    },
    {
        id: 'ms-4',
        title: 'UI Components',
        status: 'upcoming',
        skills: ['React Components', 'CSS Grid', 'Flexbox'],
        description: 'Create reusable UI components with responsive layouts.',
    },
    {
        id: 'ms-5',
        title: 'State Management',
        status: 'upcoming',
        skills: ['React Hooks', 'Context API', 'useReducer'],
        description: 'Wire up application state with context and reducers.',
    },
    {
        id: 'ms-6',
        title: 'Testing & Deploy',
        status: 'upcoming',
        skills: ['Unit Testing', 'Integration Testing', 'CI/CD'],
        description: 'Write tests and set up continuous deployment pipeline.',
    },
];

@injectable()
export class ProjectTrackerWidget extends ReactWidget {

    static readonly ID = 'teacher-project-tracker';
    static readonly LABEL = nls.localize('theia/teacher/projectTracker', 'Project Tracker');

    @inject(MilestoneService)
    protected readonly milestoneService: MilestoneService;

    protected milestones: Milestone[] = DEMO_MILESTONES;

    @postConstruct()
    protected init(): void {
        this.id = ProjectTrackerWidget.ID;
        this.title.label = ProjectTrackerWidget.LABEL;
        this.title.caption = ProjectTrackerWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-milestone';
        this.addClass('teacher-project-tracker');
        this.loadFromBackend();
        this.update();
    }

    protected async loadFromBackend(): Promise<void> {
        try {
            const backendMilestones = await this.milestoneService.getMilestones();
            if (backendMilestones && backendMilestones.length > 0) {
                this.milestones = backendMilestones.map((m, i) => ({
                    id: m.id,
                    title: m.title,
                    status: m.completedAt ? 'done' as MilestoneStatus : (i === backendMilestones.findIndex(bm => !bm.completedAt) ? 'current' as MilestoneStatus : 'upcoming' as MilestoneStatus),
                    skills: m.requiredConcepts,
                    description: m.description,
                }));
                this.update();
            }
        } catch {
            // Keep demo data
        }
    }

    protected render(): React.ReactNode {
        const completed = this.milestones.filter(m => m.status === 'done').length;
        const total = this.milestones.length;
        const allSkills = this.milestones
            .filter(m => m.status === 'done')
            .flatMap(m => m.skills);
        const uniqueSkills = Array.from(new Set(allSkills));

        return (
            <div className='teacher-project-tracker-container'>
                <div className='teacher-project-tracker-header'>
                    <h2 className='teacher-project-tracker-title'>
                        <i className='codicon codicon-milestone'></i>
                        {nls.localize('theia/teacher/projectTrackerTitle', 'Project Milestones')}
                    </h2>
                    <span className='teacher-project-tracker-progress'>
                        {nls.localize('theia/teacher/projectProgress', '{0} of {1} complete', completed, total)}
                    </span>
                </div>
                <div className='teacher-project-tracker-bar'>
                    <div
                        className='teacher-project-tracker-bar-fill'
                        style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                    ></div>
                </div>
                {uniqueSkills.length > 0 && (
                    <div className='teacher-project-tracker-skills-earned'>
                        <span className='teacher-project-tracker-skills-label'>
                            <i className='codicon codicon-star-full'></i>
                            {nls.localize('theia/teacher/skillsLearned', 'Skills learned:')}
                        </span>
                        <div className='teacher-project-tracker-skills-list'>
                            {uniqueSkills.map(skill => (
                                <span key={skill} className='teacher-project-tracker-skill-chip'>{skill}</span>
                            ))}
                        </div>
                    </div>
                )}
                <div className='teacher-project-tracker-timeline'>
                    {this.milestones.map((ms, index) => this.renderMilestone(ms, index))}
                </div>
            </div>
        );
    }

    protected renderMilestone(milestone: Milestone, index: number): React.ReactNode {
        const isLast = index === this.milestones.length - 1;
        const statusIcon: Record<MilestoneStatus, string> = {
            done: 'codicon-pass-filled',
            current: 'codicon-play-circle',
            upcoming: 'codicon-circle-outline',
        };

        return (
            <div key={milestone.id} className={`teacher-project-tracker-milestone teacher-project-tracker-milestone--${milestone.status}`}>
                <div className='teacher-project-tracker-milestone-track'>
                    <div className={`teacher-project-tracker-milestone-dot teacher-project-tracker-dot--${milestone.status}`}>
                        <i className={`codicon ${statusIcon[milestone.status]}`}></i>
                    </div>
                    {!isLast && <div className={`teacher-project-tracker-milestone-line teacher-project-tracker-line--${milestone.status}`}></div>}
                </div>
                <div className='teacher-project-tracker-milestone-content'>
                    <div className='teacher-project-tracker-milestone-header'>
                        <span className='teacher-project-tracker-milestone-title'>{milestone.title}</span>
                        <span className={`teacher-project-tracker-status-badge teacher-project-tracker-status-badge--${milestone.status}`}>
                            {milestone.status === 'done'
                                ? nls.localize('theia/teacher/milestoneDone', 'Done')
                                : milestone.status === 'current'
                                ? nls.localize('theia/teacher/milestoneCurrent', 'In Progress')
                                : nls.localize('theia/teacher/milestoneUpcoming', 'Upcoming')}
                        </span>
                    </div>
                    <p className='teacher-project-tracker-milestone-desc'>{milestone.description}</p>
                    <div className='teacher-project-tracker-milestone-skills'>
                        {milestone.skills.map(skill => (
                            <span key={skill} className='teacher-project-tracker-milestone-skill-tag'>
                                <i className='codicon codicon-book'></i>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}
