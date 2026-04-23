import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchScoreExplanation } from "../api/timestructApi.ts";
import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";

type ScoreExplanationQueryOptions = Omit<
  UseQueryOptions<
    ScoreExplanationType,
    Error,
    ScoreExplanationType,
    ["jobSolutionScore", string]
  >,
  "queryKey" | "queryFn"
>;

export const useScoreExplanation = (
  id: string,
  options?: ScoreExplanationQueryOptions,
) =>
  useQuery<
    ScoreExplanationType,
    Error,
    ScoreExplanationType,
    ["jobSolutionScore", string]
  >({
    queryKey: ["jobSolutionScore", id],
    queryFn: async () => fetchScoreExplanation(id),
    enabled: !!id,
    ...options,
  });