import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICharity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
  active: boolean;
  featured: boolean; // spotlight section on homepage per PRD §08
  totalRaised: number; // stored in pence, updated each draw
  upcomingEvents: {
    title: string;
    date: Date;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CharitySchema = new Schema<ICharity>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    logoUrl: { type: String },
    website: { type: String },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    totalRaised: { type: Number, default: 0, min: 0 },
    // PRD §08: individual charity profiles include upcoming events (e.g. golf days)
    upcomingEvents: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Charity: Model<ICharity> =
  mongoose.models.Charity || mongoose.model<ICharity>("Charity", CharitySchema);

export default Charity;
