package timefold.ui.backend.controller;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.solver.SolutionManager;
import ai.timefold.solver.core.api.solver.SolverManager;
import ai.timefold.solver.core.api.solver.SolverStatus;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import timefold.ui.backend.dto.*;
import timefold.ui.backend.service.ScoreExplanationService;
import timefold.ui.backend.service.SolutionStructureService;
import timefold.ui.backend.sportsleagueschedule.domain.LeagueSchedule;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@RestController
@Slf4j
@RequestMapping("/dsp")
public class Controller {
    private final SolverManager<LeagueSchedule, String> solverManager;
    private final ConcurrentMap<String, Job> jobIdToJob = new ConcurrentHashMap<>();
    @Autowired
    private final SolutionManager<LeagueSchedule, HardSoftScore> solutionManager;
    private final ScoreExplanationService scoreExplanationService;
    private final SolutionStructureService solutionStructureService;

    public Controller(
            SolverManager<LeagueSchedule, String> solverManager,
            SolutionManager<LeagueSchedule, HardSoftScore> solutionManager,
            ScoreExplanationService scoreExplanationService,
            SolutionStructureService solutionStructureService
    ) {
        this.solverManager = solverManager;
        this.solutionManager = solutionManager;
        this.scoreExplanationService = scoreExplanationService;
        this.solutionStructureService = solutionStructureService;
    }

    @GetMapping
    public Collection<String> list() {
        return jobIdToJob.keySet();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public String solve() {
        DemoDataGenerator demoDataGenerator = new DemoDataGenerator();

        LeagueSchedule problem = demoDataGenerator.generateDemoData();
        String jobId = UUID.randomUUID().toString();
        jobIdToJob.put(jobId, Job.ofSchedule(problem));
        solverManager.solveBuilder()
                .withProblemId(jobId)
                .withProblemFinder(id -> jobIdToJob.get(jobId).schedule)
                .withBestSolutionConsumer(solution -> jobIdToJob.put(jobId, Job.ofSchedule(solution)))
                .withExceptionHandler((jobId_, exception) -> {
                    jobIdToJob.put(jobId, Job.ofException(exception));
                    log.error("Failed solving jobId ({}).", jobId, exception);
                })
                .run();
        return jobId;
    }

    @GetMapping(value = "/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public LeagueSchedule getDSPsolution(
            @Parameter(description = "The job ID returned by the POST method.") @PathVariable("jobId") String jobId) {
        LeagueSchedule problem = getScheduleAndCheckForExceptions(jobId);
        SolverStatus solverStatus = solverManager.getSolverStatus(jobId);
        problem.setSolverStatus(solverStatus);
        return problem;
    }

    @GetMapping(value = "/{jobId}/explain", produces = MediaType.APPLICATION_JSON_VALUE)
    public ScoreExplanation<LeagueSchedule, HardSoftScore> explainScore(
            @PathVariable("jobId") String jobId) {

        LeagueSchedule solution = getScheduleAndCheckForExceptions(jobId);

        return solutionManager.explain(solution);
    }

    @GetMapping(value = "/{jobId}/explain-debug", produces = MediaType.APPLICATION_JSON_VALUE)
    public ScoreExplanationDTO explainDebug(@PathVariable("jobId") String jobId) {

        LeagueSchedule solution = getScheduleAndCheckForExceptions(jobId);
        ScoreExplanation<LeagueSchedule, HardSoftScore> explanation =
                solutionManager.explain(solution);

        ScoreExplanationDTO result = new ScoreExplanationDTO();
        List<ConstraintDTO> constraints = new ArrayList<>();
        List<IndictmentDTO> indictments = new ArrayList<>();

        explanation.getConstraintMatchTotalMap().forEach((k, v) -> {
            ConstraintDTO constraint = new ConstraintDTO();
            constraint.setName(k);
            constraint.setImpactTotal(v.getScore().toString());
            constraint.setMatchCount(v.getConstraintMatchSet().size());

            List<MatchDTO> sampleMatches = v.getConstraintMatchSet()
                    .stream()
                    .limit(3)
                    .map(match -> {

                        MatchDTO matchDto = new MatchDTO();
                        matchDto.setImpact(match.getScore().toString());

                        List<String> objects = match.getIndictedObjectList()
                                .stream()
                                .map(Object::toString)
                                .toList();

                        matchDto.setObjects(objects);

                        return matchDto;

                    })
                    .toList();

            constraint.setSampleMatches(sampleMatches);

            constraints.add(constraint);
        });

        explanation.getIndictmentMap().forEach((obj, indictment) -> {
            IndictmentDTO indictmentDTO = new IndictmentDTO();

            indictmentDTO.setObject(obj.toString());
            indictmentDTO.setImpactTotal(indictment.getScore().toString());

            indictments.add(indictmentDTO);
        });

        result.setScore(explanation.getScore().toString());
        result.setIndictments(indictments);
        result.setConstraints(constraints);


        return result;
    }

    @GetMapping("/{jobId}/score-explanation")
    public ScoreExplanationDTO explain(@PathVariable String jobId) {
        LeagueSchedule solution = getScheduleAndCheckForExceptions(jobId);
        return scoreExplanationService.explain(solution);
    }
//
//    @GetMapping(value = "/score/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ScoreAnalysis<HardSoftScore> analyze(
//            @Parameter(description = "The job ID returned by the POST method.") @PathVariable("jobId") String jobId) {
//        DSPsolution problem = getDSPSolutionAndCheckForExceptions(jobId);
//        return solutionManager.analyze(problem);
//    }
//
//    @GetMapping(value = "/indictments/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public List<SimpleIndictmentObject> indictments(
//            @Parameter(description = "The job ID returned by the POST method.") @PathVariable("jobId") String jobId) {
//        DSPsolution problem = getDSPSolutionAndCheckForExceptions(jobId);
//        return solutionManager.explain(problem).getIndictmentMap().entrySet().stream()
//                .map(entry -> {
//                    Indictment<HardSoftScore> indictment = entry.getValue();
//                    return
//                            new SimpleIndictmentObject(entry.getKey(), // indicted Object
//                                    indictment.getScore(),
//                                    indictment.getConstraintMatchCount(),
//                                    indictment.getConstraintMatchSet());
//                }).collect(Collectors.toList());
//    }

    @GetMapping(value = "/{jobId}/solution-structure", produces = MediaType.APPLICATION_JSON_VALUE)
    public SolutionStructureDTO getSolutionStructure(@PathVariable("jobId") String jobId) {
        LeagueSchedule solution = getScheduleAndCheckForExceptions(jobId);
        return solutionStructureService.buildSolutionStructure(solution);
    }


    private LeagueSchedule getScheduleAndCheckForExceptions(String jobId) {
        Job job = jobIdToJob.get(jobId);
        if (job == null) {
            throw new Exeption(jobId, HttpStatus.NOT_FOUND, "No schedule found.");
        }
        if (job.exception != null) {
            throw new Exeption(jobId, job.exception);
        }
        return job.schedule;
    }


    private record Job(LeagueSchedule schedule, LocalDateTime createdAt, Throwable exception) {

        static Job ofSchedule(LeagueSchedule schedule) {
            return new Job(schedule, LocalDateTime.now(), null);
        }

        static Job ofException(Throwable error) {
            return new Job(null, LocalDateTime.now(), error);
        }
    }

}
