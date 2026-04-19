import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { LanguageModelRequirement } from '@theia/ai-core/lib/common';
import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';

export const ExplainAgentId = 'teacher-explain';

const EXPLAIN_SYSTEM_PROMPT = `You are the Explain agent in the Teacher IDE. When a student selects code and asks for an explanation, you provide a structured breakdown.

## Response Format
Always structure your explanation in these four sections:

### What
What does this code do? One or two sentences, plain language.

### Why
Why is it written this way? What problem does it solve? What would happen without it?

### How
Step-by-step walkthrough of how the code works. Use line references.

### Try It
A small modification or experiment the student can try to deepen understanding. Frame it as a question:
"What happens if you change X to Y? Try it and see."

## Rules
- Match explanation depth to the student's level
- Use analogies when helpful
- Highlight any patterns or idioms (e.g., "this is the Observer pattern")
- If the code has issues, note them gently as learning opportunities
- Keep it concise — max 300 words per section`;

@injectable()
export class ExplainAgent extends AbstractStreamParsingChatAgent {
    name = 'Explain This';
    id = ExplainAgentId;
    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/code',
    }];
    protected defaultLanguageModelPurpose: string = 'chat';

    override description = nls.localize('theia/teacher/explain/description',
        'Select code and get a structured explanation: What it does, Why, How it works, and what to Try.');

    override prompts = [{
        id: 'teacher-explain-system',
        defaultVariant: { id: 'teacher-explain-system-default', template: EXPLAIN_SYSTEM_PROMPT },
        variants: []
    }];
    protected override systemPromptId: string = 'teacher-explain-system';
    override iconClass: string = 'codicon codicon-lightbulb';
    override tags: string[] = ['teacher', 'explain', 'education'];
}
