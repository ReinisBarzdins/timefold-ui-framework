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
  rowLabel: string;
  columnLabel: string;
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

  return groupAllEntityGroups(data.entityGroups,data.problemFactGroups ?? [], scoreByLabel);
};

type EntityLookup = {
  byId: Map<string, EntityInstanceFrontendType>;
  byLabel: Map<string, EntityInstanceFrontendType>;
};

const getScoreExplanation = (
  entity: Partial<EntityInstanceType> | null | undefined,
  scoreByLabel: ScoreExplanationLookup,
  fallbackKeys: string[] = [],
): NonNullable<EntityInstanceFrontendType["scoreExplanation"]> => {
  const candidates = [
    entity?.label,
    entity?.id,
    entity?.details?.label,
    entity?.details?.id,
    entity?.details?.name,
    ...fallbackKeys,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue;
    }

    const scoreExplanation = scoreByLabel.get(String(candidate));

    if (scoreExplanation) {
      return scoreExplanation;
    }
  }

  return [];
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
        scoreExplanation: getScoreExplanation(entity, scoreByLabel),
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
  scoreByLabel: ScoreExplanationLookup,
): EntityInstanceFrontendType {
  const key = String(value);

  const fromLookup =
    lookup.byLabel.get(key) ??
    lookup.byId.get(key);

  if (fromLookup) {
    return {
      ...fromLookup,
      scoreExplanation: getScoreExplanation(fromLookup, scoreByLabel, [key]),
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
      scoreExplanation: getScoreExplanation(nestedEntity, scoreByLabel, [key]),
    };
  }

  return {
    label: key,
    planningVariables: {},
    details: null,
    scoreExplanation: scoreByLabel.get(key) ?? [],
  };
}

export function groupAllEntityGroups(
  entityGroups: EntityGroupType[],
  problemFactGroups: EntityGroupType[],
  scoreByLabel: ScoreExplanationLookup,
): GroupedEntityResult[] {
  const results: GroupedEntityResult[] = [];
  const entityLookup = buildEntityLookup([...entityGroups, ...problemFactGroups], scoreByLabel);

  for (const entityGroup of entityGroups) {
    const groupedResults = groupEntitiesByPlanningVariable(entityGroup, entityLookup, scoreByLabel);
    results.push(...groupedResults);
  }

  return results;
}

export function groupEntitiesByPlanningVariable(
  entityGroup: EntityGroupType,
  entityLookup: { byId: Map<string, EntityInstanceFrontendType>; byLabel: Map<string, EntityInstanceFrontendType> },
  scoreByLabel: ScoreExplanationLookup,
): GroupedEntityResult[] {
  if (!entityGroup.entities || entityGroup.entities.length === 0) {
    return [];
  }

  const planningVariableNames = Array.from(
    new Set(
      entityGroup.entities.flatMap((entity) =>
        Object.keys(entity.planningVariables ?? {})
      )
    )
  );

  if (planningVariableNames.length === 0) {
    return [];
  }

  return planningVariableNames
    .map((planningVariableName) =>
      groupEntitiesBySinglePlanningVariable(
        entityGroup,
        entityLookup,
        scoreByLabel,
        planningVariableName,
      )
    )
    .filter((result): result is GroupedEntityResult => result !== null);
}

function groupEntitiesBySinglePlanningVariable(
  entityGroup: EntityGroupType,
  entityLookup: { byId: Map<string, EntityInstanceFrontendType>; byLabel: Map<string, EntityInstanceFrontendType> },
  scoreByLabel: ScoreExplanationLookup,
  planningVariableName: string,
): GroupedEntityResult | null {
  const firstEntityWithVariable = entityGroup.entities.find((entity) =>
    Object.prototype.hasOwnProperty.call(entity.planningVariables ?? {}, planningVariableName)
  );

  if (!firstEntityWithVariable) {
    return null;
  }

  const firstValue = firstEntityWithVariable.planningVariables[planningVariableName];

  // ARRAY MODE LIKE VRP
  if (Array.isArray(firstValue)) {
    const buckets: GroupedEntityBucket[] = [];

    for (const entity of entityGroup.entities) {
      const rawValue = entity.planningVariables?.[planningVariableName];
      const value: unknown[] = Array.isArray(rawValue) ? rawValue : [];

      buckets.push({
        groupValue: entity.label,
        rowEntity: {
          ...entity,
          scoreExplanation: getScoreExplanation(entity, scoreByLabel),
        },
        entities: value.map((v) =>
          resolvePlanningEntity(v, entity, planningVariableName, entityLookup, scoreByLabel)
        ),
      });
    }

    return {
      tabName: `${capitalize(entityGroup.entityClass)} -> ${capitalize(planningVariableName)}`,
      entityClass: entityGroup.entityClass,
      planningVariableName,
      buckets,
      rowLabel: entityGroup.entityClass,
      columnLabel: planningVariableName,
    };
  }

  // GROUPED MODE
  const bucketsMap = new Map<string, EntityInstanceFrontendType[]>();

  for (const entity of entityGroup.entities) {
    const currentValue = entity.planningVariables?.[planningVariableName];
    if (Array.isArray(currentValue)) {
      return null;
    }

    const groupValue = normalizePlanningVariableValue(currentValue);

    if (!bucketsMap.has(groupValue)) {
      bucketsMap.set(groupValue, []);
    }

    bucketsMap.get(groupValue)!.push({
      ...entity,
      scoreExplanation: getScoreExplanation(entity, scoreByLabel),
    });
  }

  const buckets: GroupedEntityBucket[] = Array.from(bucketsMap.entries()).map(
    ([groupValue, entities]) => {
      const resolvedRowEntity =
        entityLookup.byLabel.get(groupValue) ??
        entityLookup.byId.get(groupValue) ??
        null;

      return {
        groupValue,
        entities,
        rowEntity: resolvedRowEntity
          ? {
            ...resolvedRowEntity,
            scoreExplanation: getScoreExplanation(resolvedRowEntity, scoreByLabel, [groupValue]),
          }
          : null,
      };
    }
  );

  buckets.sort((a, b) =>
    a.groupValue.localeCompare(b.groupValue, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  return {
    tabName: `${capitalize(entityGroup.entityClass)} -> ${capitalize(planningVariableName)}`,
    entityClass: entityGroup.entityClass,
    planningVariableName,
    buckets,
    rowLabel: planningVariableName,
    columnLabel: entityGroup.entityClass,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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