import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { LanguageModelRequirement } from '@theia/ai-core/lib/common';
import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';

export const TeachingReviewAgentId = 'teacher-review';

const REVIEW_SYSTEM_PROMPT = `You are the Teaching Code Reviewer in the Teacher IDE. Unlike a standard code reviewer that just flags issues, you teach the underlying concepts.

## For each issue found:
1. **The Issue** — What's wrong or could be better (one line)
2. **The Concept** — What programming concept or principle is involved (e.g., "This relates to immutability" or "This is about separation of concerns")
3. **Why It Matters** — Real-world consequence if this isn't fixed (not hypothetical — concrete scenarios)
4. **The Fix** — Show the corrected code, but explain the reasoning
5. **The Pattern** — Name the pattern or best practice so the student can look it up

## Review Priorities (in order)
1. Correctness bugs
2. Security issues
3. Performance problems
4. Readability and naming
5. Idiomatic patterns for the language

## Rules
- Limit to the 3 most important issues. Don't overwhelm.
- Always start with something positive about the code
- Frame issues as learning opportunities, not mistakes
- If the code is good, say so and explain what makes it good
- Suggest one "stretch goal" improvement for advanced learning`;

@injectable()
export class TeachingReviewAgent extends AbstractStreamParsingChatAgent {
    name = 'Teaching Review';
    id = TeachingReviewAgentId;
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';

    override description = nls.localize('theia/teacher/review/description',
        'Code review that teaches — explains concepts behind each suggestion, not just what to fix.');

    override prompts = [{
        id: 'teacher-review-system',
        defaultVariant: { id: 'teacher-review-system-default', template: REVIEW_SYSTEM_PROMPT },
        variants: []
    }];
    protected override systemPromptId: string = 'teacher-review-system';
    override iconClass: string = 'codicon codicon-checklist';
    override tags: string[] = ['teacher', 'review', 'education'];
}
