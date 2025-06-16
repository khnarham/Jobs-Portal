// models/session.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // 👈 Make sure your User model name is 'User'
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // 👈 Automatically adds createdAt and updatedAt
  }
);

export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", sessionSchema);
