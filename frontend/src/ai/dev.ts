import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-call.ts';
import '@/ai/flows/extract-key-points.ts';
import '@/ai/flows/transcribe-call.ts';