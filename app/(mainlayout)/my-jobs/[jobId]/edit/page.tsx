
import { EditJobForm } from "@/components/forms/EditJobForm";

import { notFound } from "next/navigation";
import React from "react";

import { connectDB } from "@/lib/db";
import { JobPostModel } from "@/database/schema/JobPostModel";
import "@/database/schema/CompanyModel";
import { requireUser } from "@/app/utlis/hooks";

 async function getJobPost({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}) {
  await connectDB();

  const jobPost = await JobPostModel.findOne({ _id: jobId })
    .populate({
      path: "companyId",
      match: { user: userId }, 
      select: "about name location website xAccount logo",
    })
    .select(
      "benefits _id jobTitle jobDescription salaryTo salaryFrom location employmentType listingDuration companyId"
    )



  return {
    data: JSON.parse(JSON.stringify(jobPost)),
  };
}


type Params = Promise<{ jobId: string }>;

const EditJobPage = async ({ params }: { params: Params }) => {
  const { jobId } = await params;
  const user = await requireUser();
  const {data} = await getJobPost({ jobId, userId: user.id as string });
   console.log("object",data)



  return (
    <>
      <EditJobForm jobPost={data} jobId={jobId} />
    </>
  );
};

export default EditJobPage;