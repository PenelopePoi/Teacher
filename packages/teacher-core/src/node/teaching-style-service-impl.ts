import { injectable } from '@theia/core/shared/inversify';
import {
    TeachingStyleService,
    TeachingStyle,
    TeachingStyleInfo,
} from '../common/teaching-style-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const TEACHING_STYLE_SERVICE_PATH = '/services/teaching-style';

const STYLE_DESCRIPTIONS: TeachingStyleInfo[] = [
    {
        style: TeachingStyle.SOCRATIC,
        label: 'Socratic',
        description: 'Asks guiding questions to lead you to discover answers on your own. Best for deep understanding.',
    },
    {
        style: TeachingStyle.DIRECT,
        label: 'Direct',
        description: 'Gives clear, concise explanations with minimal back-and-forth. Best when you need quick answers.',
    },
    {
        style: TeachingStyle.EXAMPLE_FIRST,
        label: 'Example First',
        description: 'Shows a working example first, then explains the concepts behind it. Best for visual learners.',
    },
    {
        style: TeachingStyle.ANALOGY_HEAVY,
        label: 'Analogy Heavy',
        description: 'Uses analogies and metaphors to map new concepts to things you already know. Best for abstract topics.',
    },
    {
        style: TeachingStyle.PROJECT_BASED,
        label: 'Project Based',
        description: 'Teaches through building a real project step-by-step. Best for hands-on learners.',
    },
];

@injectable()
export class TeachingStyleServiceImpl implements TeachingStyleService {

    protected storePath(): string {
        return path.join(os.homedir(), '.teacher', 'teaching-style.json');
    }

    async getPreferredStyle(): Promise<TeachingStyle> {
        try {
            const raw = fs.readFileSync(this.storePath(), 'utf-8');
            const data = JSON.parse(raw);
            if (data.style && Object.values(TeachingStyle).includes(data.style)) {
                return data.style as TeachingStyle;
            }
        } catch {
            // default
        }
        return TeachingStyle.SOCRATIC;
    }

    async setPreferredStyle(style: TeachingStyle): Promise<void> {
        const dir = path.dirname(this.storePath());
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const tmp = this.storePath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify({ style, updatedAt: new Date().toISOString() }), 'utf-8');
        fs.renameSync(tmp, this.storePath());
        console.info(`[TeachingStyle] Preferred style set to: ${style}`);
    }

    async getAvailableStyles(): Promise<TeachingStyleInfo[]> {
        return STYLE_DESCRIPTIONS;
    }
}
