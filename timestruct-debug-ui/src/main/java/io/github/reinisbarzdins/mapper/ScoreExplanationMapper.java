package io.github.reinisbarzdins.mapper;

import ai.timefold.solver.core.api.score.Score;
import ai.timefold.solver.core.api.score.analysis.ConstraintAnalysis;
import ai.timefold.solver.core.api.score.analysis.MatchAnalysis;
import ai.timefold.solver.core.api.score.analysis.ScoreAnalysis;
import ai.timefold.solver.core.api.score.stream.DefaultConstraintJustification;
import io.github.reinisbarzdins.dto.ConstraintDTO;
import io.github.reinisbarzdins.dto.IndictmentDTO;
import io.github.reinisbarzdins.dto.MatchDTO;
import io.github.reinisbarzdins.dto.ScoreExplanationDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ScoreExplanationMapper {

    @SuppressWarnings({"rawtypes", "unchecked"})
    public ScoreExplanationDTO map(ScoreAnalysis<?> analysis) {
        ScoreExplanationDTO result = new ScoreExplanationDTO();
        List<ConstraintDTO> constraints = new ArrayList<>();

        // Indictments no longer exist in Timefold 2.x; reconstruct them from match
        // justifications by summing each match's score onto every justified object.
        Map<String, Score> indictmentScores = new LinkedHashMap<>();

        for (ConstraintAnalysis<?> constraintAnalysis : analysis.constraintAnalyses()) {
            ConstraintDTO constraint = new ConstraintDTO();
            constraint.setName(constraintAnalysis.constraintRef().id());
            constraint.setImpactTotal(constraintAnalysis.score().toString());
            constraint.setMatchCount(constraintAnalysis.matchCount());

            List<MatchDTO> sampleMatches = new ArrayList<>();
            List<? extends MatchAnalysis<?>> matches = constraintAnalysis.matches();

            if (matches != null) {
                for (MatchAnalysis<?> match : matches) {
                    MatchDTO matchDto = new MatchDTO();
                    matchDto.setImpact(match.score().toString());

                    List<Object> indictedObjects = extractIndictedObjects(match);
                    matchDto.setObjects(indictedObjects.stream().map(Object::toString).toList());

                    sampleMatches.add(matchDto);

                    for (Object indictedObject : indictedObjects) {
                        String key = indictedObject.toString();
                        indictmentScores.compute(key,
                                (k, current) -> current == null ? match.score() : current.add((Score) match.score()));
                    }
                }
            }

            constraint.setSampleMatches(sampleMatches);
            constraints.add(constraint);
        }

        List<IndictmentDTO> indictments = new ArrayList<>();
        indictmentScores.forEach((object, score) -> {
            IndictmentDTO indictmentDTO = new IndictmentDTO();
            indictmentDTO.setObject(object);
            indictmentDTO.setImpactTotal(score.toString());
            indictments.add(indictmentDTO);
        });

        result.setScore(analysis.score().toString());
        result.setIndictments(indictments);
        result.setConstraints(constraints);

        return result;
    }

    private List<Object> extractIndictedObjects(MatchAnalysis<?> match) {
        if (match.justification() instanceof DefaultConstraintJustification defaultJustification) {
            return new ArrayList<>(defaultJustification.getFacts());
        }

        match.justification();

        return List.of(match.justification());
    }
}
