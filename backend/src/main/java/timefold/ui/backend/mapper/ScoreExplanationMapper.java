package timefold.ui.backend.mapper;

import ai.timefold.solver.core.api.score.ScoreExplanation;
import org.springframework.stereotype.Component;
import timefold.ui.backend.dto.ConstraintDTO;
import timefold.ui.backend.dto.IndictmentDTO;
import timefold.ui.backend.dto.MatchDTO;
import timefold.ui.backend.dto.ScoreExplanationDTO;

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
}
