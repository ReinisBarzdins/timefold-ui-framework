import { type FC, useState } from "react";
import { useJob } from "../queries/getJob.ts";
import { useScoreExplanation } from "../queries/getScoreExplanation.ts";
import { useSolutionStructure } from "../queries/getSolutionStructure.ts";
import { prepareSolutionData } from "../helpers/prepareSolutionData.ts";
import { SolutionTable } from "./SolutionTable.tsx";

type MainContent = {
  selectedJobId: string;
};

export const MainContent: FC<MainContent> = ({
  selectedJobId,
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(null);
  const { data: job } = useJob(selectedJobId);
  const { data: score } = useScoreExplanation(selectedJobId);
  const { data: solver } = useSolutionStructure(selectedJobId);

  if (!solver) return null;

  const solutionData = prepareSolutionData(solver);

  console.log("solData", solutionData)

  const tableTabs =
    solutionData === null
      ? null
      : solutionData.map((solution) => solution.tabName);

  if (tableTabs === null || solutionData === null) return null;

  const indictmentByLabel = Object.fromEntries(
    (score?.indictments ?? []).map((item) => [item.object, item.impactTotal])
  );
  
  return (
    <main style={{ padding: "24px", flex: 1 }}>
      <div>
        <span>Selected Job:</span>
        <span>{selectedJobId}</span>
      </div>
      <div>
        {tableTabs.map((tab, index) => (
          <button type="button" onClick={() => setSelectedTabIndex(index)}>{tab}</button>
        ))}
      </div>
      <div>
        {selectedTabIndex !== null && (
          <SolutionTable
            solutionData={solutionData[selectedTabIndex]}
            indictmentByLabel={indictmentByLabel}
          />
        )}
      </div>
    </main>
  );
};