import { useState } from "react";
import { useJobList } from "../queries/getJobList.ts";
import { JobSidebar } from "../components/JobSidebar.tsx";
import { MainContent } from "../components/MainContent.tsx";

const Timestruct = () => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data, isLoading, error } = useJobList();

  return (
    <div style={{ display: "flex" }}>
      <JobSidebar
        jobs={data ?? []}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        isLoading={isLoading}
        error={error?.message ?? null}
      />
      {selectedJobId && (
        <MainContent selectedJobId={selectedJobId}/>
      )}
    </div>
  );
}

export default Timestruct;