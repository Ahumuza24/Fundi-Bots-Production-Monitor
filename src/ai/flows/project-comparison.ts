
'use server';

/**
 * @fileOverview This file defines a Genkit flow for comparing two projects.
 *
 * - compareProjects - A function that compares two projects based on their vitals.
 * - CompareProjectsInput - The input type for the compareProjects function.
 * - CompareProjectsOutput - The return type for the compareProjects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectVitalsSchema = z.object({
    name: z.string().describe('The name of the project.'),
    deadline: z.string().describe('The deadline for the project (ISO format).'),
    status: z.string().describe('The current status of the project (e.g., In Progress, On Hold).'),
    progress: z.number().describe('The completion progress of the project as a percentage (0-1).'),
});

const CompareProjectsInputSchema = z.object({
  projectOne: ProjectVitalsSchema.describe('The first project to compare.'),
  projectTwo: ProjectVitalsSchema.describe('The second project to compare.'),
});
export type CompareProjectsInput = z.infer<typeof CompareProjectsInputSchema>;

const CompareProjectsOutputSchema = z.object({
  analysis: z.string().describe('A detailed analysis comparing the two projects, highlighting key differences, risks, and outlooks.'),
});
export type CompareProjectsOutput = z.infer<typeof CompareProjectsOutputSchema>;


export async function compareProjects(
  input: CompareProjectsInput
): Promise<CompareProjectsOutput> {
  return projectComparisonFlow(input);
}

const projectComparisonPrompt = ai.definePrompt({
  name: 'projectComparisonPrompt',
  input: {schema: CompareProjectsInputSchema},
  output: {schema: CompareProjectsOutputSchema},
  prompt: `You are an expert production analyst. Given the vital statistics for two projects, provide a comparative analysis.

Your analysis should be insightful and highlight the key differences. Consider the following aspects:
- **Progress vs. Deadline**: Which project is on track? Which is at risk of falling behind?
- **Status**: What does the current status imply for each project?
- **Overall Outlook**: What is the general outlook for each project? Are there any hidden risks or opportunities?

Provide a concise but comprehensive analysis.

Project A: {{projectOne.name}}
- Deadline: {{projectOne.deadline}}
- Status: {{projectOne.status}}
- Progress: {{projectOne.progress}}%

Project B: {{projectTwo.name}}
- Deadline: {{projectTwo.deadline}}
- Status: {{projectTwo.status}}
- Progress: {{projectTwo.progress}}%

Begin your analysis now:
`,
});

const projectComparisonFlow = ai.defineFlow(
  {
    name: 'projectComparisonFlow',
    inputSchema: CompareProjectsInputSchema,
    outputSchema: CompareProjectsOutputSchema,
  },
  async input => {
    const {output} = await projectComparisonPrompt(input);
    return output!;
  }
);
