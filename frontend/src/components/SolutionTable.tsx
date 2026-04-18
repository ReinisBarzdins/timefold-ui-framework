import { type FC, type MouseEvent, useState } from "react";
import { type GroupedEntityBucket, type GroupedEntityResult } from "../helpers/prepareSolutionData.ts";
import type { EntityInstanceType } from "../types/EntityInstanceType.ts";
import { CellInfo } from "./CellInfo.tsx";

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
    return Math.max(max, bucket.entities?.length ?? 0);
  }, 0);
};

interface TableProps {
  solutionData: GroupedEntityResult;
  indictmentByLabel?: Record<string, string>;
}

export const SolutionTable: FC<TableProps> = ({
  solutionData,
  indictmentByLabel = {},
}) => {
  const { entityClass, buckets, planningVariableName, coloredCells } = solutionData;

  const maxEntityColumns = calculateMaxEntityCount(buckets);

  const [openCellKeys, setOpenCellKeys] = useState<Set<string>>(new Set());
  const [popupPlacements, setPopupPlacements] = useState<
    Record<string, { vertical: "above" | "below"; horizontal: "left" | "right" | "center" }>
  >({});

  const toggleCell = (cellKey: string, wrapperElement?: HTMLDivElement | null) => {
    if (wrapperElement) {
      const rect = wrapperElement.getBoundingClientRect();
      const estimatedPopupHeight = 430;
      const estimatedPopupWidth = 420;
      const viewportPadding = 16;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const vertical =
        spaceBelow < estimatedPopupHeight && spaceAbove > spaceBelow
          ? "above"
          : "below";

      const horizontal =
        rect.left + estimatedPopupWidth > window.innerWidth - viewportPadding
          ? "right"
          : rect.right - estimatedPopupWidth < viewportPadding
            ? "left"
            : "center";

      setPopupPlacements((prev) => ({
        ...prev,
        [cellKey]: {
          vertical,
          horizontal,
        },
      }));
    }

    setOpenCellKeys((prev) => {
      const next = new Set(prev);

      if (next.has(cellKey)) {
        next.delete(cellKey);
      } else {
        next.add(cellKey);
      }

      return next;
    });
  };

  const buildCellKey = (
    rowGroupValue: string,
    entity: EntityInstanceType,
    index: number,
  ) => `${entityClass}::${rowGroupValue}::${entity.id ?? entity.label}::${index}`;

  const buildRowKey = (groupValue: string) => `${entityClass}::row::${groupValue}`;
  const getPopupPlacement = (key: string) =>
    popupPlacements[key] ?? { vertical: "below", horizontal: "center" };

  return (
    <div className={styles.tableWrapper}>
      <table style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className={classNames(
              styles.borderBottom,
              styles.borderRight
            )}
          >
              {entityClass
              ? entityClass.charAt(0).toUpperCase() + entityClass.slice(1)
              : ""}
            </th>
            <th colSpan={maxEntityColumns} className={styles.borderBottom}>
              {planningVariableName
              ? planningVariableName.charAt(0).toUpperCase() + planningVariableName.slice(1)
              : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.groupValue}>
              {(() => {
              const rowImpact = bucket.groupValue ? indictmentByLabel[bucket.groupValue] : null;
              const rowSeverity = getSeverityFromImpact(rowImpact);
              const rowKey = buildRowKey(bucket.groupValue);
              const isRowOpen = openCellKeys.has(rowKey);

              return (
                <th className={classNames(styles.borderRight)}>
                  <div className={styles.cellWrapper}>
                    <div
                      className={classNames({
                        [styles.rowItem]: true,
                        [styles.isRowItem]: coloredCells === "row",
                        [styles.itemClickable]: coloredCells === "row" && !!bucket.rowEntity,
                        [styles.itemHard]: coloredCells === "row" && rowSeverity === "hard",
                        [styles.itemMedium]: coloredCells === "row" && rowSeverity === "medium",
                        [styles.itemSoft]: coloredCells === "row" && rowSeverity === "soft",
                        [styles.itemNone]: coloredCells === "row" && rowSeverity === "none",
                      })}
                      onClick={
                        coloredCells === "row" && bucket.rowEntity
                          ? (event: MouseEvent<HTMLDivElement>) =>
                            toggleCell(rowKey, event.currentTarget.parentElement as HTMLDivElement)
                          : undefined
                      }
                    >
                      <span className={styles.itemText} title={rowImpact ?? undefined}>
                        {bucket.groupValue}
                      </span>
                    </div>

                    {coloredCells === "row" && isRowOpen && bucket.rowEntity && (
                      <div
                        className={classNames(styles.popup, {
                          [styles.popupAbove]: getPopupPlacement(rowKey).vertical === "above",
                          [styles.popupBelow]: getPopupPlacement(rowKey).vertical === "below",
                          [styles.popupLeft]: getPopupPlacement(rowKey).horizontal === "left",
                          [styles.popupRight]: getPopupPlacement(rowKey).horizontal === "right",
                          [styles.popupCenter]: getPopupPlacement(rowKey).horizontal === "center",
                        })}
                      >
                        <CellInfo entity={bucket.rowEntity} hiddenDetailKey={planningVariableName}/>
                      </div>
                    )}
                  </div>
                </th>
              );
            })()}

              {Array.from({ length: maxEntityColumns }).map((_, index) => (
                <td key={index}>
                  {(() => {
                  const entity = bucket.entities[index];
                  const cellValue = entity?.label;
                  const cellLength = cellValue?.length ?? 0;

                  const itemSizeClass = classNames({
                    [styles.itemSmall]: cellLength > 18 && cellLength <= 28,
                    [styles.itemXSmall]: cellLength > 28,
                  });

                  const cellImpact = cellValue ? indictmentByLabel[cellValue] : null;
                  const impact = coloredCells === "column" ? cellImpact : null;
                  const severity = getSeverityFromImpact(impact);

                  const cellKey = entity
                    ? buildCellKey(bucket.groupValue, entity, index)
                    : null;
                  const isOpen = cellKey ? openCellKeys.has(cellKey) : false;

                  return (
                    <div className={styles.cellWrapper}>
                      <div
                        className={classNames({
                          [styles.item]: !!cellValue,
                          [itemSizeClass]: !!cellValue,
                          [styles.itemHard]: !!cellValue && coloredCells === "column" && severity === "hard",
                          [styles.itemMedium]: !!cellValue && coloredCells === "column" && severity === "medium",
                          [styles.itemSoft]: !!cellValue && coloredCells === "column" && severity === "soft",
                          [styles.itemNone]: !!cellValue && ((coloredCells === "column" && severity === "none") || (coloredCells === "row")),
                          [styles.itemClickable]: !!cellValue,
                        })}
                        onClick={
                          cellKey
                            ? (event: MouseEvent<HTMLDivElement>) =>
                              toggleCell(cellKey, event.currentTarget.parentElement as HTMLDivElement)
                            : undefined
                        }
                      >
                        <span className={styles.itemText} title={impact ?? undefined}>
                          {cellValue ?? null}
                        </span>
                      </div>

                      {isOpen && entity && entity.details && (
                        <div
                          className={classNames(styles.popup, {
                            [styles.popupAbove]: getPopupPlacement(cellKey!).vertical === "above",
                            [styles.popupBelow]: getPopupPlacement(cellKey!).vertical === "below",
                            [styles.popupLeft]: getPopupPlacement(cellKey!).horizontal === "left",
                            [styles.popupRight]: getPopupPlacement(cellKey!).horizontal === "right",
                            [styles.popupCenter]: getPopupPlacement(cellKey!).horizontal === "center",
                          })}
                        >
                          <CellInfo entity={entity} hiddenDetailKey={planningVariableName}/>
                        </div>
                      )}
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