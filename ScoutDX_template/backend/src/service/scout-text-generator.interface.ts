import { JobDraftInput, GeneratedScoutContent } from '../type/workflow';

export interface ScoutTextGenerator {
  generateFromJobDraft(input: JobDraftInput): GeneratedScoutContent;
}
