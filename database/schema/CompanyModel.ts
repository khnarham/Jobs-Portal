import mongoose, { Schema, Document, Types } from 'mongoose';


export interface ICompany extends Document {
    name: string;
    location: string;
    logo: string;
    website: string;
    xAccount?: string;
    about?: string;
    user: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true },
    location: { type: String, required: true },
    logo: { type: String, required: true },
    website: { type: String, required: true },
    xAccount: { type: String, required: false },
    about: { type: String, required: false },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);