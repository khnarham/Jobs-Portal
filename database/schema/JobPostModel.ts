import mongoose, { Schema, Document } from "mongoose";

export enum JobPostStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export interface IJobPost extends Document {
  jobTitle: string;
  employmentType: string;
  location: string;
  salaryFrom: number;
  salaryTo: number;
  jobDescription: string;
  listingDuration: number;
  benefits: string[];
  status: JobPostStatus;
  applications: number;
  companyId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostSchema = new Schema<IJobPost>(
  {
    jobTitle: { type: String, required: true },
    employmentType: { type: String, required: true },
    location: { type: String, required: true },
    salaryFrom: { type: Number, required: true },
    salaryTo: { type: Number, required: true },
    user :{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobDescription: { type: String, required: true },
    listingDuration: { type: Number, required: true },
    benefits: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(JobPostStatus),
      default: JobPostStatus.DRAFT,
    },
    applications: { type: Number, default: 0 },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export const JobPostModel =
  mongoose.models.JobPost || mongoose.model<IJobPost>("JobPost", JobPostSchema);
