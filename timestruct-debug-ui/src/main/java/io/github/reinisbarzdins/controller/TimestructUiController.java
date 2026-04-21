package io.github.reinisbarzdins.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TimestructUiController {
    @GetMapping("/timestruct/ui")
    public String timestruct() {
        return "forward:/timestruct/ui/index.html";
    }
}