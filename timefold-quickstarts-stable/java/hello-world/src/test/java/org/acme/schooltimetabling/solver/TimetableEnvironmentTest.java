import ai.timefold.solver.core.api.solver.Solver;
import ai.timefold.solver.core.api.solver.SolverFactory;
import ai.timefold.solver.core.config.solver.EnvironmentMode;
import ai.timefold.solver.core.config.solver.SolverConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.time.Duration;

import static TimetableApp.generateDemoData;
import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfSystemProperty(named = "slowly", matches = "true")
class TimetableEnvironmentTest {

    @Test
    void solveFullAssert() {
        solve(EnvironmentMode.FULL_ASSERT);
    }

    @Test
    void solveStepAssert() {
        solve(EnvironmentMode.STEP_ASSERT);
    }

    void solve(EnvironmentMode environmentMode) {
        SolverFactory<Timetable> solverFactory = SolverFactory.create(new SolverConfig()
                .withSolutionClass(Timetable.class)
                .withEntityClasses(Lesson.class)
                .withConstraintProviderClass(TimetableConstraintProvider.class)
                .withEnvironmentMode(environmentMode)
                .withTerminationSpentLimit(Duration.ofSeconds(30)));

        // Load the problem
        Timetable problem = generateDemoData(TimetableApp.DemoData.SMALL);

        // Solve the problem
        Solver<Timetable> solver = solverFactory.buildSolver();
        Timetable solution = solver.solve(problem);
        assertThat(solution.getScore()).isNotNull();
    }

}