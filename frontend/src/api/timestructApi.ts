import type { SolutionStructureType } from "../types/SolutionStructureType.ts";
import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";
import { apiUrl } from "./api.ts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return await response.json() as Promise<T>;
}

export function fetchJobList(): Promise<string[]> {
  return fetchJson<string[]>(apiUrl("/jobs"));
}

export function fetchSolutionStructure(jobId: string): Promise<SolutionStructureType> {
  return fetchJson<SolutionStructureType>(apiUrl(`/${jobId}/solution-structure`));
}

export function fetchScoreExplanation(jobId: string): Promise<ScoreExplanationType> {
  return fetchJson<ScoreExplanationType>(apiUrl(`/${jobId}/score-explanation`));
}