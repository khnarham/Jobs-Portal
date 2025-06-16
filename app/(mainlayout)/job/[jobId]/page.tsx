import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { notFound } from "next/navigation";
import React from "react";

import Image from "next/image";
import { Heart } from "lucide-react";

import Link from "next/link";
import {
  GeneralSubmitButton,
  SaveJobButton,
} from "@/components/general/SubmitButton";
import { JsonToHtml } from "@/components/general/JsonToHtml";
import { saveJobPost, unsaveJobPost } from "@/lib/action";
import { request } from "@arcjet/next";
import { JobPostModel } from "@/database/schema/JobPostModel";
import { SavedJobModel } from "@/database/schema/SavedJobModel";
import { connectDB } from "@/lib/db";
import { auth } from "@/app/utlis/auth";
import { getFlagEmoji } from "@/app/utlis/countriesList";
import { benefits } from "@/app/utlis/ListOfBenefits";
import "@/database/schema/CompanyModel";



async function getJob(jobId: string, userId?: string) {
  await connectDB()
  const jobQuery = JobPostModel.findOne({
    _id: jobId,
    status: "ACTIVE",
  })
    .select("jobTitle jobDescription location employmentType benefits createdAt listingDuration company")
    .populate({
      path: "companyId",
      select: "name logo location about",
    })

  const savedJobQuery = userId
    ? SavedJobModel.findOne({
        userId,
        jobId,
      }).select("_id")
    : Promise.resolve(null);

  const [jobData, savedJob] = await Promise.all([jobQuery, savedJobQuery]);

  if (!jobData) {
    return notFound();
  }

  return {
    jobData,
    savedJob,
  };
}


type Params = Promise<{ jobId: string }>;

const JobIdPage = async ({ params }: { params: Params }) => {
  const { jobId } = await params;
  const req = await request();



  const session = await auth();
  const { jobData, savedJob } = await getJob(jobId, session?.user?.id);
  const locationFlag = getFlagEmoji(jobData.location);
  console.log("jobData:", jobData)
  const company = jobData.companyId
  console.log("companyjob:", company)
  return (
    <div className="container mx-auto py-8">
      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{jobData.jobTitle}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-medium">{company.name}</span>

                <Badge className="rounded-full" variant="secondary">
                  {jobData.employmentType}
                </Badge>
                <span className="hidden md:inline text-muted-foreground">
                  •
                </span>
                <Badge className="rounded-full">
                  {locationFlag && <span className="mr-1">{locationFlag}</span>}
                  {jobData.location} Only
                </Badge>
              </div>
            </div>

            {session?.user ? (
              <form
                action={
                  savedJob
                    ? unsaveJobPost.bind(null, savedJob.id)
                    : saveJobPost.bind(null, jobId)
                }
              >
                <SaveJobButton savedJob={!!savedJob} />
              </form>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/login">
                  <Heart className="size-4 mr-2" />
                  Save Job
                </Link>
              </Button>
            )}
          </div>

          <section>
            <JsonToHtml json={JSON.parse(jobData.jobDescription)} />
          </section>

          <section>
            <h3 className="font-semibold mb-4">
              Benefits{" "}
              <span className="text-sm text-muted-foreground font-normal">
                (green is offered and red is not offered)
              </span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {benefits.map((benefit) => {
                const isOffered = jobData.benefits.includes(benefit.id);
                return (
                  <Badge
                    key={benefit.id}
                    variant={isOffered ? "default" : "outline"}
                    className={`text-sm px-4 py-1.5 rounded-full ${
                      !isOffered && " opacity-75 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {benefit.icon}
                      {benefit.label}
                    </span>
                  </Badge>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Apply now</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Please let {company.name} know you found this job on
                  JobMarshal. This helps us grow!
                </p>
              </div>
              <form>
                <input type="hidden" name="jobId" value={jobId} />
                <GeneralSubmitButton text="Apply now" />
              </form>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">About the job</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Apply before
                  </span>
                  <span className="text-sm">
                    {new Date(
                      jobData.createdAt.getTime() +
                        jobData.listingDuration * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Posted on
                  </span>
                  <span className="text-sm">
                    {jobData.createdAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Employment type
                  </span>
                  <span className="text-sm">{jobData.employmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Location
                  </span>
                  <Badge variant="secondary">{jobData.location}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    company.logo ??
                    `https://avatar.vercel.sh/${company.name}`
                  }
                  alt={company.name}
                  width={48}
                  height={48}
                  className="rounded-full size-12"
                />
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm overflow-hidden text-muted-foreground line-clamp-3">
                    {company.about}
                  </p>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobIdPage;