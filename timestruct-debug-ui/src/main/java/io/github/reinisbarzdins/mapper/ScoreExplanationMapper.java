package io.github.reinisbarzdins.mapper;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import io.github.reinisbarzdins.dto.ConstraintDTO;
import io.github.reinisbarzdins.dto.IndictmentDTO;
import io.github.reinisbarzdins.dto.MatchDTO;
import io.github.reinisbarzdins.dto.ScoreExplanationDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ScoreExplanationMapper {
    public ScoreExplanationDTO map(ScoreExplanation<?, ?> explanation) {
        ScoreExplanationDTO result = new ScoreExplanationDTO();
        List<ConstraintDTO> constraints = new ArrayList<>();
        List<IndictmentDTO> indictments = new ArrayList<>();

        explanation.getConstraintMatchTotalMap().forEach((name, constraintMatchTotal) -> {
            ConstraintDTO constraint = new ConstraintDTO();
            constraint.setName(name);
            constraint.setImpactTotal(constraintMatchTotal.getScore().toString());
            constraint.setMatchCount(constraintMatchTotal.getConstraintMatchSet().size());

            List<MatchDTO> sampleMatches = constraintMatchTotal.getConstraintMatchSet()
                    .stream()
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
}
