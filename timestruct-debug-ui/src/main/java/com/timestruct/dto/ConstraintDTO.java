package com.timestruct.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class ConstraintDTO {
    private String name;
    private String impactTotal;
    private int matchCount;
    private List<MatchDTO> sampleMatches;

    public void setName(String name) {
        int slashIndex = name.indexOf('/');

        if (slashIndex != -1) {
            this.name = name.substring(slashIndex + 1);
        } else {
            this.name = name;
        }
    }
}
