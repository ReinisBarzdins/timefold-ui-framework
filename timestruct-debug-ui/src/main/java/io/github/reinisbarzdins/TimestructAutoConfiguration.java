package io.github.reinisbarzdins;

import io.github.reinisbarzdins.config.TimestructProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TimestructProperties.class)
@ComponentScan(basePackages = "io.github.reinisbarzdins")
public class TimestructAutoConfiguration {
}