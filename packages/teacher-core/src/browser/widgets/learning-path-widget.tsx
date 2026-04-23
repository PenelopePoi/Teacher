import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ProgressTrackingService } from '../../common/progress-protocol';
import { TeacherService } from '../../common/teacher-protocol';

type PathNodeStatus = 'completed' | 'current' | 'upcoming' | 'locked';

interface PathNode {
    id: string;
    title: string;
    status: PathNodeStatus;
    estimatedMinutes: number;
    skills: string[];
}

const DEMO_PATH: PathNode[] = [
    { id: 'lp-01', title: 'Variables & Data Types', status: 'completed', estimatedMinutes: 15, skills: ['Variables', 'Types'] },
    { id: 'lp-02', title: 'Operators & Expressions', status: 'completed', estimatedMinutes: 20, skills: ['Operators'] },
    { id: 'lp-03', title: 'Control Flow: Conditionals', status: 'completed', estimatedMinutes: 25, skills: ['Control Flow'] },
    { id: 'lp-04', title: 'Control Flow: Loops', status: 'completed', estimatedMinutes: 20, skills: ['Control Flow', 'Iteration'] },
    { id: 'lp-05', title: 'Functions & Scope', status: 'completed', estimatedMinutes: 30, skills: ['Functions', 'Scope'] },
    { id: 'lp-06', title: 'Arrays & Array Methods', status: 'current', estimatedMinutes: 35, skills: ['Arrays', 'Higher-Order Functions'] },
    { id: 'lp-07', title: 'Objects & Prototypes', status: 'upcoming', estimatedMinutes: 30, skills: ['Objects', 'Prototypes'] },
    { id: 'lp-08', title: 'ES6+ Features', status: 'upcoming', estimatedMinutes: 25, skills: ['Destructuring', 'Spread', 'Modules'] },
    { id: 'lp-09', title: 'Promises & Async/Await', status: 'upcoming', estimatedMinutes: 40, skills: ['Promises', 'Async'] },
    { id: 'lp-10', title: 'Error Handling', status: 'locked', estimatedMinutes: 20, skills: ['Try/Catch', 'Error Types'] },
    { id: 'lp-11', title: 'DOM Manipulation', status: 'locked', estimatedMinutes: 35, skills: ['DOM', 'Events'] },
    { id: 'lp-12', title: 'Capstone Project', status: 'locked', estimatedMinutes: 60, skills: ['Integration', 'Problem Solving'] },
];

@injectable()
export class LearningPathWidget extends ReactWidget {

    static readonly ID = 'teacher-learning-path';
    static readonly LABEL = nls.localize('theia/teacher/learningPath', 'Learning Path');

    @inject(ProgressTrackingService)
    protected readonly progressService: ProgressTrackingService;

    @inject(TeacherService)
    protected readonly teacherService: TeacherService;

    protected pathNodes: PathNode[] = DEMO_PATH;

    @postConstruct()
    protected init(): void {
        this.id = LearningPathWidget.ID;
        this.title.label = LearningPathWidget.LABEL;
        this.title.caption = LearningPathWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-type-hierarchy';
        this.addClass('teacher-learning-path');
        this.loadFromCurriculum();
        this.update();
    }

    protected async loadFromCurriculum(): Promise<void> {
        try {
            const curricula = await this.teacherService.getCurriculum();
            if (!curricula || curricula.length === 0) {
                return;
            }
            const progress = await this.progressService.getProgress();
            const liveNodes: PathNode[] = [];

            for (const course of curricula) {
                const courseProgress = progress.enrolledCourses?.find(c => c.courseId === course.id);
                let lessonIndex = 0;

                for (const mod of course.modules) {
                    for (const lesson of mod.lessons) {
                        let status: PathNodeStatus = 'upcoming';
                        if (courseProgress) {
                            if (courseProgress.currentLessonId === lesson.id) {
                                status = 'current';
                            } else if (lessonIndex < courseProgress.lessonsCompleted) {
                                status = 'completed';
                            }
                        }
                        lessonIndex++;

                        liveNodes.push({
                            id: lesson.id,
                            title: lesson.title,
                            status,
                            estimatedMinutes: lesson.estimatedMinutes,
                            skills: lesson.prerequisiteSkills,
                        });
                    }
                }
            }

            if (liveNodes.length > 0) {
                this.pathNodes = liveNodes;
                this.update();
            }
        } catch {
            // Keep demo data
        }
    }

    protected render(): React.ReactNode {
        const completed = this.pathNodes.filter(n => n.status === 'completed').length;
        const total = this.pathNodes.length;
        const totalMinutes = this.pathNodes.reduce((sum, n) => sum + n.estimatedMinutes, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        const remainingMinutes = this.pathNodes
            .filter(n => n.status !== 'completed')
            .reduce((sum, n) => sum + n.estimatedMinutes, 0);
        const remainingHours = (remainingMinutes / 60).toFixed(1);

        return (
            <div className='teacher-learning-path-container'>
                <div className='teacher-learning-path-header'>
                    <h2 className='teacher-learning-path-title'>
                        <i className='codicon codicon-type-hierarchy'></i>
                        {nls.localize('theia/teacher/recommendedPath', 'Recommended Learning Path')}
                    </h2>
                </div>
                <div className='teacher-learning-path-summary'>
                    <div className='teacher-learning-path-summary-item'>
                        <span className='teacher-learning-path-summary-value'>{completed}/{total}</span>
                        <span className='teacher-learning-path-summary-label'>
                            {nls.localize('theia/teacher/stepsComplete', 'steps complete')}
                        </span>
                    </div>
                    <div className='teacher-learning-path-summary-item'>
                        <span className='teacher-learning-path-summary-value'>{totalHours}h</span>
                        <span className='teacher-learning-path-summary-label'>
                            {nls.localize('theia/teacher/totalEstimated', 'total estimated')}
                        </span>
                    </div>
                    <div className='teacher-learning-path-summary-item'>
                        <span className='teacher-learning-path-summary-value'>{remainingHours}h</span>
                        <span className='teacher-learning-path-summary-label'>
                            {nls.localize('theia/teacher/estimatedRemaining', 'estimated remaining')}
                        </span>
                    </div>
                    <div className='teacher-learning-path-progress-bar'>
                        <div
                            className='teacher-learning-path-progress-fill'
                            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>
                <div className='teacher-learning-path-timeline'>
                    {this.pathNodes.map((node, index) => this.renderPathNode(node, index))}
                </div>
            </div>
        );
    }

    protected renderPathNode(node: PathNode, index: number): React.ReactNode {
        const iconMap: Record<PathNodeStatus, string> = {
            completed: 'codicon-pass-filled',
            current: 'codicon-play-circle',
            upcoming: 'codicon-circle-outline',
            locked: 'codicon-lock',
        };
        const isLast = index === this.pathNodes.length - 1;

        return (
            <div key={node.id} className={`teacher-learning-path-node teacher-learning-path-node-${node.status}`}>
                <div className='teacher-learning-path-node-connector'>
                    <div className={`teacher-learning-path-node-dot teacher-learning-path-dot-${node.status}`}>
                        <i className={`codicon ${iconMap[node.status]}`}></i>
                    </div>
                    {!isLast && <div className={`teacher-learning-path-node-line teacher-learning-path-line-${node.status}`}></div>}
                </div>
                <div className='teacher-learning-path-node-content'>
                    <div className='teacher-learning-path-node-header'>
                        <span className='teacher-learning-path-node-title'>{node.title}</span>
                        <span className='teacher-learning-path-node-time'>
                            <i className='codicon codicon-clock'></i>
                            {node.estimatedMinutes}m
                        </span>
                    </div>
                    <div className='teacher-learning-path-node-skills'>
                        {node.skills.map(skill => (
                            <span key={skill} className='teacher-learning-path-node-skill-tag'>{skill}</span>
                        ))}
                    </div>
                    {node.status === 'current' && (
                        <div className='teacher-learning-path-you-are-here'>
                            <i className='codicon codicon-location'></i>
                            <span>{nls.localize('theia/teacher/youAreHere', 'You are here')}</span>
                        </div>
                    )}
                    {node.status === 'current' && (
                        <button className='theia-button teacher-learning-path-continue-btn' onClick={this.onContinueLesson}>
                            <i className='codicon codicon-play'></i>
                            {nls.localize('theia/teacher/continueLesson', 'Continue')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    protected onContinueLesson = (): void => {
        const current = this.pathNodes.find(n => n.status === 'current');
        if (current) {
            this.teacherService.startLesson(current.id);
        }
    };
}
