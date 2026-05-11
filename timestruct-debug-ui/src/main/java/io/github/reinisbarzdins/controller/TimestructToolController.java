package io.github.reinisbarzdins.controller;

import io.github.reinisbarzdins.api.TimefoldSolutionAccess;
import io.github.reinisbarzdins.dto.ScoreExplanationDTO;
import io.github.reinisbarzdins.dto.SolutionStructureDTO;
import io.github.reinisbarzdins.service.ScoreExplanationService;
import io.github.reinisbarzdins.service.SolutionStructureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;

@RestController
@RequestMapping("${timestruct.api-prefix:/timestruct}")
public class TimestructToolController {
    private final TimefoldSolutionAccess solutionAccess;
    private final ScoreExplanationService scoreExplanationService;
    private final SolutionStructureService solutionStructureService;

    public TimestructToolController(
            TimefoldSolutionAccess solutionAccess,
            ScoreExplanationService scoreExplanationService,
            SolutionStructureService solutionStructureService
    ) {
        this.solutionAccess = solutionAccess;
        this.scoreExplanationService = scoreExplanationService;
        this.solutionStructureService = solutionStructureService;
    }

    @GetMapping(value = "/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    public Collection<String> list() {
        return solutionAccess.listJobIds();
    }

    @GetMapping(value = "/{jobId}/score-explanation", produces = MediaType.APPLICATION_JSON_VALUE)
    public ScoreExplanationDTO getScoreExplanation(@PathVariable String jobId) {
        Object solution = requireSolution(jobId);
        return scoreExplanationService.explain(solution);
    }

    @GetMapping(value = "/{jobId}/solution-structure", produces = MediaType.APPLICATION_JSON_VALUE)
    public SolutionStructureDTO getSolutionStructure(@PathVariable String jobId) {
        Object solution = requireSolution(jobId);
        Object solverStatus = solutionAccess.getSolverStatus(jobId);
        return solutionStructureService.buildSolutionStructure(solution, solverStatus);
    }

    private Object requireSolution(String jobId) {
        Object solution = solutionAccess.getSolution(jobId);

        if (solution == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No solution found for jobId=" + jobId);
        }

        return solution;
    }
}
