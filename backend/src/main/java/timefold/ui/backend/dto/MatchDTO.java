package timefold.ui.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class MatchDTO {
    private String impact;
    private List<String> objects;
}
