'use server';

/**
 * @fileOverview An AI agent that matches workers to projects based on their skills, availability, and past performance.
 *
 * - matchWorkerToProject - A function that handles the worker-project matching process.
 * - MatchWorkerToProjectInput - The input type for the matchWorkerToProject function.
 * - MatchWorkerToProjectOutput - The return type for the matchWorkerToProject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchWorkerToProjectInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to be assigned.'),
  workerPool: z.array(z.object({
    workerId: z.string().describe('The ID of the worker.'),
    skills: z.array(z.string()).describe('The skills of the worker.'),
    availability: z.string().describe('The availability of the worker (e.g., hours per week).'),
    pastPerformance: z.number().describe('A numerical representation of the worker\'s past performance (e.g., completion rate).'),
  })).describe('An array of workers to consider for the project assignment.'),
  projectDeadline: z.string().describe('The deadline for the project (e.g., YYYY-MM-DD).'),
  projectDescription: z.string().describe('A description of the project, including its requirements and goals.'),
  skillsRequired: z.array(z.string()).describe('An array of strings that define the skills required for the project'),
});
export type MatchWorkerToProjectInput = z.infer<typeof MatchWorkerToProjectInputSchema>;

const MatchWorkerToProjectOutputSchema = z.object({
  workerId: z.string().describe('The ID of the worker most likely to complete the project on time.'),
  reasoning: z.string().describe('The reasoning behind the worker selection, considering skills, availability, and past performance.'),
});
export type MatchWorkerToProjectOutput = z.infer<typeof MatchWorkerToProjectOutputSchema>;

export async function matchWorkerToProject(input: MatchWorkerToProjectInput): Promise<MatchWorkerToProjectOutput> {
  return matchWorkerToProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchWorkerToProjectPrompt',
  input: {schema: MatchWorkerToProjectInputSchema},
  output: {schema: MatchWorkerToProjectOutputSchema},
  prompt: `You are a production manager tasked with assigning workers to projects.  Given a project description, 
a list of available workers with their skills, availability, and past performance, and the project deadline, 
you must select the worker most likely to complete the project on time.

Project Description: {{{projectDescription}}}
Project Deadline: {{{projectDeadline}}}
Skills Required: {{#each skillsRequired}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Available Workers:
{{#each workerPool}}
  Worker ID: {{{workerId}}}
  Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Availability: {{{availability}}}
  Past Performance: {{{pastPerformance}}}
{{/each}}

Based on this information, select the worker ID most likely to complete the project on time, and explain your reasoning.

Worker ID:`, //Crucially, the LLM decides _when and if_ to use a tool based on the context of the prompt.
});

const matchWorkerToProjectFlow = ai.defineFlow(
  {
    name: 'matchWorkerToProjectFlow',
    inputSchema: MatchWorkerToProjectInputSchema,
    outputSchema: MatchWorkerToProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
