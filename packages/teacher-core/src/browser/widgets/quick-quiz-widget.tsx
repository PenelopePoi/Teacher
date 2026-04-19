import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

type QuestionType = 'multiple-choice' | 'code-completion';

interface QuizQuestion {
    readonly id: string;
    readonly type: QuestionType;
    readonly question: string;
    readonly options?: string[];
    readonly codeSnippet?: string;
    readonly correctIndex: number;
    readonly explanation: string;
    readonly concept: string;
}

interface QuizState {
    selectedAnswer: number | undefined;
    answered: boolean;
}

const DEMO_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What does Array.prototype.filter() return?',
        options: [
            'The first element that matches',
            'A new array with elements that pass the test',
            'A boolean indicating if any element matches',
            'The original array, modified in place',
        ],
        correctIndex: 1,
        explanation: 'filter() creates a new array containing only elements for which the callback returns true. The original array is not modified.',
        concept: 'Array Methods',
    },
    {
        id: 'q2',
        type: 'code-completion',
        question: 'Complete the async function to fetch and return JSON data:',
        codeSnippet: 'async function getData(url) {\n  const response = await fetch(url);\n  return _______________;\n}',
        options: [
            'response.text()',
            'response.json()',
            'JSON.parse(response)',
            'await response',
        ],
        correctIndex: 1,
        explanation: 'response.json() parses the response body as JSON. It returns a promise, but since we are in an async function, the caller will await the result.',
        concept: 'Promises & Async/Await',
    },
    {
        id: 'q3',
        type: 'multiple-choice',
        question: 'In CSS Grid, what does grid-template-columns: repeat(3, 1fr) create?',
        options: [
            'Three rows of equal height',
            'Three columns of equal width',
            'A 3x3 grid',
            'Three columns with 1px width',
        ],
        correctIndex: 1,
        explanation: 'repeat(3, 1fr) creates three columns that each take up an equal fraction (1fr) of the available space.',
        concept: 'CSS Grid',
    },
];

@injectable()
export class QuickQuizWidget extends ReactWidget {

    static readonly ID = 'teacher-quick-quiz';
    static readonly LABEL = nls.localize('theia/teacher/quickQuiz', 'Quick Quiz');

    protected questions: QuizQuestion[] = DEMO_QUESTIONS;
    protected quizStates: Map<string, QuizState> = new Map();
    protected currentIndex: number = 0;

    @postConstruct()
    protected init(): void {
        this.id = QuickQuizWidget.ID;
        this.title.label = QuickQuizWidget.LABEL;
        this.title.caption = QuickQuizWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-beaker';
        this.addClass('teacher-quick-quiz');
        this.update();
    }

    protected getState(questionId: string): QuizState {
        if (!this.quizStates.has(questionId)) {
            this.quizStates.set(questionId, { selectedAnswer: undefined, answered: false });
        }
        return this.quizStates.get(questionId)!;
    }

    protected handleSelectAnswer = (questionId: string, index: number): void => {
        const state = this.getState(questionId);
        if (state.answered) {
            return;
        }
        state.selectedAnswer = index;
        state.answered = true;
        this.update();
    };

    protected handleNextQuestion = (): void => {
        this.currentIndex = (this.currentIndex + 1) % this.questions.length;
        this.update();
    };

    protected handleResetQuiz = (): void => {
        this.quizStates.clear();
        this.currentIndex = 0;
        this.update();
    };

    protected render(): React.ReactNode {
        const answeredCount = Array.from(this.quizStates.values()).filter(s => s.answered).length;
        const correctCount = Array.from(this.quizStates.entries()).filter(([qId, s]) => {
            const q = this.questions.find(qq => qq.id === qId);
            return s.answered && q && s.selectedAnswer === q.correctIndex;
        }).length;

        return (
            <div className='teacher-quick-quiz-container'>
                <div className='teacher-quick-quiz-header'>
                    <h2 className='teacher-quick-quiz-title'>
                        <i className='codicon codicon-beaker'></i>
                        {nls.localize('theia/teacher/quickQuizTitle', 'Quick Quiz')}
                    </h2>
                    <div className='teacher-quick-quiz-score'>
                        <span className='teacher-quick-quiz-score-text'>
                            {nls.localize('theia/teacher/quizScore', '{0}/{1} correct', correctCount, answeredCount)}
                        </span>
                        <button
                            type='button'
                            className='teacher-quick-quiz-reset-btn'
                            onClick={this.handleResetQuiz}
                            title={nls.localize('theia/teacher/quizReset', 'Reset quiz')}
                        >
                            <i className='codicon codicon-refresh'></i>
                        </button>
                    </div>
                </div>
                <div className='teacher-quick-quiz-progress'>
                    {this.questions.map((q, i) => {
                        const state = this.quizStates.get(q.id);
                        const isCorrect = state?.answered && state.selectedAnswer === q.correctIndex;
                        const isWrong = state?.answered && state.selectedAnswer !== q.correctIndex;
                        return (
                            <span
                                key={q.id}
                                className={`teacher-quick-quiz-dot ${i === this.currentIndex ? 'teacher-quick-quiz-dot--current' : ''} ${isCorrect ? 'teacher-quick-quiz-dot--correct' : ''} ${isWrong ? 'teacher-quick-quiz-dot--wrong' : ''}`}
                            ></span>
                        );
                    })}
                </div>
                {this.renderQuestion(this.questions[this.currentIndex])}
            </div>
        );
    }

    protected renderQuestion(question: QuizQuestion): React.ReactNode {
        const state = this.getState(question.id);
        const isCorrect = state.answered && state.selectedAnswer === question.correctIndex;

        return (
            <div className='teacher-quick-quiz-question'>
                <div className='teacher-quick-quiz-question-header'>
                    <span className='teacher-quick-quiz-concept-badge'>
                        <i className='codicon codicon-tag'></i>
                        {question.concept}
                    </span>
                    <span className='teacher-quick-quiz-type-badge'>
                        {question.type === 'code-completion'
                            ? nls.localize('theia/teacher/quizCodeCompletion', 'Code Completion')
                            : nls.localize('theia/teacher/quizMultipleChoice', 'Multiple Choice')}
                    </span>
                </div>
                <p className='teacher-quick-quiz-question-text'>{question.question}</p>
                {question.codeSnippet && (
                    <pre className='teacher-quick-quiz-code-snippet'>{question.codeSnippet}</pre>
                )}
                <div className='teacher-quick-quiz-options'>
                    {question.options?.map((option, i) => {
                        const isSelected = state.selectedAnswer === i;
                        const isCorrectOption = i === question.correctIndex;
                        let optionClass = 'teacher-quick-quiz-option';
                        if (state.answered) {
                            if (isCorrectOption) {
                                optionClass += ' teacher-quick-quiz-option--correct';
                            } else if (isSelected) {
                                optionClass += ' teacher-quick-quiz-option--wrong';
                            }
                        } else if (isSelected) {
                            optionClass += ' teacher-quick-quiz-option--selected';
                        }
                        return (
                            <button
                                key={i}
                                type='button'
                                className={optionClass}
                                onClick={() => this.handleSelectAnswer(question.id, i)}
                                disabled={state.answered}
                            >
                                <span className='teacher-quick-quiz-option-letter'>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className='teacher-quick-quiz-option-text'>{option}</span>
                                {state.answered && isCorrectOption && (
                                    <i className='codicon codicon-pass-filled teacher-quick-quiz-option-icon'></i>
                                )}
                                {state.answered && isSelected && !isCorrectOption && (
                                    <i className='codicon codicon-error teacher-quick-quiz-option-icon'></i>
                                )}
                            </button>
                        );
                    })}
                </div>
                {state.answered && (
                    <div className={`teacher-quick-quiz-feedback ${isCorrect ? 'teacher-quick-quiz-feedback--correct' : 'teacher-quick-quiz-feedback--wrong'}`}>
                        <i className={`codicon ${isCorrect ? 'codicon-pass-filled' : 'codicon-info'}`}></i>
                        <span>{question.explanation}</span>
                    </div>
                )}
                <div className='teacher-quick-quiz-nav'>
                    <button
                        type='button'
                        className='teacher-quick-quiz-next-btn'
                        onClick={this.handleNextQuestion}
                    >
                        {nls.localize('theia/teacher/quizNext', 'Next Question')}
                        <i className='codicon codicon-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }
}
