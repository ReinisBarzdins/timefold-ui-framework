import type { SolutionStructureType } from "../types/SolutionStructureType.ts";
import type { EntityGroupType } from "../types/EntityGroupType.ts";
import type { EntityInstanceType } from "../types/EntityInstanceType.ts";

export type EntityInstanceFrontendType = EntityInstanceType & {
  scoreExplanation?: {
    hard: number | null;
    medium: number | null;
    soft: number | null;
    explanation: string | null;
  }[];
};

export interface GroupedEntityBucket {
  groupValue: string;
  entities: EntityInstanceFrontendType[];
  rowEntity?: EntityInstanceFrontendType | null;
}

export interface GroupedEntityResult {
  tabName: string;
  entityClass: string;
  planningVariableName: string;
  buckets: GroupedEntityBucket[];
  coloredCells: "row" | "column";
}

type ScoreExplanationLookup = Map<
  string,
  NonNullable<EntityInstanceFrontendType["scoreExplanation"]>
>;

export const prepareSolutionData = (
  data: SolutionStructureType,
  scoreByLabel: ScoreExplanationLookup = new Map(),
) => {
  if (!data?.entityGroups || data.entityGroups.length === 0) {
    return null;
  }

  return groupAllEntityGroups(data.entityGroups, scoreByLabel);
};

type EntityLookup = {
  byId: Map<string, EntityInstanceFrontendType>;
  byLabel: Map<string, EntityInstanceFrontendType>;
};
export const buildEntityLookup = (
  entityGroups: EntityGroupType[],
  scoreByLabel: ScoreExplanationLookup,
): EntityLookup => {
  const byId = new Map<string, EntityInstanceFrontendType>();
  const byLabel = new Map<string, EntityInstanceFrontendType>();

  for (const group of entityGroups) {
    for (const entity of group.entities ?? []) {
      const frontendEntity: EntityInstanceFrontendType = {
        ...entity,
        scoreExplanation: scoreByLabel.get(entity.label) ?? [],
      };

      byLabel.set(frontendEntity.label, frontendEntity);

      if (frontendEntity.id) {
        byId.set(frontendEntity.id, frontendEntity);
      }
    }
  }

  return { byId, byLabel };
};

function resolvePlanningEntity(
  value: unknown,
  sourceEntity: EntityInstanceType,
  planningVariableName: string,
  lookup: { byId: Map<string, EntityInstanceFrontendType>; byLabel: Map<string, EntityInstanceFrontendType> },
): EntityInstanceFrontendType {
  const key = String(value);

  const fromLookup =
    lookup.byId.get(key) ??
    lookup.byLabel.get(key);

  if (fromLookup) {
    return {
      ...fromLookup,
      scoreExplanation: [],
    };
  }

  const nestedPlanningEntities = Array.isArray(sourceEntity.details?.[planningVariableName])
    ? sourceEntity.details[planningVariableName]
    : [];

  const matchedNestedEntity = nestedPlanningEntities.find((item) => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as { id?: unknown; label?: unknown };

    return String(candidate.id ?? "") === key || String(candidate.label ?? "") === key;
  });

  if (matchedNestedEntity && typeof matchedNestedEntity === "object") {
    const nestedEntity = matchedNestedEntity as {
      id?: string | null;
      label?: string;
      details?: Record<string, unknown> | null;
    };

    return {
      id: nestedEntity.id ?? null,
      label: nestedEntity.label ?? key,
      planningVariables: {},
      details: nestedEntity.details ?? null,
      scoreExplanation: [],
    };
  }

  return {
    label: key,
    planningVariables: {},
    details: null,
    scoreExplanation: [],
  };
}

export function groupAllEntityGroups(
  entityGroups: EntityGroupType[],
  scoreByLabel: ScoreExplanationLookup,
): GroupedEntityResult[] {
  const results: GroupedEntityResult[] = [];
  const entityLookup = buildEntityLookup(entityGroups, scoreByLabel);

  for (const entityGroup of entityGroups) {
    const groupedResult = groupEntitiesByPlanningVariable(entityGroup, entityLookup, scoreByLabel);

    if (!groupedResult) {
      continue;
    }

    results.push(groupedResult);
  }

  return results;
}

export function groupEntitiesByPlanningVariable(
  entityGroup: EntityGroupType,
  entityLookup: { byId: Map<string, EntityInstanceFrontendType>; byLabel: Map<string, EntityInstanceFrontendType> },
  scoreByLabel: ScoreExplanationLookup,
): GroupedEntityResult | null {
  if (!entityGroup.entities || entityGroup.entities.length === 0) {
    return null;
  }

  const firstEntity = entityGroup.entities[0];
  const firstEntries = Object.entries(firstEntity.planningVariables ?? {});

  if (firstEntries.length === 0) {
    return null;
  }

  if (firstEntries.length > 1) {
    return null;
  }

  const [planningVariableName, firstValue] = firstEntries[0];

  // ARRAY MODE LIKE VRP
  if (Array.isArray(firstValue)) {
    const buckets: GroupedEntityBucket[] = [];

    for (const entity of entityGroup.entities) {
      const entries = Object.entries(entity.planningVariables ?? {});

      if (entries.length !== 1) {
        return null;
      }

      const [_, value] = entries[0];

      if (!Array.isArray(value)) {
        return null;
      }

      buckets.push({
        groupValue: entity.label,
        rowEntity: {
          ...entity,
          scoreExplanation: scoreByLabel.get(entity.label) ?? [],
        },
        entities: value.map((v) =>
          resolvePlanningEntity(v, entity, planningVariableName, entityLookup)
        ),
      });
    }

    return {
      tabName: entityGroup.entityClass,
      entityClass: entityGroup.entityClass,
      planningVariableName: planningVariableName,
      buckets,
      coloredCells: "row",
    };
  }

  // GROUPED MODE
  const bucketsMap = new Map<string, EntityInstanceFrontendType[]>();

  for (const entity of entityGroup.entities) {
    const entries = Object.entries(entity.planningVariables ?? {});

    if (entries.length !== 1) {
      return null;
    }

    const [currentName, currentValue] = entries[0];

    if (currentName !== planningVariableName) {
      return null;
    }

    if (Array.isArray(currentValue)) {
      return null;
    }

    const groupValue = normalizePlanningVariableValue(currentValue);

    if (!bucketsMap.has(groupValue)) {
      bucketsMap.set(groupValue, []);
    }

    bucketsMap.get(groupValue)!.push({
      ...entity,
      scoreExplanation: scoreByLabel.get(entity.label) ?? [],
    });
  }

  const buckets: GroupedEntityBucket[] = Array.from(bucketsMap.entries()).map(
    ([groupValue, entities]) => ({
      groupValue,
      entities,
      rowEntity: null,
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
    planningVariableName: planningVariableName,
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