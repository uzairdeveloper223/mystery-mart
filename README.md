# Mystery Mart

Mystery Mart is a modern web marketplace for buying, selling, and trading mystery boxes filled with surprises. The platform connects collectors, sellers, and enthusiasts, providing a safe and engaging community experience.

## Features

- **User Accounts & Authentication**
  - Secure registration, login, password reset, and account recovery
  - Profile management with avatars, bio, social links, and preferences

- **Mystery Boxes Marketplace**
  - Browse, search, and filter mystery boxes by category, price, rarity, and more
  - Detailed box pages with images, seller info, comments, and wishlist support
  - Verified sellers and moderation for safe transactions

- **Buying & Selling**
  - Add boxes to cart and checkout with multiple payment methods (card, PayPal, crypto)
  - Seller dashboard for managing boxes, orders, stats, and revenue
  - Refunds and dispute resolution policies

- **Community & Social**
  - Messaging system for buyer-seller communication
  - Follow sellers, leave reviews, and participate in discussions
  - Community guidelines and reporting system

- **Admin Panel**
  - Manage users, boxes, reports, verifications, and platform settings
  - Maintenance mode, notifications, and analytics

- **Platform Policies**
  - Terms of Service, Privacy Policy, Cookie Policy, Refund Policy, and Community Guidelines pages

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Firebase (Auth, Realtime Database)
- **UI:** Custom components, Lucide icons

## Getting Started

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Run the development server:**
   ```sh
   pnpm dev
   ```
3. **Build for production:**
   ```sh
   pnpm build
   ```

## Project Structure

- `app/` — Next.js app pages (auth, boxes, cart, checkout, dashboard, admin, etc.)
- `components/` — UI and layout components
- `hooks/` — Custom React hooks (cart, wishlist, notifications, etc.)
- `lib/` — Firebase config and service logic
- `public/` — Static assets
- `styles/` — Global styles

## Policies & Support

- [Terms of Service](app/terms/page.tsx)
- [Privacy Policy](app/privacy/page.tsx)
- [Cookie Policy](app/cookies/page.tsx)
- [Refund Policy](app/refunds/page.tsx)
- [Community Guidelines](app/community-guidelines/page.tsx)
- Contact: uzairxdev223@gmail.com

---

**Mystery Mart** — Discover, buy, and sell amazing mystery boxes