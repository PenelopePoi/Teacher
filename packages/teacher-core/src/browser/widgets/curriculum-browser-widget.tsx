import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { TeacherService, CurriculumDefinition, CurriculumModule, LessonManifest } from '../../common/teacher-protocol';

@injectable()
export class CurriculumBrowserWidget extends ReactWidget {

    static readonly ID = 'teacher-curriculum-browser';
    static readonly LABEL = nls.localize('theia/teacher/curriculumBrowser', 'Curriculum');

    @inject(TeacherService)
    protected readonly teacherService: TeacherService;

    protected curricula: CurriculumDefinition[] = [];
    protected expandedCourses: Set<string> = new Set();
    protected expandedModules: Set<string> = new Set();

    @postConstruct()
    protected init(): void {
        this.id = CurriculumBrowserWidget.ID;
        this.title.label = CurriculumBrowserWidget.LABEL;
        this.title.caption = CurriculumBrowserWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-book';
        this.addClass('teacher-curriculum-browser');
        this.loadCurricula();
    }

    protected async loadCurricula(): Promise<void> {
        try {
            this.curricula = await this.teacherService.getCurriculum();
        } catch {
            this.curricula = [];
        }
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-curriculum-container'>
                <div className='teacher-curriculum-header'>
                    <h2 className='teacher-curriculum-title'>
                        <i className='codicon codicon-book'></i>
                        {nls.localize('theia/teacher/availableCourses', 'Available Courses')}
                    </h2>
                    <button className='theia-button teacher-curriculum-refresh-btn' onClick={this.onRefresh} aria-label='Refresh courses'>
                        <i className='codicon codicon-refresh' aria-hidden='true'></i>
                    </button>
                </div>
                {this.renderCurriculumTree()}
            </div>
        );
    }

    protected renderCurriculumTree(): React.ReactNode {
        if (this.curricula.length === 0) {
            return (
                <div className='teacher-curriculum-empty'>
                    <i className='codicon codicon-info'></i>
                    <p>{nls.localize('theia/teacher/noCourses', 'No courses available. Check your curriculum configuration.')}</p>
                </div>
            );
        }

        return (
            <div className='teacher-curriculum-tree'>
                {this.curricula.map(course => this.renderCourse(course))}
            </div>
        );
    }

    protected renderCourse(course: CurriculumDefinition): React.ReactNode {
        const isExpanded = this.expandedCourses.has(course.id);
        const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

        return (
            <div key={course.id} className='teacher-curriculum-node'>
                <div
                    className='teacher-curriculum-node-header teacher-curriculum-course'
                    onClick={() => this.toggleCourse(course.id)}
                    role='treeitem'
                    aria-expanded={isExpanded}
                >
                    <i className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></i>
                    <i className='codicon codicon-library'></i>
                    <span className='teacher-curriculum-node-label'>{course.title}</span>
                    <span className='teacher-curriculum-node-badge'>{totalLessons} lessons</span>
                </div>
                {isExpanded && (
                    <div className='teacher-curriculum-children'>
                        <p className='teacher-curriculum-description'>{course.description}</p>
                        {course.modules.map(mod => this.renderModule(mod, course.id))}
                    </div>
                )}
            </div>
        );
    }

    protected renderModule(mod: CurriculumModule, courseId: string): React.ReactNode {
        const moduleKey = `${courseId}/${mod.id}`;
        const isExpanded = this.expandedModules.has(moduleKey);

        return (
            <div key={moduleKey} className='teacher-curriculum-node'>
                <div
                    className='teacher-curriculum-node-header teacher-curriculum-module'
                    onClick={() => this.toggleModule(moduleKey)}
                    role='treeitem'
                    aria-expanded={isExpanded}
                >
                    <i className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></i>
                    <i className='codicon codicon-folder'></i>
                    <span className='teacher-curriculum-node-label'>{mod.title}</span>
                    <span className='teacher-curriculum-node-badge'>{mod.lessons.length}</span>
                </div>
                {isExpanded && (
                    <div className='teacher-curriculum-children'>
                        {mod.lessons.map(lesson => this.renderLesson(lesson))}
                    </div>
                )}
            </div>
        );
    }

    protected renderLesson(lesson: LessonManifest): React.ReactNode {
        return (
            <div key={lesson.id} className='teacher-curriculum-node'>
                <div
                    className='teacher-curriculum-node-header teacher-curriculum-lesson'
                    onClick={() => this.onStartLesson(lesson.id)}
                    role='treeitem'
                >
                    <i className='codicon codicon-file-code'></i>
                    <span className='teacher-curriculum-node-label'>{lesson.title}</span>
                    <span className='teacher-curriculum-lesson-time'>
                        <i className='codicon codicon-clock'></i>
                        {lesson.estimatedMinutes}m
                    </span>
                </div>
            </div>
        );
    }

    protected toggleCourse(courseId: string): void {
        if (this.expandedCourses.has(courseId)) {
            this.expandedCourses.delete(courseId);
        } else {
            this.expandedCourses.add(courseId);
        }
        this.update();
    }

    protected toggleModule(moduleKey: string): void {
        if (this.expandedModules.has(moduleKey)) {
            this.expandedModules.delete(moduleKey);
        } else {
            this.expandedModules.add(moduleKey);
        }
        this.update();
    }

    protected onStartLesson(lessonId: string): void {
        this.teacherService.startLesson(lessonId);
    }

    protected onRefresh = (): void => {
        this.loadCurricula();
    };
}
