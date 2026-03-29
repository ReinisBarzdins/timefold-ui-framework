import { useQuery } from "@tanstack/react-query";
import { fetchScoreExplanation } from "../api/timestructApi.ts";
import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";

export const useScoreExplanation = (id: string) =>
  useQuery<ScoreExplanationType, Error>({
    queryKey: ["jobSolutionScore", id],
    queryFn: async () => fetchScoreExplanation(id),
  });