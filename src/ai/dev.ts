import { config } from 'dotenv';
config();

import '@/ai/flows/worker-project-matching.ts';
import '@/ai/flows/project-priority-suggestions.ts';