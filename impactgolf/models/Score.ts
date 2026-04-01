import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScore extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  // PRD: Stableford format, range 1–45
  score: number;
  playedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Stableford points: 1–45 per PRD §05
    score: { type: Number, required: true, min: 1, max: 45 },
    playedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Fetch user's latest 5 scores efficiently
ScoreSchema.index({ userId: 1, playedAt: -1 });

const Score: Model<IScore> =
  mongoose.models.Score || mongoose.model<IScore>("Score", ScoreSchema);

export default Score;
