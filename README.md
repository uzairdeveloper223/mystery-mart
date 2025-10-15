# Mystery Mart 🎁

A modern, secure marketplace for buying, selling, and trading mystery boxes filled with exciting surprises. Connect with collectors, discover unique treasures, and build a thriving community around the art of surprise.
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/uzairdeveloper223/mystery-mart)

## ✨ Key Features

### 🔐 **Authentication & Profiles**
- Secure user registration with email verification
- Advanced password reset and account recovery
- Customizable profiles with photo uploads and custom avatar editor
- Social links integration and personal bio sections
- Real-time online/offline status indicators

### 📦 **Mystery Boxes Marketplace**
- Advanced search and filtering (category, price, rarity, condition)
- High-quality box galleries with detailed descriptions
- Seller verification system and trust ratings
- Wishlist functionality and favorites management
- Community-driven reviews and comments

### 💰 **E-commerce & Transactions**
- Secure multi-payment checkout (Cards, PayPal, Cryptocurrency)
- Real-time cart management with quantity controls
- Comprehensive seller dashboard with analytics
- Order tracking and delivery management
- Automated refund processing and dispute resolution

### 💬 **Real-time Communication**
- Instant messaging between buyers and sellers
- Message read receipts and typing indicators
- Unread message notifications in navbar
- Conversation history and attachment support

### 🎨 **User Experience**
- Responsive design optimized for all devices
- Dark/light theme support with system preference detection
- Smooth animations and micro-interactions
- Advanced form validation and error handling
- Real-time notifications and toast messages

### 🛡️ **Security & Moderation**
- Comprehensive admin panel with user management
- Content moderation and reporting system
- Fraud detection and prevention measures
- Community guidelines enforcement
- Privacy-focused data handling

### 🌐 **Platform Management**
- Dynamic ETH donation address system
- Username change request workflow
- Seller verification and badge system
- Maintenance mode and system announcements
- Analytics and performance monitoring

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (App Router) with React 18
- **Language:** TypeScript for type safety
- **Styling:** Tailwind CSS with custom components
- **Animations:** Framer Motion for smooth transitions
- **Icons:** Lucide React icon library

### **Backend & Database**
- **Authentication:** Firebase Auth with email/password
- **Database:** Firebase Realtime Database
- **File Storage:** ImgBB API for image hosting
- **Real-time Features:** Firebase listeners for live updates

### **Development Tools**
- **Package Manager:** pnpm for fast, efficient installs
- **Linting:** ESLint with TypeScript configuration
- **Formatting:** Prettier for consistent code style
- **Build Tool:** Next.js built-in bundler with optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Firebase project configured

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/uzairdeveloper223/mystery-mart.git
   cd mystery-mart
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Configure your Firebase credentials
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📁 Project Architecture

```
mystery-mart/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── boxes/             # Mystery box listings
│   ├── dashboard/         # User dashboard
│   ├── messages/          # Real-time messaging
│   ├── settings/          # User preferences
│   └── admin/             # Admin panel
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
│   ├── use-auth.ts       # Authentication state
│   ├── use-cart.ts       # Shopping cart logic
│   └── use-messages.ts   # Real-time messaging
├── lib/                  # Core utilities
│   ├── firebase-service.ts  # Firebase operations
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔧 Recent Updates

### Latest Features (v2.0)
- ✅ **Real-time messaging** with read receipts and typing indicators
- ✅ **Unread message notifications** in navbar with live count
- ✅ **Online/offline status** indicators for users
- ✅ **Custom avatar editor** with color and style customization
- ✅ **ETH donation address** validation and management
- ✅ **Username change requests** with admin approval workflow
- ✅ **Enhanced profile settings** with comprehensive customization

### Technical Improvements
- ✅ **Firebase presence system** for real-time user status
- ✅ **Optimized database queries** with proper indexing
- ✅ **SVG avatar generation** with direct Firebase storage
- ✅ **Message state management** with custom hooks
- ✅ **Database rules optimization** for security and performance

## 📋 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Legal & Policies

- [Terms of Service](app/terms/page.tsx) - Platform usage terms
- [Privacy Policy](app/privacy/page.tsx) - Data protection policy
- [Cookie Policy](app/cookies/page.tsx) - Cookie usage information
- [Refund Policy](app/refunds/page.tsx) - Return and refund guidelines
- [Community Guidelines](app/community-guidelines/page.tsx) - Community standards

## 📞 Support & Contact

- **Developer:** uzairxdev223@gmail.com
- **Repository:** [GitHub](https://github.com/uzairdeveloper223/mystery-mart)
- **Issues:** Report bugs and feature requests on GitHub
- **License:** MIT License

---

<div align="center">
  <h3>🎁 Mystery Mart</h3>
  <p><em>Discover, buy, and sell amazing mystery boxes</em></p>
  <p>Built with ❤️ using Next.js, TypeScript, and Firebase</p>
</div>
