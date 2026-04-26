import { type FC, useState } from "react";
import classNames from "classnames";
import { useScoreExplanation } from "../queries/getScoreExplanation.ts";
import { useSolutionStructure } from "../queries/getSolutionStructure.ts";
import { prepareSolutionData } from "../helpers/prepareSolutionData.ts";
import { SolutionTable } from "./SolutionTable.tsx";
import { prepareScoreData } from "../helpers/prepareScoreData.ts";
import { ScoreExplanation } from "./ScoreExplanation.tsx";
import { prepareProblemFacts } from "../helpers/prepareProblemFacts.ts";
import { ProblemFacts } from "./ProblemFacts.tsx";

import styles from "./MainContent.module.scss";

type MainContent = {
  selectedJobId: string;
};

export const MainContent: FC<MainContent> = ({
  selectedJobId,
}) => {
  const [openTabIndex, setOpenTabIndex] = useState<number | null>(null);

  const { data: solver } = useSolutionStructure(selectedJobId);

  const isSolvingActive = solver?.solverStatus === "SOLVING_ACTIVE";

  const { data: score } = useScoreExplanation(selectedJobId, {
    refetchInterval: isSolvingActive ? 5000 : false,
  });

  const { data: solverWithPolling } = useSolutionStructure(selectedJobId, {
    refetchInterval: isSolvingActive ? 5000 : false,
  });
  
  const toggleTab = (index: number) => {
    setOpenTabIndex((prev) => (prev === index ? null : index));
  };

  if (!solverWithPolling) return null;

  const scoreByLabel = prepareScoreData(score);
  const solutionData = prepareSolutionData(solverWithPolling, scoreByLabel);
  const problemFacts = prepareProblemFacts(solverWithPolling);

  const tableTabs =
    solutionData === null
      ? null
      : solutionData.map((solution) => solution.tabName);

  if (tableTabs === null || solutionData === null) return null;

  const indictmentByLabel = Object.fromEntries(
    (score?.indictments ?? []).map((item) => [item.object, item.impactTotal])
  );

  return (
    <main className={styles.mainContent} style={{ padding: "24px", flex: 1 }}>
      <div>
        <span className={styles.title}>Selected Job: </span>
        <span className={styles.jobText}>{selectedJobId}</span>
      </div>
      <div>
        <span className={styles.title}>Solver status: </span>
        <span className={styles.jobText}>{solverWithPolling.solverStatus ?? "Unknown"}</span>
      </div>
      <div className={styles.scoreContainer}>
        <div>
          <span className={styles.title}>Score: </span>
        </div>
        <ScoreExplanation score={score}/>
      </div>
      <div className={styles.entitiesContainer}>
        <div>
          <span className={styles.title}>Tables: </span>
        </div>
        <div className={styles.entitiesButtons}>
          {tableTabs.map((tab, index) => (
            <button
              key={tab}
              className={classNames(
                styles.entitiesButton,
                openTabIndex === index && styles.entitiesButtonActive
              )}
              type="button"
              onClick={() => toggleTab(index)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div>
        {solutionData.map((solution, index) =>
          openTabIndex === index ? (
            <SolutionTable
              key={solution.tabName}
              solutionData={solution}
              indictmentByLabel={indictmentByLabel}
            />
          ) : null
        )}
      </div>
      <div>
        <ProblemFacts problemFactGroups={problemFacts}/>
      </div>
    </main>
  );
};