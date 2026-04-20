package com.timestruct.mapper;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import com.timestruct.dto.ConstraintDTO;
import com.timestruct.dto.IndictmentDTO;
import com.timestruct.dto.MatchDTO;
import com.timestruct.dto.ScoreExplanationDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ScoreExplanationMapper {
    public ScoreExplanationDTO map(ScoreExplanation<?, ?> explanation) {
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
