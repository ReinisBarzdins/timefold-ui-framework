package timefold.ui.backend.bedallocation.domain;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardmediumsoft.HardMediumSoftScore;
import ai.timefold.solver.core.api.solver.SolverStatus;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@PlanningSolution
public class BedPlan {

    // ************************************************************************
    // Getters and setters
    // ************************************************************************
    @ProblemFactCollectionProperty
    private List<Department> departments;
    @PlanningEntityCollectionProperty
    private List<Stay> stays;
    @JsonIgnore
    @ProblemFactCollectionProperty
    private List<Room> rooms;
    @JsonIgnore
    @ProblemFactCollectionProperty
    @ValueRangeProvider
    private List<Bed> beds;

    @PlanningScore
    private HardMediumSoftScore score;

    private SolverStatus solverStatus;

    // No-arg constructor required for Timefold
    public BedPlan() {
    }

    @JsonCreator
    public BedPlan(@JsonProperty("departments") List<Department> departments, @JsonProperty("stays") List<Stay> stays) {
        this.departments = departments;
        this.stays = stays;
        this.rooms = departments.stream()
                .filter(d -> d.getRooms() != null)
                .flatMap(d -> d.getRooms().stream())
                .toList();
        this.beds = departments.stream()
                .filter(d -> d.getRooms() != null)
                .flatMap(d -> d.getRooms().stream())
                .flatMap(r -> r.getBeds().stream())
                .toList();
    }

    public BedPlan(HardMediumSoftScore score, SolverStatus solverStatus) {
        this.score = score;
        this.solverStatus = solverStatus;
    }

}
