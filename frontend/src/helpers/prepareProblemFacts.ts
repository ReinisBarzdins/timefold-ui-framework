import type { SolutionStructureType } from "../types/SolutionStructureType.ts";

export type PreparedProblemFactType = Record<string, unknown>;

export type PreparedProblemFactGroupType = {
  factClass: string;
  facts: PreparedProblemFactType[];
};

const normalizeFactValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFactValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        normalizeFactValue(nestedValue),
      ]),
    );
  }

  return String(value);
};

const getFactSortValue = (fact: PreparedProblemFactType) => {
  const candidate = fact.id ?? fact.label ?? fact.name;

  if (candidate === null || candidate === undefined) {
    return "";
  }

  return String(candidate);
};

export const prepareProblemFacts = (
  solver: SolutionStructureType | null | undefined,
): PreparedProblemFactGroupType[] => {
  if (!solver?.problemFactGroups || solver.problemFactGroups.length === 0) {
    return [];
  }

  return solver.problemFactGroups
    .map((group) => ({
      factClass: group.entityClass,
      facts: (group.entities ?? [])
        .map((fact) => normalizeFactValue(fact) as PreparedProblemFactType)
        .sort((a, b) =>
          getFactSortValue(a).localeCompare(getFactSortValue(b), undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        ),
    }))
    .sort((a, b) =>
      a.factClass.localeCompare(b.factClass, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
};