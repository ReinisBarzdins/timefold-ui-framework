import { type FC } from "react";
import { type GroupedEntityBucket, type GroupedEntityResult } from "../helpers/prepareSolutionData.ts";

import styles from "./SolutionTable.module.scss";
import classNames from "classnames";


type Severity = "none" | "hard" | "medium" | "soft";

const getSeverityFromImpact = (impact?: string | null): Severity => {
  if (!impact) return "none";

  const hardMatch = impact.match(/(-?\d+)hard/i);
  const mediumMatch = impact.match(/(-?\d+)medium/i);
  const softMatch = impact.match(/(-?\d+)soft/i);

  const hardValue = hardMatch ? Number(hardMatch[1]) : 0;
  const mediumValue = mediumMatch ? Number(mediumMatch[1]) : 0;
  const softValue = softMatch ? Number(softMatch[1]) : 0;

  if (hardValue < 0) return "hard";
  if (mediumValue < 0) return "medium";
  if (softValue < 0) return "soft";

  return "none";
};


const calculateMaxEntityCount = (buckets: GroupedEntityBucket[]): number => {
  return buckets.reduce((max, bucket) => {
    return Math.max(max, bucket.labels?.length ?? 0);
  }, 0);
};

interface TableProps {
  solutionData: GroupedEntityResult;
  indictmentByLabel?: Record<string, string>;
}

export const SolutionTable: FC<TableProps> = ({ solutionData, indictmentByLabel = {} }) => {
  const { entityClass, buckets, planningVariableName, coloredCells } = solutionData;

  const maxEntityColumns = calculateMaxEntityCount(buckets);

  return (
    <div>
      <table>
        <thead>
          <tr>
            {/* First column */}
            <th>{planningVariableName}</th>

            {/* Remaining columns merged */}
            <th colSpan={maxEntityColumns}>{entityClass}</th>
          </tr>
        </thead>

        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.groupValue}>
              {/* Row header */}
              {(() => {
              const rowImpact = bucket.groupValue ? indictmentByLabel[bucket.groupValue] : null;
              const rowSeverity = getSeverityFromImpact(rowImpact);

              return (
                <th>
                  <div
                    className={classNames({
                      [styles.item]: true,
                      [styles.itemHard]: coloredCells === "row" && rowSeverity === "hard",
                      [styles.itemMedium]: coloredCells === "row" && rowSeverity === "medium",
                      [styles.itemSoft]: coloredCells === "row" && rowSeverity === "soft",
                      [styles.itemNone]: coloredCells === "row" && rowSeverity === "none",
                    })}
                  >
                    <span className={styles.itemText} title={rowImpact ?? undefined}>
                      {bucket.groupValue}
                    </span>
                  </div>
                </th>
              );
            })()}

              {/* Cells */}
              {Array.from({ length: maxEntityColumns }).map((_, index) => (
                <td key={index}>
                  {(() => {
                  const cellValue = bucket.labels[index];
                  const cellLength = cellValue?.length ?? 0;

                  const itemSizeClass = classNames({
                    [styles.itemSmall]: cellLength > 18 && cellLength <= 28,
                    [styles.itemXSmall]: cellLength > 28,
                  });

                  const cellImpact = cellValue ? indictmentByLabel[cellValue] : null;
                  const impact = coloredCells === "column" ? cellImpact : null;
                  const severity = getSeverityFromImpact(impact);

                  return (
                    <div
                      className={classNames({
                        [styles.item]: !!cellValue,
                        [itemSizeClass]: !!cellValue,
                        [styles.itemHard]: !!cellValue && coloredCells === "column" && severity === "hard",
                        [styles.itemMedium]: !!cellValue && coloredCells === "column" && severity === "medium",
                        [styles.itemSoft]: !!cellValue && coloredCells === "column" && severity === "soft",
                        [styles.itemNone]: !!cellValue && coloredCells === "column" && severity === "none",
                      })}
                    >
                      <span className={styles.itemText} title={impact ?? undefined}>
                        {cellValue ?? null}
                      </span>
                    </div>
                  );
                })()}
                </td>
            ))}
            </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};