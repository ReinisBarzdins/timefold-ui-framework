package com.timestruct.service;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import ai.timefold.solver.core.api.solver.SolutionManager;
import com.timestruct.dto.ScoreExplanationDTO;
import com.timestruct.mapper.ScoreExplanationMapper;
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
        ScoreExplanation explanation = solutionManager.explain(solution);
        return scoreExplanationMapper.map(explanation);
    }
}