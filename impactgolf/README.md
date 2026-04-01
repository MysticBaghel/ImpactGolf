# ImpactGolf 🏌️‍♂️

> Elite charity golf draws — where every subscription creates real-world impact.

ImpactGolf is a subscription-based platform that connects golf enthusiasts to charitable causes through a transparent draw mechanic. Subscribers choose a charity, pay a monthly or annual fee, and enter automatic prize draws — with a minimum 10% of every subscription going directly to the selected charity.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: MongoDB Atlas (Mongoose)
- **Payments**: Stripe (subscriptions + webhooks)
- **Auth**: JWT (custom, stored in localStorage)
- **Deployment**: Vercel

---

## Features

- 🔐 Auth (register/login with JWT)
- 💳 Stripe subscription (monthly & annual plans)
- 🏆 Automated prize draw engine
- 🎯 Charity selection & contribution tracking
- 📊 Admin dashboard (users, draws, winners, charities)
- ✅ Winner verification flow
- 📱 Fully responsive dark UI (Impact Luminary design system)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/MysticBaghel/ImpactGolf.git
cd ImpactGolf/impactgolf
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the `impactgolf` directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. https://impact-golf-xi.vercel.app) |

---

## Project Structure

```
impactgolf/
├── app/
│   ├── (app)/          # Protected app pages
│   │   ├── admin/      # Admin dashboard
│   │   ├── charities/  # Charity directory
│   │   ├── dashboard/  # User dashboard
│   │   ├── draws/      # Draw results
│   │   └── subscribe/  # Subscription flow
│   ├── (auth)/
│   │   └── login/      # Auth page (login + register)
│   └── api/            # API routes
│       ├── admin/      # Admin endpoints
│       ├── auth/       # Auth endpoints
│       ├── draws/      # Draw engine
│       ├── scores/     # Score entry
│       ├── stripe/     # Stripe webhooks + checkout
│       └── user/       # User endpoints
├── components/         # Shared UI components
├── lib/
│   ├── auth.ts         # JWT helpers
│   └── mongodb.ts      # DB connection
├── models/             # Mongoose models
└── middleware.ts       # Route protection
```

---

## Deployment

The project is deployed on **Vercel** with automatic deployments on every push to `main`.

Make sure all environment variables are set in your Vercel project settings before deploying.

---

## Admin Access

To make a user an admin, set their `role` field to `"admin"` in MongoDB Atlas, then log out and back in to get a fresh token.

---

## License

MIT
