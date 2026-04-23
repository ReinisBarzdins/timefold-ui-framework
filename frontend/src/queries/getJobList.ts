import { useQuery } from "@tanstack/react-query";
import { fetchJobList } from "../api/timestructApi.ts";

export const useJobList = () =>
  useQuery<string[], Error>({
    queryKey: ["jobList"],
    queryFn: fetchJobList,
  });