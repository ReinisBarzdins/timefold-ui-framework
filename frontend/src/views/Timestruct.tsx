import { useJobList } from "../queries/getJobList.ts";
import { useJob } from "../queries/getJob.ts";
import { useSolutionStructure } from "../queries/getSolutionStructure.ts";
import { useScoreExplanation } from "../queries/getScoreExplanation.ts";

const Timestruct = () => {
  const { data: jobList } = useJobList();

  console.log(jobList)

  if (jobList && jobList?.length > 0) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: job } = useJob(jobList[0]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: score } = useScoreExplanation(jobList[0]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: solver } = useSolutionStructure(jobList[0]);

    console.log(job);
    console.log(score);
    console.log(solver);
    
  }

  return (
    <>
      <div>cav</div>
    </>
  )
}

export default Timestruct;