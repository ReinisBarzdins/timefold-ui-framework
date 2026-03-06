package timefold.ui.backend.controller;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import ai.timefold.solver.core.api.score.buildin.hardmediumsoft.HardMediumSoftScore;
import ai.timefold.solver.core.api.solver.SolutionManager;
import ai.timefold.solver.core.api.solver.SolverManager;
import ai.timefold.solver.core.api.solver.SolverStatus;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import timefold.ui.backend.bedallocation.domain.BedPlan;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@RestController
@Slf4j
@RequestMapping("/dsp")
public class Controller {
    private final SolverManager<BedPlan, String> solverManager;
    private final ConcurrentMap<String, Job> jobIdToJob = new ConcurrentHashMap<>();
    @Autowired
    private final SolutionManager<BedPlan, HardMediumSoftScore> solutionManager;

    public Controller(SolverManager<BedPlan, String> solverManager, SolutionManager<BedPlan, HardMediumSoftScore> solutionManager) {
        this.solverManager = solverManager;
        this.solutionManager = solutionManager;
    }

    @GetMapping
    public Collection<String> list() {
        return jobIdToJob.keySet();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public String solve() {
        DemoDataGenerator dataGenerator = new DemoDataGenerator();
        BedPlan problem = dataGenerator.generateDemoData();
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
    public BedPlan getDSPsolution(
            @Parameter(description = "The job ID returned by the POST method.") @PathVariable("jobId") String jobId) {
        BedPlan problem = getScheduleAndCheckForExceptions(jobId);
        SolverStatus solverStatus = solverManager.getSolverStatus(jobId);
        problem.setSolverStatus(solverStatus);
        return problem;
    }

    @GetMapping(value = "/{jobId}/explain", produces = MediaType.APPLICATION_JSON_VALUE)
    public ScoreExplanation<BedPlan, HardMediumSoftScore> explainScore(
            @PathVariable("jobId") String jobId) {

        BedPlan solution = getScheduleAndCheckForExceptions(jobId);

        return solutionManager.explain(solution);
    }

    @GetMapping(value = "/{jobId}/explain-debug", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> explainDebug(@PathVariable("jobId") String jobId) {

        BedPlan solution = getScheduleAndCheckForExceptions(jobId);
        ScoreExplanation<BedPlan, HardMediumSoftScore> explanation =
                solutionManager.explain(solution);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", explanation.getScore().toString());
        result.put("summary", explanation.getSummary());

        Map<String, Object> constraints = new LinkedHashMap<>();

        explanation.getConstraintMatchTotalMap().forEach((k, v) -> {

            Map<String, Object> constraintData = new LinkedHashMap<>();

            constraintData.put("impactTotal", v.getScore().toString());
            constraintData.put("matchCount", v.getConstraintMatchSet().size());

            List<Map<String, Object>> sampleMatches = new ArrayList<>();

            v.getConstraintMatchSet()
                    .stream()
                    .limit(3)
                    .forEach(match -> {

                        Map<String, Object> matchData = new LinkedHashMap<>();

                        matchData.put("impact", match.getScore().toString());

                        List<String> objects = match.getIndictedObjectList()
                                .stream()
                                .map(Object::toString)
                                .toList();

                        matchData.put("objects", objects);

                        sampleMatches.add(matchData);
                    });

            constraintData.put("sampleMatches", sampleMatches);

            constraints.put(k, constraintData);
        });

        result.put("constraints", constraints);


        return result;
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


    private BedPlan getScheduleAndCheckForExceptions(String jobId) {
        Job job = jobIdToJob.get(jobId);
        if (job == null) {
            throw new Exeption(jobId, HttpStatus.NOT_FOUND, "No schedule found.");
        }
        if (job.exception != null) {
            throw new Exeption(jobId, job.exception);
        }
        return job.schedule;
    }


    private record Job(BedPlan schedule, LocalDateTime createdAt, Throwable exception) {

        static Job ofSchedule(BedPlan schedule) {
            return new Job(schedule, LocalDateTime.now(), null);
        }

        static Job ofException(Throwable error) {
            return new Job(null, LocalDateTime.now(), error);
        }
    }

}
