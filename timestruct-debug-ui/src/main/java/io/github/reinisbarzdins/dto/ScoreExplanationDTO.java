package io.github.reinisbarzdins.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class ScoreExplanationDTO {
    private String score;
    private List<ConstraintDTO> constraints;
    private List<IndictmentDTO> indictments;
}
