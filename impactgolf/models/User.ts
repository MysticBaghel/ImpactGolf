import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  // Stripe
  stripeCustomerId?: string;
  subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due";
  subscriptionId?: string;
  subscriptionPlan?: "monthly" | "annual";
  subscriptionCurrentPeriodEnd?: Date;
  // Charity
  charityId?: mongoose.Types.ObjectId;
  charityContributionPercent: number; // 10–100, min 10% per PRD
  // Winner verification
  winnerProofUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    stripeCustomerId: { type: String, sparse: true },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "cancelled", "past_due"],
      default: "inactive",
      index: true,
    },
    subscriptionId: { type: String, sparse: true },
    subscriptionPlan: { type: String, enum: ["monthly", "annual"] },
    subscriptionCurrentPeriodEnd: { type: Date },

    charityId: { type: Schema.Types.ObjectId, ref: "Charity" },
    charityContributionPercent: { type: Number, default: 10, min: 10, max: 100 },

    winnerProofUrl: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
