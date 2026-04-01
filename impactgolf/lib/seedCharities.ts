import { connectDB } from "./mongodb";
import { Charity } from "@/models";

const charities = [
  {
    name: "Clean Water Initiative",
    description: "Building solar-powered wells across sub-Saharan Africa. Every contribution provides clean water for one family for a year.",
    logoUrl: "/hero_image.png",
    website: "https://cleanwater.org",
    featured: true,
    active: true,
    totalRaised: 24850000,
    upcomingEvents: [
      { title: "Charity Golf Day — Mumbai", date: new Date("2026-04-15"), description: "Annual golf fundraiser at Mumbai Golf Club" },
      { title: "Fundraiser Dinner", date: new Date("2026-05-10"), description: "Online fundraising dinner event" },
    ],
  },
  {
    name: "Reforestation Trust",
    description: "Planting native trees across deforested regions of South Asia and Africa to restore biodiversity and combat climate change.",
    logoUrl: "/Hero_bg.png",
    website: "https://reforest.org",
    featured: false,
    active: true,
    totalRaised: 12400000,
    upcomingEvents: [
      { title: "Tree Planting Drive", date: new Date("2026-04-22"), description: "Earth Day planting event in Bangalore" },
    ],
  },
  {
    name: "Children's Education Fund",
    description: "Providing school supplies, scholarships, and digital learning tools to underprivileged children across rural India.",
    logoUrl: "/hero_image.png",
    website: "https://edufund.org",
    featured: false,
    active: true,
    totalRaised: 18900000,
    upcomingEvents: [],
  },
  {
    name: "Mental Health Alliance",
    description: "Funding free mental health services and awareness campaigns for youth in underserved communities worldwide.",
    logoUrl: "/Hero_bg.png",
    website: "https://mhalliance.org",
    featured: false,
    active: true,
    totalRaised: 9750000,
    upcomingEvents: [
      { title: "Awareness Golf Tournament", date: new Date("2026-06-05"), description: "Delhi Golf Club charity tournament" },
    ],
  },
  {
    name: "Ocean Cleanup Project",
    description: "Deploying autonomous systems to remove plastic waste from the world's oceans and coastal waterways.",
    logoUrl: "/hero_image.png",
    website: "https://oceancleanup.org",
    featured: false,
    active: true,
    totalRaised: 31200000,
    upcomingEvents: [],
  },
  {
    name: "Hunger Relief Network",
    description: "Distributing emergency food supplies and building sustainable farming infrastructure in food-insecure regions.",
    logoUrl: "/Hero_bg.png",
    website: "https://hungerrelief.org",
    featured: false,
    active: true,
    totalRaised: 22100000,
    upcomingEvents: [
      { title: "Golf for Good", date: new Date("2026-05-20"), description: "Charity golf day at Chennai Golf Club" },
    ],
  },
];

export async function seedCharities() {
  await connectDB();
  const count = await Charity.countDocuments();
  if (count > 0) {
    console.log(`Charities already seeded (${count} found). Skipping.`);
    return { seeded: false, count };
  }
  await Charity.insertMany(charities);
  console.log(`Seeded ${charities.length} charities.`);
  return { seeded: true, count: charities.length };
}
