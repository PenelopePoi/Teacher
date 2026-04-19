import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

/**
 * Canvas Review — before/after visual diff for beginners.
 *
 * Two-panel split with draggable divider showing rendered HTML
 * before and after a change, with accept/reject controls.
 */

const BEFORE_HTML = `
<div style="padding:20px;border-radius:8px;background:#1A1D22;border:1px solid #24282F;font-family:system-ui,sans-serif;max-width:280px;">
    <h3 style="margin:0 0 8px;color:#F2F4F7;font-size:16px;">User Profile</h3>
    <p style="margin:0 0 12px;color:#B8BEC7;font-size:13px;">View and manage your account settings and preferences.</p>
    <div style="display:flex;gap:8px;align-items:center;">
        <span style="width:32px;height:32px;border-radius:50%;background:#24282F;display:inline-flex;align-items:center;justify-content:center;color:#7A828E;font-size:14px;">AX</span>
        <span style="color:#B8BEC7;font-size:13px;">alex@example.com</span>
    </div>
</div>
`;

const AFTER_HTML = `
<div style="padding:20px;border-radius:8px;background:#1A1D22;border:1px solid #24282F;font-family:system-ui,sans-serif;max-width:280px;">
    <h3 style="margin:0 0 8px;color:#F2F4F7;font-size:16px;">User Profile</h3>
    <p style="margin:0 0 12px;color:#B8BEC7;font-size:13px;">View and manage your account settings and preferences.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <span style="width:32px;height:32px;border-radius:50%;background:#24282F;display:inline-flex;align-items:center;justify-content:center;color:#7A828E;font-size:14px;">AX</span>
        <span style="color:#B8BEC7;font-size:13px;">alex@example.com</span>
    </div>
    <button style="padding:8px 18px;background:#E8A948;color:#0B0D10;border:none;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;transition:background 0.15s ease;">Save Changes</button>
</div>
`;

@injectable()
export class CanvasReviewWidget extends ReactWidget {

    static readonly ID = 'teacher-canvas-review';
    static readonly LABEL = nls.localize('theia/teacher/canvasReview', 'Visual Review');

    protected splitPercent: number = 50;
    protected isDragging: boolean = false;
    protected viewMode: 'split' | 'slider' = 'split';
    protected sliderPercent: number = 50;

    @postConstruct()
    protected init(): void {
        this.id = CanvasReviewWidget.ID;
        this.title.label = CanvasReviewWidget.LABEL;
        this.title.caption = CanvasReviewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-split-horizontal';
        this.addClass('teacher-canvas-review');
    }

    protected handleAccept = (): void => {
        console.info('Canvas review: accepted');
    };

    protected handleReject = (): void => {
        console.info('Canvas review: rejected');
    };

    protected handleToggleViewMode = (): void => {
        this.viewMode = this.viewMode === 'split' ? 'slider' : 'split';
        this.update();
    };

    protected handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.sliderPercent = Number(e.target.value);
        this.update();
    };

    protected handleMouseDown = (e: React.MouseEvent): void => {
        e.preventDefault();
        this.isDragging = true;
        const onMouseMove = (ev: MouseEvent): void => {
            if (!this.isDragging) {
                return;
            }
            const container = this.node.querySelector('.teacher-canvas-review-panels') as HTMLElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                const pct = Math.max(20, Math.min(80, ((ev.clientX - rect.left) / rect.width) * 100));
                this.splitPercent = pct;
                this.update();
            }
        };
        const onMouseUp = (): void => {
            this.isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    protected render(): React.ReactNode {
        return (
            <div className='teacher-canvas-review-container'>
                {this.renderTopBar()}
                {this.viewMode === 'split' ? this.renderSplitView() : this.renderSliderView()}
                {this.renderSummary()}
                {this.renderExplanation()}
            </div>
        );
    }

    protected renderSplitView(): React.ReactNode {
        return (
            <div className='teacher-canvas-review-panels'>
                <div className='teacher-canvas-review-panel teacher-canvas-review-panel--before' style={{ width: `${this.splitPercent}%` }}>
                    <div className='teacher-canvas-review-panel-label'>
                        {nls.localize('theia/teacher/canvasBefore', 'Before')}
                    </div>
                    <div className='teacher-canvas-review-panel-content' dangerouslySetInnerHTML={{ __html: BEFORE_HTML }} />
                    <span className='teacher-canvas-review-file-badge'>
                        <i className='codicon codicon-file' />
                        src/components/ProfileCard.tsx
                    </span>
                </div>
                <div
                    className='teacher-canvas-review-divider'
                    onMouseDown={this.handleMouseDown}
                />
                <div className='teacher-canvas-review-panel teacher-canvas-review-panel--after' style={{ width: `${100 - this.splitPercent}%` }}>
                    <div className='teacher-canvas-review-panel-label'>
                        {nls.localize('theia/teacher/canvasAfter', 'After')}
                    </div>
                    <div className='teacher-canvas-review-panel-content' dangerouslySetInnerHTML={{ __html: AFTER_HTML }} />
                    <span className='teacher-canvas-review-file-badge'>
                        <i className='codicon codicon-file' />
                        src/components/ProfileCard.tsx
                    </span>
                </div>
            </div>
        );
    }

    protected renderSliderView(): React.ReactNode {
        return (
            <div className='teacher-canvas-review-slider-container'>
                <div className='teacher-canvas-review-slider-stack'>
                    <div className='teacher-canvas-review-slider-layer teacher-canvas-review-slider-layer--after'>
                        <div className='teacher-canvas-review-panel-content' dangerouslySetInnerHTML={{ __html: AFTER_HTML }} />
                    </div>
                    <div
                        className='teacher-canvas-review-slider-layer teacher-canvas-review-slider-layer--before'
                        style={{ clipPath: `inset(0 ${100 - this.sliderPercent}% 0 0)` }}
                    >
                        <div className='teacher-canvas-review-panel-content' dangerouslySetInnerHTML={{ __html: BEFORE_HTML }} />
                    </div>
                    <div
                        className='teacher-canvas-review-slider-line'
                        style={{ left: `${this.sliderPercent}%` }}
                    />
                </div>
                <div className='teacher-canvas-review-slider-controls'>
                    <span className='teacher-canvas-review-slider-label-left'>
                        {nls.localize('theia/teacher/canvasBefore', 'Before')}
                    </span>
                    <input
                        type='range'
                        className='teacher-canvas-review-slider-input'
                        min={0}
                        max={100}
                        value={this.sliderPercent}
                        onChange={this.handleSliderChange}
                    />
                    <span className='teacher-canvas-review-slider-label-right'>
                        {nls.localize('theia/teacher/canvasAfter', 'After')}
                    </span>
                </div>
            </div>
        );
    }

    protected renderTopBar(): React.ReactNode {
        return (
            <div className='teacher-canvas-review-topbar'>
                <span className='teacher-canvas-review-label-before'>
                    {nls.localize('theia/teacher/canvasBefore', 'Before')}
                </span>
                <span className='teacher-canvas-review-slider-label'>
                    <i className='codicon codicon-split-horizontal' />
                </span>
                <span className='teacher-canvas-review-label-after'>
                    {nls.localize('theia/teacher/canvasAfter', 'After')}
                </span>
                <div className='teacher-canvas-review-topbar-actions'>
                    <button
                        type='button'
                        className={`teacher-canvas-review-btn teacher-canvas-review-btn--mode ${this.viewMode === 'slider' ? 'teacher-canvas-review-btn--active' : ''}`}
                        onClick={this.handleToggleViewMode}
                        title={nls.localize('theia/teacher/canvasToggleSlider', 'Toggle slider mode')}
                    >
                        <i className='codicon codicon-screen-full' />
                        {nls.localize('theia/teacher/canvasSlider', 'Slider')}
                    </button>
                    <button
                        type='button'
                        className='teacher-canvas-review-btn teacher-canvas-review-btn--accept'
                        onClick={this.handleAccept}
                    >
                        <i className='codicon codicon-check' />
                        {nls.localize('theia/teacher/canvasAccept', 'Accept')}
                    </button>
                    <button
                        type='button'
                        className='teacher-canvas-review-btn teacher-canvas-review-btn--reject'
                        onClick={this.handleReject}
                    >
                        <i className='codicon codicon-close' />
                        {nls.localize('theia/teacher/canvasReject', 'Reject')}
                    </button>
                </div>
            </div>
        );
    }

    protected renderSummary(): React.ReactNode {
        return (
            <div className='teacher-canvas-review-summary'>
                <span className='teacher-canvas-review-stat teacher-canvas-review-stat--added'>+12 lines</span>
                <span className='teacher-canvas-review-stat teacher-canvas-review-stat--removed'>-3 lines</span>
                <span className='teacher-canvas-review-stat'>2 files changed</span>
            </div>
        );
    }

    protected renderExplanation(): React.ReactNode {
        return (
            <React.Fragment>
                <div className='teacher-ai-explanation'>
                    <div className='teacher-ai-explanation-header'>
                        <i className='codicon codicon-lightbulb' />
                        <span className='teacher-ai-explanation-title'>
                            {nls.localize('theia/teacher/aiExplanation', 'AI Explanation')}
                        </span>
                    </div>
                    <p className='teacher-ai-explanation-text'>
                        {nls.localize(
                            'theia/teacher/canvasAIExplanation',
                            "I added a 'Save Changes' button to the profile card. This gives users a clear call-to-action to persist their changes. The button uses the amber accent color for visual prominence and includes a hover transition for polish. The margin-bottom on the avatar row creates breathing room above the new button."
                        )}
                    </p>
                </div>
                <div className='teacher-ai-confidence-meter'>
                    <span className='teacher-ai-confidence-label'>
                        {nls.localize('theia/teacher/aiConfidenceLabel', 'AI is fairly confident about this change')}
                    </span>
                    <div className='teacher-ai-confidence-bar-wrap'>
                        <div className='teacher-ai-confidence-bar-fill' style={{ width: '87%' }}></div>
                    </div>
                    <span className='teacher-ai-confidence'>87%</span>
                </div>
            </React.Fragment>
        );
    }
}
