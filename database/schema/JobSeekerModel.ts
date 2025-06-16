
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IJobSeeker extends Document {
  name: string;
  about: string;
  resume: string;
  userId: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

const JobSeekerSchema = new Schema<IJobSeeker>(
  {
    name: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

const JobSeekerModel =
  models.JobSeeker || model<IJobSeeker>("JobSeeker", JobSeekerSchema);

export default JobSeekerModel;
