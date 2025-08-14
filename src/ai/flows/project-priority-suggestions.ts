'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting the optimal order in which to prioritize projects.
 *
 * - suggestProjectPriority - A function that suggests the optimal project priority order.
 * - ProjectPriorityInput - The input type for the suggestProjectPriority function.
 * - ProjectPriorityOutput - The return type for the suggestProjectPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectPriorityInputSchema = z.object({
  projects: z
    .array(
      z.object({
        name: z.string().describe('The name of the project.'),
        deadline: z.string().describe('The deadline for the project (ISO format).'),
        description: z.string().describe('The description of the project'),
        workers: z.array(z.string()).describe('Names of workers available for the project'),
      })
    )
    .describe('A list of projects to prioritize.'),
  workers: z
    .array(z.string())
    .describe('A list of available workers and their skills/availability.'),
});
export type ProjectPriorityInput = z.infer<typeof ProjectPriorityInputSchema>;

const ProjectPriorityOutputSchema = z.object({
  priorityOrder: z
    .array(z.string())
    .describe('The suggested order of project names to prioritize.'),
  reasoning: z
    .string()
    .describe('The detailed reasoning behind the suggested priority order.'),
});
export type ProjectPriorityOutput = z.infer<typeof ProjectPriorityOutputSchema>;

export async function suggestProjectPriority(
  input: ProjectPriorityInput
): Promise<ProjectPriorityOutput> {
  return projectPriorityFlow(input);
}

const projectPriorityPrompt = ai.definePrompt({
  name: 'projectPriorityPrompt',
  input: {schema: ProjectPriorityInputSchema},
  output: {schema: ProjectPriorityOutputSchema},
  prompt: `You are an expert production manager assistant. Given a list of projects with deadlines and a list of available workers, determine the optimal order in which to prioritize the projects to ensure timely completion and efficient resource allocation.

Projects:
{{#each projects}}
- Name: {{name}}, Deadline: {{deadline}}, Description: {{description}}, Workers: {{workers}}
{{/each}}

Workers:
{{#each workers}}
- {{this}}
{{/each}}

Consider the deadlines of the projects, and the skills and availability of the workers. Provide a clear and concise reasoning for your suggested priority order, and the optimal order of project names in the "priorityOrder" array.

Output in JSON format:
{
  "priorityOrder": ["Project1", "Project2", ...],
  "reasoning": "Explanation of the priority order..."
}
`,
});

const projectPriorityFlow = ai.defineFlow(
  {
    name: 'projectPriorityFlow',
    inputSchema: ProjectPriorityInputSchema,
    outputSchema: ProjectPriorityOutputSchema,
  },
  async input => {
    const {output} = await projectPriorityPrompt(input);
    return output!;
  }
);
