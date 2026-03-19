package timefold.ui.backend.service;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import ai.timefold.solver.core.api.solver.SolutionManager;
import org.springframework.stereotype.Service;
import timefold.ui.backend.dto.ScoreExplanationDTO;
import timefold.ui.backend.mapper.ScoreExplanationMapper;

@Service
public class ScoreExplanationService {

    @SuppressWarnings("rawtypes")
    private final SolutionManager solutionManager;

    private final ScoreExplanationMapper scoreExplanationMapper;

    @SuppressWarnings("rawtypes")
    public ScoreExplanationService(
            SolutionManager solutionManager,
            ScoreExplanationMapper scoreExplanationMapper
    ) {
        this.solutionManager = solutionManager;
        this.scoreExplanationMapper = scoreExplanationMapper;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public ScoreExplanationDTO explain(Object solution) {
        ScoreExplanation explanation = solutionManager.explain(solution);
        return scoreExplanationMapper.map(explanation);
    }
}