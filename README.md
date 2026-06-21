# timestruct-debug-ui

A debug UI tool for [Timefold](https://timefold.ai/) based Spring Boot applications. It provides a visual interface to inspect solver jobs, solution structures, and score explanations at runtime.

## Preview
![Debug UI](docs/example.png)

---

## Requirements

- Java 21

- Spring Boot 4.1.0

- Timefold Solver 2.2.0 (Enterprise Edition) — valid Timefold license required

⚠️ Important: The latest version of the devtool currently supports:

- Java 21

- Spring Boot 4.1.0

- Timefold Solver 2.2.0 Enterprise

> ⚠️ **Enterprise license required.** Starting with `2.0.0`, the debug UI relies on the
> `ScoreAnalysis` API, which Timefold provides **only in the Plus and Enterprise editions**
> (the `ScoreExplanation` API used previously was removed in Timefold Solver v2). The library
> therefore depends on the Timefold Enterprise artifacts, and a valid Timefold license is
> required at runtime (and to build from source). See [License Setup](#license-setup) below.

---

## Installation

Add the dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.github.reinisbarzdins</groupId>
    <artifactId>timestruct-debug-ui</artifactId>
    <version>2.0.0</version>
</dependency>
```

The library pulls in the Timefold Enterprise Spring Boot starter transitively. The Enterprise
artifacts are published to **Maven Central**, so no additional Maven repository configuration is
required. The library uses Spring Boot auto-configuration and registers itself automatically when
the dependency is present.

---

## License Setup

The Timefold Enterprise artifacts perform a license check at runtime. Obtain a license from the
[Timefold license portal](https://licenses.timefold.ai/) and supply it using **one** of the
following methods (checked in this order):

1. **`TIMEFOLD_LICENSE`** — environment variable containing the license (PEM contents). Useful
   for CI and containerized deployments.
2. **`TIMEFOLD_LICENSE_PATH`** — environment variable containing the absolute path to your
   license file.
3. **`timefold-license.pem` in your user home directory** — Timefold auto-detects this file. The
   file name must match exactly, including letter case.

> ⚠️ **Never commit your license.** Keep the `.pem` file outside the repository (the user home
> directory works well) or inject it via an environment variable / CI secret. This project's
> `.gitignore` already excludes `*.pem`, `.env`, `.env.local`, and `licenses/` as a safeguard.

---

## Endpoints

All endpoints are served under the `/timestruct` prefix by default. The full list of available endpoints:

| Endpoint | Description |
|---|---|
| `GET /timestruct/ui` | Opens the debug UI in the browser — navigate to this URL to inspect your solver jobs visually |
| `GET /timestruct/jobs` | Returns a list of all active job IDs |
| `GET /timestruct/{jobId}` | Get details for a specific job |
| `GET /timestruct/{jobId}/solution-structure` | Get the solution structure for a specific job |
| `GET /timestruct/{jobId}/score-explanation` | Get the score explanation for a specific job |
| `GET /timestruct-config` | Returns the active API prefix (used internally by the UI to discover endpoints) |

### Custom Prefix

The default prefix is `/timestruct`. If it conflicts with your application's existing endpoints, you can override it in `application.properties`:

```properties
timestruct.api-prefix=/my-custom-prefix
```

All endpoints will then be available under `/my-custom-prefix/` (e.g. `/my-custom-prefix/ui`, `/my-custom-prefix/jobs`). The `/timestruct-config` endpoint always stays at its fixed URL so the UI can always discover the active prefix regardless of what it is set to.

---

## Integration

### 1. Set up a Job and JobStore

> ⚠️ **This library requires a job-based architecture.** The debug UI is built around the concept of named jobs — each planning problem submitted to the solver must be stored and tracked by a unique `jobId`. Without this, the UI has no way to list, retrieve, or inspect solver runs.

The **main controller** must expose the job storage as a public final field so it can be accessed by the devtool solution access layer, for example:

```java
public final ConcurrentMap<String, Job> jobIdToJob = new ConcurrentHashMap<>();
```

The Job record, also located inside the main controller, stores the current solution instance and any exception that may have occurred during the solving process. The record must be declared as public so it can be accessed outside the controller:

```java
public record Job(MySolution solution, Throwable exception) {
    static Job ofSolution(MySolution solution) {
        return new Job(solution, null);
    }

    static Job ofException(Throwable error) {
        return new Job(null, error);
    }
}
```

Later in the **MySolutionAccess class**, these jobs are exposed and passed to the ui-debug tool, allowing the frontend to access the current solutions, solver statuses, and score analysis information.

The following is one example of how jobs can be stored using `solveBuilder()`. This is not the only way — jobs can be stored in memory, a database, or any other storage mechanism, as long as they are accessible via `TimefoldSolutionAccess`. The only requirement is that each job is identifiable by a unique `jobId`.

```java
@PostMapping
public String solve(@RequestBody SolveRequest request) {
    DSPsolution problem = createProblem(request);
    String jobId = UUID.randomUUID().toString();

    // Store the initial problem immediately
    jobIdToJob.put(jobId, Job.ofSolution(problem));

    solverManager.solveBuilder()
        .withProblemId(jobId)
        .withProblemFinder(id -> jobIdToJob.get(jobId).solution())
        .withBestSolutionConsumer(solution ->
            jobIdToJob.put(jobId, Job.ofSolution(solution)))
        .withExceptionHandler((id, exception) -> {
            jobIdToJob.put(jobId, Job.ofException(exception));
            log.error("Failed solving jobId ({}).", jobId, exception);
        })
        .run();

    return jobId;
}
```

The key points are:
- The job is stored **immediately** when the problem is submitted, before solving starts
- `withBestSolutionConsumer` updates the job in the store every time the solver finds a better solution
- `withExceptionHandler` stores any errors so the UI can display them
- The debug UI polls the store and always shows the latest available solution for each job

---

### 2. Implement `TimefoldSolutionAccess`

The debug UI has no direct access to your solver or your jobs — it doesn't know what planning problem you're solving or how you store your data. `TimefoldSolutionAccess` is the bridge between your application and the debug UI. By implementing this interface, you tell the library how to list your jobs, how to retrieve a solution by `jobId`, and how to check the solver status. Without it, the UI has nothing to display.

Create a `@Component` that implements the interface:

```java
@Component
public class MySolutionAccess implements TimefoldSolutionAccess {
    private final Controller controller;
    private final SolverManager<?, String> solverManager;

    public MySolutionAccess(
            Controller controller,
            SolverManager<?, String> solverManager
    ) {
        this.controller = controller;
        this.solverManager = solverManager;
    }

    @Override
    public Collection<String> listJobIds() {
        return controller.jobIdToJob.keySet();
    }

    @Override
    public Object getSolution(String jobId) {
        Controller.Job job = controller.jobIdToJob.get(jobId);
        return job != null ? job.schedule() : null;
    }

    @Override
    public Object getSolverStatus(String jobId) {
        return solverManager.getSolverStatus(jobId);
    }
}
```

## Domain Class Requirement

> ⚠️ **Important:** Every domain class (planning entity, planning solution, etc.) **must** override `toString()` in the following format:

```java
@Override
public String toString() {
    return getClass().getSimpleName() + id;
}
```

This generates a unique string identifier for each object (e.g. `Shift1`, `Employee3`). The debug UI relies on these identifiers to correctly group, display, and reference entities and planning variables in the solution structure view.

Without this, the UI will use Java's default `toString()` output which includes a memory address (e.g. `com.example.Shift@6d06d69c`). This means:
- Different objects may produce identical or near-identical labels
- The UI cannot reliably group or distinguish entities
- Solution structure and score explanation views will be confusing or unreadable

---

## How It Works

The library follows a job-based model:

1. Your application submits planning problems as **jobs** with a unique `jobId`
2. The `JobStore` holds active jobs in memory
3. `TimefoldSolutionAccess` exposes jobs to the debug UI
4. The UI fetches job data via the REST endpoints and visualizes the solution structure and score explanation in real time
5. While the solver is running, the UI automatically refetches the current solution every **5 seconds**, so you can watch the solution improve live without manually refreshing the page

### Score analysis & indictments

Score data is collected via `SolutionManager.analyze(solution, ScoreAnalysisFetchPolicy.FETCH_ALL)`,
which returns a Timefold `ScoreAnalysis`. The per-constraint breakdown and sample matches map
directly from `ScoreAnalysis.constraintAnalyses()`.

> ⚠️ **Custom justification caveat.** Timefold v2 removed the `Indictment` API, so the per-entity
> impact view ("indictments") is **reconstructed** by summing each match's score over its justified
> objects. This works out of the box for constraints using the default justification
> (`DefaultConstraintJustification`). If your constraints provide a **custom**
> `ConstraintJustification` (via `.justifyWith(...)`), it carries no fact list, so indicted objects
> fall back to the justification's `toString()` and per-entity grouping may be less precise.

---

## License

MIT
