package io.github.reinisbarzdins.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TimestructConfigController {

    @Value("${timestruct.api-prefix:/timestruct}")
    private String apiPrefix;

    @GetMapping("/timestruct-config")  // always fixed
    public Map<String, String> getConfig() {
        return Map.of("apiPrefix", apiPrefix);
    }
}