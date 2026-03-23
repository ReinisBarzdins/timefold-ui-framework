package timefold.ui.backend.dto;

import java.util.List;

public class EntityGroupDTO {
    private String entityClass;
    private List<EntityInstanceDTO> entities;

    public String getEntityClass() {
        return entityClass;
    }

    public void setEntityClass(String entityClass) {
        this.entityClass = entityClass;
    }

    public List<EntityInstanceDTO> getEntities() {
        return entities;
    }

    public void setEntities(List<EntityInstanceDTO> entities) {
        this.entities = entities;
    }
}
