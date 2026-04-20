package com.timestruct.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class EntityGroupDTO {
    private String entityClass;
    private List<EntityInstanceDTO> entities;
}
