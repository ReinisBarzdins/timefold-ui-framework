package io.github.reinisbarzdins.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Setter
@Getter
public class EntityInstanceDTO {
    private String id;
    private String label;
    private Map<String, Object> planningVariables;
    private Map<String, Object> details;
}