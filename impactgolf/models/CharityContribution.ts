import mongoose, { Schema, Document, Model } from "mongoose";

// Records every charity payout — one per user per draw period
export interface ICharityContribution extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  charityId: mongoose.Types.ObjectId;
  drawId: mongoose.Types.ObjectId; // which monthly draw triggered this
  amountPence: number;
  contributionPercent: number; // snapshot of user's % at time of draw
  status: "pending" | "paid";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CharityContributionSchema = new Schema<ICharityContribution>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    charityId: { type: Schema.Types.ObjectId, ref: "Charity", required: true, index: true },
    drawId: { type: Schema.Types.ObjectId, ref: "Draw", required: true },
    amountPence: { type: Number, required: true, min: 0 },
    contributionPercent: { type: Number, required: true, min: 10, max: 100 },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

CharityContributionSchema.index({ drawId: 1, charityId: 1 });

const CharityContribution: Model<ICharityContribution> =
  mongoose.models.CharityContribution ||
  mongoose.model<ICharityContribution>("CharityContribution", CharityContributionSchema);

export default CharityContribution;
