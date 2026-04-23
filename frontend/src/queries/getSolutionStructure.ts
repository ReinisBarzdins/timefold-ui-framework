import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchSolutionStructure } from "../api/timestructApi.ts";
import type { SolutionStructureType } from "../types/SolutionStructureType.ts";

type SolutionStructureQueryOptions = Omit<
  UseQueryOptions<
    SolutionStructureType,
    Error,
    SolutionStructureType,
    ["jobSolutionStructure", string]
  >,
  "queryKey" | "queryFn"
>;

export const useSolutionStructure = (
  id: string,
  options?: SolutionStructureQueryOptions,
) =>
  useQuery<
    SolutionStructureType,
    Error,
    SolutionStructureType,
    ["jobSolutionStructure", string]
  >({
    queryKey: ["jobSolutionStructure", id],
    queryFn: async () => fetchSolutionStructure(id),
    enabled: !!id,
    ...options,
  });