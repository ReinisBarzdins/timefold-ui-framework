package io.github.reinisbarzdins.service;

import ai.timefold.solver.core.api.score.analysis.ScoreAnalysis;
import ai.timefold.solver.core.api.solver.ScoreAnalysisFetchPolicy;
import ai.timefold.solver.core.api.solver.SolutionManager;
import io.github.reinisbarzdins.dto.ScoreExplanationDTO;
import io.github.reinisbarzdins.mapper.ScoreExplanationMapper;
import org.springframework.stereotype.Service;

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
        ScoreAnalysis analysis = solutionManager.analyze(solution, ScoreAnalysisFetchPolicy.FETCH_ALL);
        return scoreExplanationMapper.map(analysis);
    }
}
