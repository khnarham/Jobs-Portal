import mongoose, { Schema, Document, Types } from 'mongoose';

export enum UserType {
  COMPANY = 'COMPANY',
  JOB_SEEKER = 'JOB_SEEKER',
}

export interface IUser extends Document {
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  onboardingCompleted: boolean;
  userType?: UserType;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
  accounts: Types.ObjectId[];
  sessions: Types.ObjectId[];
  authenticators: Types.ObjectId[];
  company?: Types.ObjectId;
  jobSeeker?: Types.ObjectId;
  savedJobPosts: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date },
    image: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    userType: { type: String, enum: Object.values(UserType) },
    stripeCustomerId: { type: String, unique: true, sparse: true },

    accounts: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
    authenticators: [{ type: Schema.Types.ObjectId, ref: 'Authenticator' }],

    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    jobSeeker: { type: Schema.Types.ObjectId, ref: 'JobSeeker' },
    savedJobPosts: [{ type: Schema.Types.ObjectId, ref: 'SavedJobPost' }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
