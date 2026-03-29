package timefold.ui.backend.service;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.variable.PlanningListVariable;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;
import org.springframework.stereotype.Service;
import timefold.ui.backend.dto.EntityGroupDTO;
import timefold.ui.backend.dto.EntityInstanceType;
import timefold.ui.backend.dto.SolutionStructureDTO;
import timefold.ui.backend.helpers.AnnotatedCollectionResult;
import timefold.ui.backend.helpers.TimefoldAnnotationHelper;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SolutionStructureService {

    private final TimefoldAnnotationHelper helper;

    public SolutionStructureService(TimefoldAnnotationHelper helper) {
        this.helper = helper;
    }

    public SolutionStructureDTO buildSolutionStructure(Object solution) {
        List<AnnotatedCollectionResult> entityCollections = helper.findAnnotatedCollections(solution, PlanningEntityCollectionProperty.class);
        List<AnnotatedCollectionResult> factCollections = helper.findAnnotatedCollections(solution, ProblemFactCollectionProperty.class);

        SolutionStructureDTO dto = new SolutionStructureDTO();
        dto.setSolutionClass(solution.getClass().getSimpleName());
        dto.setEntityGroups(mapCollectionsToGroups(entityCollections));
        dto.setProblemFactGroups(mapCollectionsToGroups(factCollections));

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

            List<EntityInstanceType> entities = result.collection().stream()
                    .map(item -> {
                        EntityInstanceType entity = new EntityInstanceType();
                        entity.setLabel(formatObject(item));
                        entity.setPlanningVariables(extractPlanningVariables(item));
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
}