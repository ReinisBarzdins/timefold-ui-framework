import type { SolutionStructureType } from "../types/SolutionStructureType.ts";
import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchJobList(): Promise<string[]> {
  return fetchJson<string[]>("/timestruct");
}

export function fetchJob(jobId: string): Promise<unknown> {
  return fetchJson<unknown>(`/timestruct/${jobId}`);
}

export function fetchSolutionStructure(jobId: string): Promise<SolutionStructureType> {
  return fetchJson<SolutionStructureType>(`/timestruct/${jobId}/solution-structure`);
}

export function fetchScoreExplanation(jobId: string): Promise<ScoreExplanationType> {
  return fetchJson<ScoreExplanationType>(`/timestruct/${jobId}/score-explanation`);
}