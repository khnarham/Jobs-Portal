import { PaginationComponent } from "./PaginationComponent";
import { EmptyState } from "./EmptyState";
import { JobCard } from "./JobCard";

interface JobListingsProps {
  currentPage: number;
  jobTypes: string[];
  location: string;
}

import { JobPostModel, JobPostStatus } from "@/database/schema/JobPostModel";
import { connectDB } from "@/lib/db";
import "@/database/schema/CompanyModel";

export async function getJobs(
  page: number = 1,
  pageSize: number = 10,
  jobTypes: string[] = [],
  location: string = ""
) {
  await  connectDB()
  const skip = (page - 1) * pageSize;

  const filters: any = {
    status: JobPostStatus.ACTIVE,
  };

  if (jobTypes.length > 0) {
    filters.employmentType = { $in: jobTypes };
  }

  if (location && location.toLowerCase() !== "worldwide") {
    filters.location = location;
  }

  const [data, totalCount] = await Promise.all([
    JobPostModel.find(filters)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate({
        path: "companyId",
        select: "name logo location about",
      })
      .lean(),
    JobPostModel.countDocuments(filters),
  ]);

  return {
    jobs: JSON.parse(JSON.stringify(data)),
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}


const JobListings = async ({ currentPage, jobTypes, location }: JobListingsProps) => {
  const {
    jobs,
    totalPages,
    currentPage: page,
  } = await getJobs(currentPage, 7, jobTypes, location);

  if (!jobs) return null;

  return (
    <>
      {jobs.length > 0 ? (
        <div className="flex flex-col gap-6">
          {/* @ts-ignore */}
          {jobs.map((job, index) => (
            <JobCard job={job} key={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No jobs found"
          description="Try searching for a different job title or location."
          buttonText="Clear all filters"
          href="/"
        />
      )}

      <div className="flex justify-center mt-6">
        <PaginationComponent totalPages={totalPages} currentPage={page} />
      </div>
    </>
  );
};

export default JobListings;
