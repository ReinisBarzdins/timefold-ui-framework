package io.github.reinisbarzdins.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Setter
@Getter
@ConfigurationProperties(prefix = "timestruct")
public class TimestructProperties {
    private String apiPrefix = "/timestruct";
}