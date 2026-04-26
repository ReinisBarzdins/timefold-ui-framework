import { type FC, useState } from "react";
import type { PreparedProblemFactGroupType } from "../helpers/prepareProblemFacts.ts";

import styles from "./ProblemFacts.module.scss";

const renderRelatedValue = (item: unknown): string => {
  if (item === null || item === undefined) {
    return "—";
  }

  if (
    typeof item === "string" ||
    typeof item === "number" ||
    typeof item === "boolean"
  ) {
    return String(item);
  }

  if (typeof item === "object") {
    const record = item as { label?: unknown; id?: unknown };

    if (typeof record.label === "string" && record.label.length > 0) {
      return record.label;
    }

    if (record.id !== undefined && record.id !== null) {
      return String(record.id);
    }
  }

  return String(item);
};

const renderValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(renderRelatedValue).join(", ");
  }

  if (value === null || value === undefined) {
    return "—";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return renderRelatedValue(value);
  }

  return String(value);
};

type ProblemFactsProps = {
  problemFactGroups?: PreparedProblemFactGroupType[];
};

export const ProblemFacts: FC<ProblemFactsProps> = ({ problemFactGroups }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!problemFactGroups || problemFactGroups.length === 0) {
    return null;
  }

  const toggleGroup = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.buttonContainer}>
        <div>
          <span className={styles.title}>Problem facts: </span>
        </div>
        <div className={styles.buttonList}>
          {problemFactGroups.map((group, index) => (
            <button
              key={group.factClass}
              type="button"
              className={styles.groupButton}
              onClick={() => toggleGroup(index)}
            >
              {group.factClass}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.groups}>
        {problemFactGroups.map((group, index) => {
          if (openIndex !== index) {
            return null;
          }

          return (
            <div key={group.factClass} className={styles.groupSection}>
              <h4 className={styles.groupTitle}>{group.factClass}</h4>
              <div className={styles.factList}>
                {group.facts.length === 0 ? (
                  <div className={styles.emptyState}>
                    Problem fact does not contain any data.
                  </div>
                ) : (
                  group.facts.map((fact, factIndex) => {
                    const factDetails =
                      fact.details && typeof fact.details === "object"
                        ? Object.entries(fact.details)
                        : [];

                    return (
                      <div
                        key={`${group.factClass}-${String(fact.id ?? fact.label ?? factIndex)}`}
                        className={styles.factCard}
                      >
                        <div className={styles.factHeader}>
                          <span className={styles.factHeaderText}>
                            {typeof fact.label === "string" && fact.label.length > 0
                              ? fact.label
                              : `${group.factClass} ${factIndex + 1}`}
                          </span>
                        </div>
                        <div className={styles.factFieldsGrid}>
                          {factDetails.length > 0 ? (
                            factDetails.map(([key, value]) => (
                              <div key={key} className={styles.factField}>
                                <strong className={styles.fieldLabel}>{key}:</strong>{" "}
                                <span className={styles.fieldValue}>{renderValue(value)}</span>
                              </div>
                            ))
                          ) : (
                            <div className={styles.emptyFactDetails}>No details available.</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};