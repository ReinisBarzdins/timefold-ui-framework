package timefold.ui.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class SolutionStructureDTO {
    private String solutionClass;
    private List<EntityGroupDTO> entityGroups;
    private List<EntityGroupDTO> problemFactGroups;
}
