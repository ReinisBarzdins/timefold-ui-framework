package timefold.ui.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import timefold.ui.backend.api.TimefoldSolutionAccess;
import timefold.ui.backend.dto.ScoreExplanationDTO;
import timefold.ui.backend.dto.SolutionStructureDTO;
import timefold.ui.backend.service.ScoreExplanationService;
import timefold.ui.backend.service.SolutionStructureService;

import java.util.Collection;

@RestController
@RequestMapping("/timestruct")
public class TimefoldToolController {

    private final TimefoldSolutionAccess solutionAccess;
    private final ScoreExplanationService scoreExplanationService;
    private final SolutionStructureService solutionStructureService;

    public TimefoldToolController(
            TimefoldSolutionAccess solutionAccess,
            ScoreExplanationService scoreExplanationService,
            SolutionStructureService solutionStructureService
    ) {
        this.solutionAccess = solutionAccess;
        this.scoreExplanationService = scoreExplanationService;
        this.solutionStructureService = solutionStructureService;
    }

    @GetMapping
    public Collection<String> list() {
        return solutionAccess.listJobIds();
    }

    @GetMapping(value = "/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Object getSolution(@PathVariable String jobId) {
        return requireSolution(jobId);
    }

    @GetMapping(value = "/{jobId}/score-explanation", produces = MediaType.APPLICATION_JSON_VALUE)
    public ScoreExplanationDTO getScoreExplanation(@PathVariable String jobId) {
        Object solution = requireSolution(jobId);
        return scoreExplanationService.explain(solution);
    }

    @GetMapping(value = "/{jobId}/solution-structure", produces = MediaType.APPLICATION_JSON_VALUE)
    public SolutionStructureDTO getSolutionStructure(@PathVariable String jobId) {
        Object solution = requireSolution(jobId);
        return solutionStructureService.buildSolutionStructure(solution);
    }

    private Object requireSolution(String jobId) {
        Object solution = solutionAccess.getSolution(jobId);

        if (solution == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No solution found for jobId=" + jobId);
        }
        
        return solution;
    }
}
