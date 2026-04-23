package io.github.reinisbarzdins.service;

import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.variable.PlanningListVariable;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;
import io.github.reinisbarzdins.dto.EntityGroupDTO;
import io.github.reinisbarzdins.dto.EntityInstanceDTO;
import io.github.reinisbarzdins.dto.SolutionStructureDTO;
import io.github.reinisbarzdins.helpers.AnnotatedCollectionResult;
import io.github.reinisbarzdins.helpers.TimefoldAnnotationHelper;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.util.*;

@Service
public class SolutionStructureService {
    private final TimefoldAnnotationHelper timefoldAnnotationHelper;

    public SolutionStructureService(TimefoldAnnotationHelper timefoldAnnotationHelper) {
        this.timefoldAnnotationHelper = timefoldAnnotationHelper;
    }

    public SolutionStructureDTO buildSolutionStructure(Object solution, Object solverStatus) {
        List<AnnotatedCollectionResult> entityCollections = timefoldAnnotationHelper.findAnnotatedCollections(solution, PlanningEntityCollectionProperty.class);
        List<AnnotatedCollectionResult> factCollections = timefoldAnnotationHelper.findAnnotatedCollections(solution, ProblemFactCollectionProperty.class);

        SolutionStructureDTO dto = new SolutionStructureDTO();
        dto.setSolutionClass(solution.getClass().getSimpleName());
        dto.setEntityGroups(mapCollectionsToGroups(entityCollections));
        dto.setProblemFactGroups(mapCollectionsToGroups(factCollections));
        dto.setSolverStatus(resolveSolverStatus(solution, solverStatus));

        return dto;
    }

    private List<EntityGroupDTO> mapCollectionsToGroups(List<AnnotatedCollectionResult> collections) {
        List<EntityGroupDTO> groups = new ArrayList<>();

        for (AnnotatedCollectionResult result : collections) {
            EntityGroupDTO group = new EntityGroupDTO();
            String entityClass = result.collection().isEmpty()
                    ? result.fieldName()
                    : result.collection().iterator().next().getClass().getSimpleName();

            group.setEntityClass(entityClass);

            List<EntityInstanceDTO> entities = result.collection().stream()
                    .map(item -> {
                        EntityInstanceDTO entity = new EntityInstanceDTO();
                        entity.setId(extractEntityId(item));
                        entity.setLabel(formatObject(item));
                        entity.setPlanningVariables(extractPlanningVariables(item));
                        entity.setDetails(extractEntityDetails(item));
                        return entity;
                    })
                    .toList();

            group.setEntities(entities);
            groups.add(group);
        }

        return groups;
    }

    private Map<String, Object> extractPlanningVariables(Object entity) {
        Map<String, Object> planningVariables = new LinkedHashMap<>();

        if (entity == null) {
            return planningVariables;
        }

        Class<?> sourceClass = entity.getClass();

        for (Field field : sourceClass.getDeclaredFields()) {
            try {
                field.setAccessible(true);

                if (field.isAnnotationPresent(PlanningVariable.class)) {
                    Object value = field.get(entity);
                    planningVariables.put(field.getName(), formatObject(value));
                } else if (field.isAnnotationPresent(PlanningListVariable.class)) {
                    Object value = field.get(entity);

                    if (value instanceof List<?> listValue) {
                        List<String> formattedValues = listValue.stream()
                                .map(this::formatObject)
                                .toList();

                        planningVariables.put(field.getName(), formattedValues);
                    } else {
                        planningVariables.put(field.getName(), null);
                    }
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException(
                        "Failed to access planning variable field: " + field.getName(), e
                );
            }
        }

        return planningVariables;
    }

    private String extractEntityId(Object entity) {
        if (entity == null) {
            return null;
        }

        Class<?> sourceClass = entity.getClass();

        for (Field field : sourceClass.getDeclaredFields()) {
            try {
                field.setAccessible(true);

                if (field.isAnnotationPresent(PlanningId.class)) {
                    Object value = field.get(entity);

                    return value != null ? String.valueOf(value) : null;
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException(
                        "Failed to access planning id field: " + field.getName(), e
                );
            }
        }

        for (Field field : sourceClass.getDeclaredFields()) {
            try {
                field.setAccessible(true);

                if ("id".equalsIgnoreCase(field.getName())) {
                    Object value = field.get(entity);
                    
                    return value != null ? String.valueOf(value) : null;
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException(
                        "Failed to access id field: " + field.getName(), e
                );
            }
        }

        return formatObject(entity);
    }

    private Map<String, Object> extractEntityDetails(Object entity) {
        Map<String, Object> details = new LinkedHashMap<>();

        if (entity == null) {
            return details;
        }

        Class<?> sourceClass = entity.getClass();

        for (Field field : sourceClass.getDeclaredFields()) {
            try {
                field.setAccessible(true);
                Object value = field.get(entity);

                if (shouldSkipDetailField(field.getName(), value)) {
                    continue;
                }

                details.put(field.getName(), normalizeDetailValue(value));
            } catch (IllegalAccessException e) {
                throw new RuntimeException(
                        "Failed to access detail field: " + field.getName(), e
                );
            }
        }

        return details;
    }

    private boolean shouldSkipDetailField(String fieldName, Object value) {
        if ("score".equalsIgnoreCase(fieldName) || "solverStatus".equalsIgnoreCase(fieldName)) {
            return true;
        }

        return value instanceof Map<?, ?>;
    }

    private Object normalizeDetailValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        if (value instanceof List<?> list) {
            boolean isSimpleList = list.stream().allMatch(item ->
                    item instanceof String ||
                            item instanceof Number ||
                            item instanceof Boolean
            );

            if (isSimpleList) {
                return list;
            }

            return list.stream()
                    .map(this::normalizeRelatedObject)
                    .toList();
        }

        return formatObject(value);
    }

    private Object normalizeRelatedObject(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        Map<String, Object> relatedObject = new LinkedHashMap<>();
        relatedObject.put("id", extractEntityId(value));
        relatedObject.put("label", formatObject(value));
        relatedObject.put("details", extractShallowDetails(value));
        return relatedObject;
    }

    private Map<String, Object> extractShallowDetails(Object entity) {
        Map<String, Object> details = new LinkedHashMap<>();

        if (entity == null) {
            return details;
        }

        Class<?> sourceClass = entity.getClass();

        for (Field field : sourceClass.getDeclaredFields()) {
            try {
                field.setAccessible(true);
                Object value = field.get(entity);

                if (shouldSkipDetailField(field.getName(), value)) {
                    continue;
                }

                details.put(field.getName(), normalizeShallowDetailValue(value));
            } catch (IllegalAccessException e) {
                throw new RuntimeException(
                        "Failed to access shallow detail field: " + field.getName(), e
                );
            }
        }

        return details;
    }

    private Object normalizeShallowDetailValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        if (value instanceof Collection<?> collection) {
            boolean isSimpleCollection = collection.stream().allMatch(item ->
                    item instanceof String ||
                            item instanceof Number ||
                            item instanceof Boolean
            );

            if (isSimpleCollection) {
                return new ArrayList<>(collection);
            }

            return collection.stream()
                    .map(this::formatObject)
                    .toList();
        }

        return formatObject(value);
    }

    private String formatObject(Object obj) {
        if (obj == null) {
            return null;
        }

        String str = obj.toString();

        if (str.contains("@")) {
            return obj.getClass().getSimpleName();
        }

        return str;
    }

    private String resolveSolverStatus(Object solution, Object solverStatus) {
        if (solverStatus != null) {
            return String.valueOf(solverStatus);
        }

        return extractSolverStatus(solution);
    }

    private String extractSolverStatus(Object solution) {
        if (solution == null) {
            return null;
        }

        Class<?> currentClass = solution.getClass();

        while (currentClass != null && currentClass != Object.class) {
            for (Field field : currentClass.getDeclaredFields()) {
                try {
                    field.setAccessible(true);

                    if ("solverStatus".equalsIgnoreCase(field.getName())) {
                        Object value = field.get(solution);
                        return value != null ? String.valueOf(value) : null;
                    }
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(
                            "Failed to access solver status field: " + field.getName(), e
                    );
                }
            }

            currentClass = currentClass.getSuperclass();
        }

        return null;
    }
}