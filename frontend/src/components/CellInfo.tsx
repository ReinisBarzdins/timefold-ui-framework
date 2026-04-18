import type { FC } from "react";

import styles from "./CellInfo.module.scss";
import type { EntityInstanceFrontendType } from "../helpers/prepareSolutionData.ts";

const renderValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "—";
  }

  return String(value);
};

const hasScoreContribution = (score: {
  hard: number | null;
  medium: number | null;
  soft: number | null;
  explanation: string | null;
}) => {
  return [score.hard, score.medium, score.soft].some(
    (value) => value !== null && value !== 0,
  );
};

const formatScoreValue = (score: {
  hard: number | null;
  medium: number | null;
  soft: number | null;
}) => {
  return ([
    score.hard !== null ? `${score.hard} hard` : null,
    score.medium !== null ? `${score.medium} medium` : null,
    score.soft !== null ? `${score.soft} soft` : null,
  ].filter(Boolean) as string[]).join(" / ");
};

type CellInfoProps = {
  entity?: EntityInstanceFrontendType | null;
  hiddenDetailKey?: string;
};


export const CellInfo: FC<CellInfoProps> = ({ entity, hiddenDetailKey }) => {
  if (!entity) {
    return null;
  }

  const detailsEntries = entity.details
    ? Object.entries(entity.details).filter(([key]) => key !== hiddenDetailKey)
    : [];
  const scoreEntries = (entity.scoreExplanation ?? []).filter(hasScoreContribution);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>{entity.label}</h3>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Score explanation</h4>
            {scoreEntries.length === 0 ? (
              <div className={styles.empty}>No score impact</div>
            ) : (
              <div className={styles.list}>
                {scoreEntries.map((score, index) => (
                  <div
                    key={`${score.explanation ?? "score"}-${index}`}
                    className={styles.item}
                  >
                    <strong className={styles.label}>
                      {score.explanation ?? "Unknown constraint"}:
                    </strong>{" "}
                    <span>{formatScoreValue(score)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Entity information</h4>

            {detailsEntries.length === 0 ? (
              <div className={styles.empty}>No entity details</div>
            ) : (
              <div className={styles.list}>
                {detailsEntries.map(([key, value]) => {
                  if (!value) {
                    return null;
                  }

                  return (
                    <div key={key} className={styles.item}>
                      <strong className={styles.label}>{key}:</strong>{" "}
                      <span>{renderValue(value)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};