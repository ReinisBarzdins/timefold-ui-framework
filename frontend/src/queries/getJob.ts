import { useQuery } from "@tanstack/react-query";
import { fetchJob } from "../api/timestructApi.ts";

export const useJob = (id: string) =>
  useQuery<unknown, Error>({
    queryKey: ["job", id],
    queryFn: async () => fetchJob(id),
  });