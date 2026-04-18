import { useMemo, useState } from "react";
import { prepareScoreSummary } from "../helpers/prepareScoreSummary.ts";

import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";
import styles from "./ScoreExplanation.module.scss";

type ScoreSummaryProps = {
  score?: ScoreExplanationType | null;
};

const parseScoreLevels = (scoreText: string): Array<{ level: string; value: number }> => {
  const matches = scoreText.match(/-?\d+[A-Za-z]+/g) ?? [];

  return matches.map((part) => {
    const valueMatch = part.match(/-?\d+/);
    const levelMatch = part.match(/[A-Za-z]+/);

    return {
      level: levelMatch ? levelMatch[0] : "score",
      value: valueMatch ? Number(valueMatch[0]) : 0,
    };
  });
};

const formatScoreLevels = (scoreText: string) => {
  return parseScoreLevels(scoreText)
    .map(({ value, level }) => `${value} ${level}`)
    .join(" / ");
};

export const ScoreExplanation = ({ score }: ScoreSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { activeConstraints } = prepareScoreSummary(score);

  const formattedTotalScore = useMemo(() => {
    return score?.score ? formatScoreLevels(score.score) : null;
  }, [score]);

  if (!score || !formattedTotalScore) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.summaryButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Score: {formattedTotalScore}
      </button>

      {isOpen && (
        <div className={styles.popup}>
          <h3 className={styles.title}>Score explanation</h3>

          <div className={styles.total}>
            Total: {formattedTotalScore}
          </div>

          {activeConstraints.length === 0 ? (
            <div className={styles.empty}>No active constraints</div>
          ) : (
            <div className={styles.list}>
              {activeConstraints.map((constraint) => {
                return (
                  <div key={constraint.name} className={styles.item}>
                    <div className={styles.constraintName}>{constraint.name}</div>
                    <div className={styles.constraintImpact}>
                      {formatScoreLevels(constraint.impactTotal)}
                    </div>
                    <div className={styles.constraintCount}>
                      Matches: {constraint.matchCount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};