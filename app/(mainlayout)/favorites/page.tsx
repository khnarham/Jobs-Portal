import { EmptyState } from "@/components/general/EmptyState";
import React from "react";
import { iAppProps, JobCard } from "@/components/general/JobCard";

import { requireUser } from "@/app/utlis/hooks";
import { connectDB } from "@/lib/db";

import "@/database/schema/JobPostModel";
import "@/database/schema/CompanyModel";
import { SavedJobModel } from "@/database/schema/SavedJobModel";

async function getFavorites(userId: string): Promise<iAppProps[]> {
  await connectDB();

  const saved = await SavedJobModel.find({ userId })
    .populate({
      path: "jobId",
      populate: {
        path: "companyId",
        select: "name logo location about",
      },
      select:
        "jobTitle salaryFrom salaryTo employmentType location createdAt companyId",
    })
    .lean();

  const favorites = saved
    .filter((entry) => entry.jobId && entry.jobId.companyId)
    .map((entry) => {
      const job = entry.jobId;
      const company = job.companyId;

      return {
        job: {
          _id: job._id.toString(),
          jobTitle: job.jobTitle,
          salaryFrom: job.salaryFrom,
          salaryTo: job.salaryTo,
          employmentType: job.employmentType,
          location: job.location,
          createdAt: job.createdAt,
          companyId: {
            logo: company.logo ?? null,
            name: company.name,
            about: company.about,
            location: company.location,
          },
        },
      };
    });

  return favorites;
}

const FavoritesPage = async () => {
  const session = await requireUser();
  const data = await getFavorites(session.id as string);

  if (data.length === 0) {
    return (
      <EmptyState
        title="No favorites found"
        description="You don't have any favorites yet."
        buttonText="Find a job"
        href="/jobs"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 mt-5 gap-4">
      {data.map(({ job }) => (
        <JobCard job={job} key={job._id} />
      ))}
    </div>
  );
};

export default FavoritesPage;
