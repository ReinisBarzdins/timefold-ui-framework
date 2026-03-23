package timefold.ui.backend.dto;

import lombok.Getter;

import java.util.Map;

@Getter
public class EntityInstanceDTO {
    private String label;
    private Map<String, Object> planningVariables;

    public void setLabel(String label) {
        this.label = label;
    }

    public void setPlanningVariables(Map<String, Object> planningVariables) {
        this.planningVariables = planningVariables;
    }
}
