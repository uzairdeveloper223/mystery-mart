export interface UserProfile {
  uid: string
  email: string
  username: string
  fullName: string
  profilePicture?: string
  isVerified: boolean
  isEmailVerified: boolean
  isApprovedSeller: boolean
  canSell: boolean
  isBanned: boolean
  banReason?: string
  banExpiresAt?: string
  sellerApplicationStatus: "none" | "pending" | "approved" | "rejected"
  verificationStatus: "none" | "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  rating: number
  totalSales: number
  totalPurchases: number
  bio?: string
  location?: string
  socialLinks?: {
    website?: string
    twitter?: string
    instagram?: string
  }
  preferences: {
    emailNotifications: boolean
    pushNotifications: boolean
    marketingEmails: boolean
    theme: "light" | "dark" | "system"
  }
  stats: {
    totalRevenue: number
    averageRating: number
    responseTime: number
    fulfillmentRate: number
    returnRate: number
  }
}

export interface MysteryBox {
  id: string
  title: string
  description: string
  price: number
  estimatedValue: {
    min: number
    max: number
  }
  category: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  images: string[]
  sellerId: string
  seller: {
    username: string
    fullName: string
    isVerified: boolean
    rating: number
    profilePicture?: string
  }
  tags: string[]
  status: "active" | "sold" | "pending" | "removed" | "rejected"
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  isRevealed: boolean
  revealedContent?: {
    items: Array<{
      name: string
      description: string
      estimatedValue: number
      image?: string
    }>
    totalValue: number
  }
  shipping: {
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    freeShipping: boolean
    shippingCost: number
    processingTime: string
    shippingMethods: string[]
  }
  auction?: {
    isAuction: boolean
    startingBid: number
    currentBid: number
    endTime: string
    bidders: number
  }
  bundle?: {
    isBundle: boolean
    items: string[]
    discount: number
  }
}

export interface Order {
  id: string
  boxId: string
  buyerId: string
  sellerId: string
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "disputed"
  paymentMethod: "card" | "paypal" | "crypto"
  paymentDetails: {
    amount: number
    currency: string
    transactionId: string
    cryptoDetails?: {
      cryptocurrency: string
      walletAddress: string
      transactionHash: string
    }
  }
  shippingAddress: Address
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  isRevealed: boolean
  rating?: {
    stars: number
    comment: string
    createdAt: string
  }
}

export interface Address {
  id: string
  userId: string
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phoneNumber: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  participants: { [userId: string]: boolean }
  createdAt: string
  lastMessageAt: string
  lastMessage?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  type: "text" | "image" | "file" | "system"
  status: "sent" | "delivered" | "read"
  createdAt: string
  readBy?: string[]
  attachments?: Array<{
    type: string
    url: string
    name: string
    size: number
  }>
  replyTo?: string
}

export interface AdminMessage {
  id: string
  userId: string
  adminId?: string
  type: "seller_application" | "verification_request" | "general_inquiry" | "support_request"
  subject: string
  content: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  updatedAt: string
  responses: Array<{
    id: string
    senderId: string
    senderType: "user" | "admin"
    content: string
    createdAt: string
  }>
  metadata?: {
    sellerApplicationId?: string
    verificationRequestId?: string
  }
}

export interface SellerApplication {
  id: string
  userId: string
  businessInfo: {
    businessName?: string
    businessType: "individual" | "business"
    description: string
    experience: string
    categories: string[]
    expectedVolume: string
  }
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
  adminMessageId?: string
}

export interface VerificationRequest {
  id: string
  userId: string
  message: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
  adminMessageId?: string
}

export interface PlatformSettings {
  maintenanceMode: boolean
  maintenanceMessage: string
  allowRegistration: boolean
  allowBoxCreation: boolean
  allowPurchases: boolean
  maxBoxPrice: number
  minBoxPrice: number
  platformFeePercentage: number
  featuredBoxLimit: number
  maxImagesPerBox: number
  allowedFileTypes: string[]
  maxFileSize: number
  autoApproveBoxes: boolean
  requireSellerVerification: boolean
  enableDonations: boolean
  enableChat: boolean
  enableReviews: boolean
  enableWishlist: boolean
  maxDailyMessages: number
  maxDailyBoxCreations: number
  bannedWords: string[]
  supportEmail: string
  lastUpdated: string
}

export interface Notification {
  id: string
  userId: string
  type: "message" | "order" | "payment" | "verification" | "system" | "admin"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: any
  actionUrl?: string
}

export interface Report {
  id: string
  reporterId: string
  reportedId: string
  reportedType: "user" | "box" | "comment"
  category: "spam" | "fraud" | "inappropriate" | "harassment" | "other"
  description: string
  evidence?: string[]
  status: "pending" | "investigating" | "resolved" | "dismissed"
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export interface Comment {
  id: string
  boxId: string
  userId: string
  content: string
  parentId?: string
  likes: number
  dislikes: number
  isPinned: boolean
  isReported: boolean
  createdAt: string
  updatedAt: string
  replies?: Comment[]
  user: {
    username: string
    profilePicture?: string
    isVerified: boolean
  }
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  boxCount: number
  isActive: boolean
  createdAt: string
}

export interface Donation {
  id: string
  donorId: string
  recipientId: string
  amount: number
  message: string
  type: "seller_support" | "platform_support"
  status: "completed" | "pending" | "failed"
  createdAt: string
}
