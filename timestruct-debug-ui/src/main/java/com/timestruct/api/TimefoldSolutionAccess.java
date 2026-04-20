package com.timestruct.api;

import java.util.Collection;

public interface TimefoldSolutionAccess {
    Collection<String> listJobIds();

    Object getSolution(String jobId);

    Object getSolverStatus(String jobId);
}
