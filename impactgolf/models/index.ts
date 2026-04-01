// Central model registry — import from here, never directly from model files
// This ensures mongoose.models cache is always populated before use

export { default as User } from "./User";
export { default as Score } from "./Score";
export { default as Charity } from "./Charity";
export { default as Draw } from "./Draw";
export { default as Subscription } from "./Subscription";
export { default as CharityContribution } from "./CharityContribution";

export type { IUser } from "./User";
export type { IScore } from "./Score";
export type { ICharity } from "./Charity";
export type { IDraw, IDrawWinner } from "./Draw";
export type { ISubscription } from "./Subscription";
export type { ICharityContribution } from "./CharityContribution";
