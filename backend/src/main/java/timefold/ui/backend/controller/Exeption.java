package timefold.ui.backend.controller;

import org.springframework.http.HttpStatus;

public class Exeption extends RuntimeException {
    private final String jobId;

    private final HttpStatus status;

    public Exeption(String jobId, HttpStatus status, String message) {
        super(message);
        this.jobId = jobId;
        this.status = status;
    }

    public Exeption(String jobId, Throwable cause) {
        super(cause.getMessage(), cause);
        this.jobId = jobId;
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public String getJobId() {
        return jobId;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
