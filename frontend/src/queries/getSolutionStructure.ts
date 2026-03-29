import { useQuery } from "@tanstack/react-query";
import { fetchSolutionStructure } from "../api/timestructApi.ts";
import type { SolutionStructureType } from "../types/SolutionStructureType.ts";

export const useSolutionStructure = (id: string) =>
  useQuery<SolutionStructureType, Error>({
    queryKey: ["jobSolutionStructure", id],
    queryFn: async () => fetchSolutionStructure(id),
  });