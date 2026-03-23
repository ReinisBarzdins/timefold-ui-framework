package timefold.ui.backend.dto;

import java.util.List;

public class SolutionStructureDTO {

    private String solutionClass;
    private List<EntityGroupDTO> entityGroups;
    private List<EntityGroupDTO> problemFactGroups;

    public String getSolutionClass() {
        return solutionClass;
    }

    public void setSolutionClass(String solutionClass) {
        this.solutionClass = solutionClass;
    }

    public List<EntityGroupDTO> getEntityGroups() {
        return entityGroups;
    }

    public void setEntityGroups(List<EntityGroupDTO> entityGroups) {
        this.entityGroups = entityGroups;
    }

    public List<EntityGroupDTO> getProblemFactGroups() {
        return problemFactGroups;
    }

    public void setProblemFactGroups(List<EntityGroupDTO> problemFactGroups) {
        this.problemFactGroups = problemFactGroups;
    }
}
