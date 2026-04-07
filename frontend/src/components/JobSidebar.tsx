import { type FC } from "react";

import styles from "./JobSidebar.module.scss";

type JobSidebarProps = {
  jobs: string[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  isLoading?: boolean;
  error?: string | null;
};

export const JobSidebar: FC<JobSidebarProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  isLoading = false,
  error = null,
}) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>TimeStruct</h2>
        <p className={styles.subtitle}>Jobs</p>
      </div>

      {isLoading && (
        <div className={styles.message}>Loading jobs...</div>
      )}

      {error && (
        <div className={styles.error}>Error: </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className={styles.message}>No jobs found</div>
      )}

      <div className={styles.list}>
        {jobs.map((jobId) => {
          const isSelected = selectedJobId === jobId;

          return (
            <button
              key={jobId}
              onClick={() => onSelectJob(jobId)}
              className={`${styles.jobButton} ${
                isSelected ? styles.jobButtonSelected : ""
              }`}
            >
              <span className={styles.jobId}>{jobId}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};