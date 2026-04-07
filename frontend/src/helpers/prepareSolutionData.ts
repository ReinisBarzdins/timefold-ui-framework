import type { SolutionStructureType } from "../types/SolutionStructureType.ts";
import type { EntityGroupType } from "../types/EntityGroupType.ts";

export interface GroupedEntityBucket {
  groupValue: string;
  labels: string[];
}

export interface GroupedEntityResult {
  tabName: string;
  entityClass: string;
  planningVariableName: string;
  buckets: GroupedEntityBucket[];
  coloredCells: "row" | "column";
}

export const prepareSolutionData = (data: SolutionStructureType) => {
  console.log(data?.entityGroups)

  // Check how many entities we have
  if (!data?.entityGroups || data?.entityGroups.length === 0) return null;

  return groupAllEntityGroups(data.entityGroups)
}

export function groupAllEntityGroups(
  entityGroups: EntityGroupType[]
): GroupedEntityResult[] {
  const results: GroupedEntityResult[] = [];

  for (const entityGroup of entityGroups) {
    const groupedResult = groupEntitiesByPlanningVariable(entityGroup);


    if (!groupedResult) {
      // TODO: Handle unsupported entity groups in UI
      continue;
    }

    results.push(groupedResult);
  }

  return results;
}

/**
 * Groups entities by their single non-array planning variable.
 *
 * Supported:
 * - exactly 1 planning variable
 * - value is primitive-ish or null
 *
 * Not yet supported:
 * - 0 planning variables
 * - more than 1 planning variable
 * - array planning variable values
 */
export function groupEntitiesByPlanningVariable(
  entityGroup: EntityGroupType
): GroupedEntityResult | null {
  if (!entityGroup.entities || entityGroup.entities.length === 0) {
    return null;
  }

  const firstEntity = entityGroup.entities[0];
  const firstEntries = Object.entries(firstEntity.planningVariables ?? {});

  if (firstEntries.length === 0) {
    // TODO: Handle entities without planning variables
    return null;
  }

  if (firstEntries.length > 1) {
    // TODO: Handle multiple planning variables
    return null;
  }

  const [planningVariableName, firstValue] = firstEntries[0];

  // ARRAY MODE LIKE IN (VRP)
  if (Array.isArray(firstValue)) {
    const buckets: GroupedEntityBucket[] = [];

    for (const entity of entityGroup.entities) {
      const entries = Object.entries(entity.planningVariables ?? {});

      if (entries.length !== 1) {
        // TODO: inconsistent structure
        return null;
      }

      const [_, value] = entries[0];

      if (!Array.isArray(value)) {
        // TODO: mixed array/non-array case
        return null;
      }

      buckets.push({
        groupValue: entity.label, // Vehicle
        labels: value.map((v) => String(v)), // Visits
      });
    }

    return {
      tabName: entityGroup.entityClass,
      entityClass: planningVariableName,
      planningVariableName: entityGroup.entityClass,
      buckets,
      coloredCells: "row",
    };
  }

  // GROUPED MODE
  const bucketsMap = new Map<string, string[]>();

  for (const entity of entityGroup.entities) {
    const entries = Object.entries(entity.planningVariables ?? {});

    if (entries.length !== 1) {
      // TODO: Handle inconsistencies
      return null;
    }

    const [currentName, currentValue] = entries[0];

    if (currentName !== planningVariableName) {
      // TODO: inconsistent variable names
      return null;
    }

    if (Array.isArray(currentValue)) {
      // should not happen here
      // TODO: mixed modes
      return null;
    }

    const groupValue = normalizePlanningVariableValue(currentValue);

    if (!bucketsMap.has(groupValue)) {
      bucketsMap.set(groupValue, []);
    }

    bucketsMap.get(groupValue)!.push(entity.label);
  }

  const buckets: GroupedEntityBucket[] = Array.from(bucketsMap.entries()).map(
    ([groupValue, labels]) => ({
      groupValue,
      labels,
    })
  );

  buckets.sort((a, b) =>
    a.groupValue.localeCompare(b.groupValue, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  return {
    tabName: entityGroup.entityClass,
    entityClass: entityGroup.entityClass,
    planningVariableName,
    buckets,
    coloredCells: "column",
  };
}

function normalizePlanningVariableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Unassigned";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}