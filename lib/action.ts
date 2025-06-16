"use server"
import { requireUser } from "@/app/utlis/hooks";
import { ICompany } from "@/database/schema/CompanyModel";
import CompanyModel from "@/database/schema/CompanyModel";
import UserModel from "@/database/schema/UserModel";
import { connectDB } from "./db";
import { CompanyFormValues, JobSeekerFormValues } from "@/types";
import JobSeekerModel from "@/database/schema/JobSeekerModel";
import arcjet, { detectBot, shield } from "@/app/utlis/arcjet";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";
import { jobSchema } from "@/app/utlis/ZodSchema";
import { z } from "zod";
import { JobPostModel } from "@/database/schema/JobPostModel";
import { jobListingDurationPricing } from "@/app/utlis/pricingTiers";
import { stripe } from "./stripe";
import mongoose from "mongoose";
import { SavedJobModel } from "@/database/schema/SavedJobModel";
import { revalidatePath } from "next/cache";

const aj = arcjet
  .withRule(
    shield({
      mode: "LIVE",
    })
  )
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  );

export const createCompany = async (companyData: CompanyFormValues) => {
    try{
        await connectDB();
        const user = await requireUser();
   
        const company = await CompanyModel.create({
            ...companyData,
            user: user.id,
        })
    
        if(!company){
           return {success: false, message: "Failed to create company"}
        }
        await UserModel.updateOne(
            {_id: user.id},
            {$set: {company: company._id}},
        )
        return {
            success: true,
            message: "Company created successfully",
            data: JSON.stringify(company.toObject()), 
        };
    }catch(error){
        console.log(error);
        return {success: false, message: "Failed to create company"}
    }
}


export const createJobSeeker = async (jobSeekerData: JobSeekerFormValues) => {
    try{
        await connectDB();
        const user = await requireUser();
      
        const jobSeeker = await JobSeekerModel.create({
            ...jobSeekerData,
            user: user.id,
        })
        if(!jobSeeker){
            return {success: false, message: "Failed to create job seeker"}
        }
        await UserModel.updateOne(
            {_id: user.id},
            {$set: {jobSeeker: jobSeeker._id}},
        )
        return {
            success: true,
            message: "Job seeker created successfully",
            data: JSON.stringify(jobSeeker.toObject()),
        }
    }catch(error){
        console.log(error);
        return {success: false, message: "Failed to create job seeker"}
    }
}




export async function createJob(data: z.infer<typeof jobSchema>) {
    await connectDB();
    const user = await requireUser();
    const company = await CompanyModel.findOne({ user: user.id }).populate("user", "stripeCustomerId")
    
    if(!company){
        return {success: false, message: "Company not found"}
    }
    let stripeCustomerId = company.user?.stripeCustomerId;
    
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email!,
            name: user.name || undefined,
        });
        stripeCustomerId = customer.id;

  await UserModel.findOneAndUpdate(
        { email: user.email },
        { $set: { stripeCustomerId: customer.id } },
        { new: true }
      );

    }
     const User = await UserModel.findOne({email: user.email});
     if(!User){
        return {success: false, message: "User not found"}
     }
     console.log("USER:",User);
    const jobPost = await JobPostModel.create({
      companyId: company._id,
      user: User._id,
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle,
      employmentType: data.employmentType,
      location: data.location,
      salaryFrom: data.salaryFrom,
      salaryTo: data.salaryTo,
      listingDuration: data.listingDuration,
      benefits: data.benefits,
    });
    if(!jobPost){
        return {success: false, message: "Failed to create job post"}
    }
     console.log("JOBPOST:",jobPost);
    const pricingTier = jobListingDurationPricing.find(
      (tier) => tier.days === data.listingDuration
    );
  
    if (!pricingTier) {
      throw new Error("Invalid listing duration selected");
    }
  
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            product_data: {
              name: `Job Posting - ${pricingTier.days} Days`,
              description: pricingTier.description,
              images: [
                "https://pve1u6tfz1.ufs.sh/f/Ae8VfpRqE7c0gFltIEOxhiBIFftvV4DTM8a13LU5EyzGb2SQ",
              ],
            },
            currency: "USD",
            unit_amount: pricingTier.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        jobId: jobPost._id.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
    });
    return redirect(session.url as string);
  }
  

export async function getJobs(page: number , pageSize: number = 10 , jobType: string[] = [] , location: string = ""){
   await connectDB();
   const skip = (page - 1) * pageSize;
   const filter: any = {
     status: "ACTIVE",
   }
   const [data, totalCount] = await Promise.all([
    JobPostModel.find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate({
        path: "companyId",
        select: "name logo location about",
        model: CompanyModel,
      })
      .select("jobTitle _id salaryFrom salaryTo employmentType location createdAt"),
    JobPostModel.countDocuments(filter),
  ]);
  console.log("DATA:",data);
  return {
    jobs: data,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}





export async function saveJobPost(jobId: string){
  await connectDB();
  const user = await requireUser();
  const job = await JobPostModel.findOne({_id: jobId});

  const savedJob = await SavedJobModel.create({
    jobId: job._id,
    userId: user.id,
  })
  revalidatePath(`/job/${jobId}`)
}

export async function unsaveJobPost(savedJobId: string){
  await connectDB();
  const user = await requireUser();;

  const savedJob = await SavedJobModel.findOneAndDelete({_id: savedJobId, userId: user.id}).select("jobId");

  redirect(`/job/${savedJob.jobId}`);
}



export async function updateJobPost(
  data: z.infer<typeof jobSchema>,
  jobId: string
) {
  await connectDB();
  const user = await requireUser();


  const company = await CompanyModel.findOne({ user: user.id });

  if (!company) {
    throw new Error("Company not found for this user.");
  }
  const jobObjectId = new mongoose.Types.ObjectId(jobId);

  const updated = await JobPostModel.findOneAndUpdate(
    { _id: jobObjectId, companyId: company._id },
    {
      $set: {
        jobDescription: data.jobDescription,
        jobTitle: data.jobTitle,
        employmentType: data.employmentType,
        location: data.location,
        salaryFrom: data.salaryFrom,
        salaryTo: data.salaryTo,
        listingDuration: data.listingDuration,
        benefits: data.benefits,
      },
    },
    {
      new: true,     
      runValidators: true, 
    }
  );

  if (!updated) {
    throw new Error("Job post not found or not authorized.");
  }

  return redirect("/my-jobs");
}


export async function deleteJobPost(jobId: string) {
  await connectDB();
  const user = await requireUser();

  const company = await CompanyModel.findOne({ user: user.id });

  if (!company) {
    throw new Error("Company not found for the current user.");
  }

  await JobPostModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(jobId),
    companyId: company._id,
  });

  return redirect("/my-jobs");
}