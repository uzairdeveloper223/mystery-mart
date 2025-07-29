import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  off,
} from "firebase/database"
import { db } from "@/lib/firebase"
import { DB_PATHS } from "@/lib/firebase-config"
import type {
  UserProfile,
  MysteryBox,
  Order,
  Address,
  Message,
  Notification,
  Report,
  Comment,
  Category,
  VerificationRequest,
  SellerApplication,
  AdminMessage,
  PlatformSettings,
} from "@/lib/types"

export class FirebaseService {
  // Input sanitization utility
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>?/gm, "")
      .trim()
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return this.sanitizeInput(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item))
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {}
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key])
      }
      return sanitized
    }
    return obj
  }

  // Platform settings
  static async getPlatformSettings(): Promise<PlatformSettings> {
    const settingsRef = ref(db, DB_PATHS.PLATFORM_SETTINGS)
    const snapshot = await get(settingsRef)

    if (!snapshot.exists()) {
      // Initialize default settings
      const defaultSettings: PlatformSettings = {
        maintenanceMode: false,
        maintenanceMessage: "We're currently performing maintenance. Please check back soon!",
        allowRegistration: true,
        allowBoxCreation: true,
        allowPurchases: true,
        maxBoxPrice: 10000,
        minBoxPrice: 1,
        platformFeePercentage: 5,
        featuredBoxLimit: 12,
        maxImagesPerBox: 10,
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp"],
        maxFileSize: 5242880, // 5MB
        autoApproveBoxes: false,
        requireSellerVerification: true,
        enableDonations: true,
        enableChat: true,
        enableReviews: true,
        enableWishlist: true,
        maxDailyMessages: 100,
        maxDailyBoxCreations: 10,
        bannedWords: ["spam", "scam", "fake"],
        supportEmail: "support@mysterymart.com",
        lastUpdated: new Date().toISOString(),
      }

      await set(settingsRef, defaultSettings)
      return defaultSettings
    }

    return snapshot.val()
  }

  static async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
    const settingsRef = ref(db, DB_PATHS.PLATFORM_SETTINGS)
    await update(settingsRef, {
      ...settings,
      lastUpdated: new Date().toISOString(),
    })
  }

  static async setMaintenanceMode(enabled: boolean, message?: string): Promise<void> {
    await this.updatePlatformSettings({
      maintenanceMode: enabled,
      maintenanceMessage: message || "We're currently performing maintenance. Please check back soon!",
    })
  }

  // User management
  static async createUser(uid: string, userData: Partial<UserProfile>): Promise<void> {
    const sanitizedData = this.sanitizeObject(userData)
    const userRef = ref(db, `${DB_PATHS.USERS}/${uid}`)
    await set(userRef, {
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      isApprovedSeller: false,
      canSell: false,
    })
  }

  static async getUser(uid: string): Promise<UserProfile | null> {
    const userRef = ref(db, `${DB_PATHS.USERS}/${uid}`)
    const snapshot = await get(userRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  static async getAllUsers(limit?: number): Promise<UserProfile[]> {
    let usersQuery = query(ref(db, DB_PATHS.USERS))

    if (limit) {
      usersQuery = query(ref(db, DB_PATHS.USERS), limitToLast(limit))
    }

    const snapshot = await get(usersQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as UserProfile[]
  }

  static async banUser(userId: string, reason: string, duration?: number): Promise<void> {
    const banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null

    await this.updateUser(userId, {
      isBanned: true,
      banReason: this.sanitizeInput(reason),
      banExpiresAt,
      canSell: false,
    })

    // Create notification
    await this.createNotification({
      userId,
      type: "system",
      title: "Account Suspended",
      message: `Your account has been suspended. Reason: ${reason}${duration ? ` Duration: ${duration} days` : " (Permanent)"}`,
    })
  }

  static async unbanUser(userId: string): Promise<void> {
    const user = await this.getUser(userId)
    if (!user) return

    await this.updateUser(userId, {
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      canSell: user.isApprovedSeller,
    })

    await this.createNotification({
      userId,
      type: "system",
      title: "Account Restored",
      message: "Your account has been restored and is now active.",
    })
  }

  static async getUserByUsername(username: string): Promise<UserProfile | null> {
    const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${username}`)
    const snapshot = await get(usernameRef)

    if (!snapshot.exists()) return null

    const uid = snapshot.val()
    return this.getUser(uid)
  }

  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    const usersRef = ref(db, DB_PATHS.USERS)
    const usersQuery = query(usersRef, orderByChild("email"), equalTo(email))
    const snapshot = await get(usersQuery)

    if (!snapshot.exists()) return null

    const users = Object.values(snapshot.val()) as UserProfile[]
    return users[0] || null
  }

  static async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const sanitizedUpdates = this.sanitizeObject(updates)
    const userRef = ref(db, `${DB_PATHS.USERS}/${uid}`)
    await update(userRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  static async checkUsernameAvailability(username: string): Promise<boolean> {
    const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${username}`)
    const snapshot = await get(usernameRef)
    return !snapshot.exists()
  }

  static async reserveUsername(username: string, uid: string): Promise<void> {
    const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${username}`)
    await set(usernameRef, uid)
  }

  // Box moderation
  static async getAllBoxes(status?: string): Promise<MysteryBox[]> {
    let boxesQuery = query(ref(db, DB_PATHS.BOXES))

    if (status) {
      boxesQuery = query(ref(db, DB_PATHS.BOXES), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(boxesQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as MysteryBox[]
  }

  static async moderateBox(boxId: string, action: "approve" | "reject" | "remove", reason?: string): Promise<void> {
    const box = await this.getBox(boxId)
    if (!box) return

    let newStatus: MysteryBox["status"]
    let notificationTitle: string
    let notificationMessage: string

    switch (action) {
      case "approve":
        newStatus = "active"
        notificationTitle = "Box Approved"
        notificationMessage = `Your mystery box "${box.title}" has been approved and is now live.`
        break
      case "reject":
        newStatus = "pending"
        notificationTitle = "Box Rejected"
        notificationMessage = `Your mystery box "${box.title}" was rejected. ${reason ? `Reason: ${reason}` : ""}`
        break
      case "remove":
        newStatus = "removed"
        notificationTitle = "Box Removed"
        notificationMessage = `Your mystery box "${box.title}" has been removed from the platform. ${reason ? `Reason: ${reason}` : ""}`
        break
    }

    await this.updateBox(boxId, { status: newStatus })

    // Notify seller
    await this.createNotification({
      userId: box.sellerId,
      type: "system",
      title: notificationTitle,
      message: notificationMessage,
    })
  }

  // Seller approval system
  static async submitSellerApplication(userId: string, applicationData: any): Promise<string> {
    const sanitizedData = this.sanitizeObject(applicationData)
    const requestsRef = ref(db, DB_PATHS.SELLER_REQUESTS)
    const newRequestRef = push(requestsRef)
    const requestId = newRequestRef.key!

    await set(newRequestRef, {
      id: requestId,
      userId,
      businessInfo: sanitizedData,
      status: "pending",
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      notes: "",
    })

    // Update user's seller application status
    await this.updateUser(userId, {
      sellerApplicationStatus: "pending",
    })

    return requestId
  }

  static async requestSellerApproval(userId: string, businessInfo: any): Promise<string> {
    const sanitizedBusinessInfo = this.sanitizeObject(businessInfo)
    const requestsRef = ref(db, DB_PATHS.SELLER_REQUESTS)
    const newRequestRef = push(requestsRef)
    const requestId = newRequestRef.key!

    await set(newRequestRef, {
      id: requestId,
      userId,
      businessInfo: sanitizedBusinessInfo,
      status: "pending",
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      notes: "",
    })

    return requestId
  }

  static async getSellerApplications(status?: string): Promise<SellerApplication[]> {
    let requestsQuery = query(ref(db, DB_PATHS.SELLER_REQUESTS))

    if (status) {
      requestsQuery = query(ref(db, DB_PATHS.SELLER_REQUESTS), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(requestsQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as SellerApplication[]
  }

  static async approveSellerApplication(requestId: string, adminId: string, notes?: string): Promise<void> {
    const requestRef = ref(db, `${DB_PATHS.SELLER_REQUESTS}/${requestId}`)
    const request = await get(requestRef)

    if (!request.exists()) throw new Error("Request not found")

    const requestData = request.val()

    // Update request status
    await update(requestRef, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      notes: this.sanitizeInput(notes || ""),
    })

    // Update user to allow selling
    await this.updateUser(requestData.userId, {
      isApprovedSeller: true,
      canSell: true,
      sellerApplicationStatus: "approved",
    })

    // Create notification
    await this.createNotification({
      userId: requestData.userId,
      type: "system",
      title: "Seller Application Approved",
      message: "Congratulations! You can now start selling mystery boxes.",
      actionUrl: "/sell",
    })
  }

  static async rejectSellerApplication(requestId: string, adminId: string, notes: string): Promise<void> {
    const requestRef = ref(db, `${DB_PATHS.SELLER_REQUESTS}/${requestId}`)
    const request = await get(requestRef)

    if (!request.exists()) throw new Error("Request not found")

    const requestData = request.val()

    await update(requestRef, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      notes: this.sanitizeInput(notes),
    })

    await this.updateUser(requestData.userId, {
      sellerApplicationStatus: "rejected",
    })

    // Create notification
    await this.createNotification({
      userId: requestData.userId,
      type: "system",
      title: "Seller Application Rejected",
      message: `Your seller application was rejected. Reason: ${notes}`,
    })
  }

  // Verification system
  static async requestVerification(userId: string, message: string): Promise<string> {
    const verificationsRef = ref(db, DB_PATHS.VERIFICATION_REQUESTS)
    const newVerificationRef = push(verificationsRef)
    const verificationId = newVerificationRef.key!

    await set(newVerificationRef, {
      id: verificationId,
      userId,
      message: this.sanitizeInput(message),
      status: "pending",
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: "",
    })

    return verificationId
  }

  static async getVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    let verificationsQuery = query(ref(db, DB_PATHS.VERIFICATION_REQUESTS))

    if (status) {
      verificationsQuery = query(ref(db, DB_PATHS.VERIFICATION_REQUESTS), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(verificationsQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as VerificationRequest[]
  }

  static async approveVerificationRequest(verificationId: string, adminId: string, notes?: string): Promise<void> {
    const verificationRef = ref(db, `${DB_PATHS.VERIFICATION_REQUESTS}/${verificationId}`)
    const verification = await get(verificationRef)

    if (!verification.exists()) throw new Error("Verification request not found")

    const verificationData = verification.val()

    // Update verification status
    await update(verificationRef, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      adminNotes: this.sanitizeInput(notes || ""),
    })

    // Update user verification status
    await this.updateUser(verificationData.userId, {
      isVerified: true,
      verificationStatus: "approved",
    })

    // Create notification
    await this.createNotification({
      userId: verificationData.userId,
      type: "system",
      title: "Verification Approved",
      message: "Congratulations! You now have a verified badge.",
    })
  }

  static async rejectVerificationRequest(verificationId: string, adminId: string, notes: string): Promise<void> {
    const verificationRef = ref(db, `${DB_PATHS.VERIFICATION_REQUESTS}/${verificationId}`)
    const verification = await get(verificationRef)

    if (!verification.exists()) throw new Error("Verification request not found")

    const verificationData = verification.val()

    await update(verificationRef, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      adminNotes: this.sanitizeInput(notes),
    })

    await this.updateUser(verificationData.userId, {
      verificationStatus: "rejected",
    })

    // Create notification
    await this.createNotification({
      userId: verificationData.userId,
      type: "system",
      title: "Verification Rejected",
      message: `Your verification request was rejected. Reason: ${notes}`,
    })
  }

  // Admin messaging system
  static async createAdminMessage(messageData: Omit<AdminMessage, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(messageData)
    const messagesRef = ref(db, DB_PATHS.ADMIN_MESSAGES)
    const newMessageRef = push(messagesRef)
    const messageId = newMessageRef.key!

    await set(newMessageRef, {
      ...sanitizedData,
      id: messageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    })

    return messageId
  }

  static async getAdminMessages(status?: string): Promise<AdminMessage[]> {
    let messagesQuery = query(ref(db, DB_PATHS.ADMIN_MESSAGES))

    if (status) {
      messagesQuery = query(ref(db, DB_PATHS.ADMIN_MESSAGES), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(messagesQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as AdminMessage[]
  }

  static async replyToAdminMessage(messageId: string, adminId: string, content: string): Promise<void> {
    const messageRef = ref(db, `${DB_PATHS.ADMIN_MESSAGES}/${messageId}`)
    const message = await get(messageRef)

    if (!message.exists()) throw new Error("Message not found")

    const messageData = message.val()
    const newResponse = {
      id: Date.now().toString(),
      senderId: adminId,
      senderType: "admin" as const,
      content: this.sanitizeInput(content),
      createdAt: new Date().toISOString(),
    }

    await update(messageRef, {
      responses: [...(messageData.responses || []), newResponse],
      status: "in_progress",
      updatedAt: new Date().toISOString(),
    })

    // Notify user
    await this.createNotification({
      userId: messageData.userId,
      type: "admin",
      title: "Admin Reply",
      message: "An admin has replied to your message.",
      actionUrl: "/messages/admin",
    })
  }

  // Database optimization
  static async optimizeDatabase(): Promise<{
    deletedExpiredCodes: number
    deletedOldNotifications: number
    deletedOldMessages: number
    compactedUsers: number
  }> {
    const results = {
      deletedExpiredCodes: 0,
      deletedOldNotifications: 0,
      deletedOldMessages: 0,
      compactedUsers: 0,
    }

    try {
      // Delete expired recovery codes
      const recoveryCodesRef = ref(db, DB_PATHS.RECOVERY_CODES)
      const recoverySnapshot = await get(recoveryCodesRef)

      if (recoverySnapshot.exists()) {
        const codes = recoverySnapshot.val()
        const now = new Date()

        for (const [key, code] of Object.entries(codes) as [string, any][]) {
          if (new Date(code.expiresAt) < now || code.used) {
            await remove(ref(db, `${DB_PATHS.RECOVERY_CODES}/${key}`))
            results.deletedExpiredCodes++
          }
        }
      }

      // Delete old notifications (older than 30 days)
      const notificationsRef = ref(db, DB_PATHS.NOTIFICATIONS)
      const notificationsSnapshot = await get(notificationsRef)

      if (notificationsSnapshot.exists()) {
        const notifications = notificationsSnapshot.val()
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        for (const [key, notification] of Object.entries(notifications) as [string, any][]) {
          if (new Date(notification.createdAt) < thirtyDaysAgo && notification.isRead) {
            await remove(ref(db, `${DB_PATHS.NOTIFICATIONS}/${key}`))
            results.deletedOldNotifications++
          }
        }
      }

      // Delete old messages (older than 90 days)
      const messagesRef = ref(db, DB_PATHS.MESSAGES)
      const messagesSnapshot = await get(messagesRef)

      if (messagesSnapshot.exists()) {
        const messages = messagesSnapshot.val()
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

        for (const [key, message] of Object.entries(messages) as [string, any][]) {
          if (new Date(message.createdAt) < ninetyDaysAgo) {
            await remove(ref(db, `${DB_PATHS.MESSAGES}/${key}`))
            results.deletedOldMessages++
          }
        }
      }

      // Compact user data (remove unused fields)
      const usersRef = ref(db, DB_PATHS.USERS)
      const usersSnapshot = await get(usersRef)

      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val()

        for (const [uid, user] of Object.entries(users) as [string, any][]) {
          const cleanedUser = { ...user }

          // Remove null or undefined fields
          Object.keys(cleanedUser).forEach((key) => {
            if (cleanedUser[key] === null || cleanedUser[key] === undefined) {
              delete cleanedUser[key]
            }
          })

          if (JSON.stringify(cleanedUser) !== JSON.stringify(user)) {
            await set(ref(db, `${DB_PATHS.USERS}/${uid}`), cleanedUser)
            results.compactedUsers++
          }
        }
      }
    } catch (error) {
      console.error("Database optimization error:", error)
    }

    return results
  }

  // Follow system
  static async followUser(followerId: string, followedId: string): Promise<void> {
    const followRef = ref(db, `${DB_PATHS.FOLLOWS}/${followerId}/${followedId}`)
    await set(followRef, {
      followedAt: new Date().toISOString(),
    })

    const followerRef = ref(db, `${DB_PATHS.FOLLOWERS}/${followedId}/${followerId}`)
    await set(followerRef, {
      followedAt: new Date().toISOString(),
    })
  }

  static async unfollowUser(followerId: string, followedId: string): Promise<void> {
    const followRef = ref(db, `${DB_PATHS.FOLLOWS}/${followerId}/${followedId}`)
    await remove(followRef)

    const followerRef = ref(db, `${DB_PATHS.FOLLOWERS}/${followedId}/${followerId}`)
    await remove(followerRef)
  }

  static async checkFollowStatus(followerId: string, followedId: string): Promise<boolean> {
    const followRef = ref(db, `${DB_PATHS.FOLLOWS}/${followerId}/${followedId}`)
    const snapshot = await get(followRef)
    return snapshot.exists()
  }

  static async getFollowersCount(userId: string): Promise<number> {
    const followersRef = ref(db, `${DB_PATHS.FOLLOWERS}/${userId}`)
    const snapshot = await get(followersRef)
    return snapshot.exists() ? Object.keys(snapshot.val()).length : 0
  }

  // Donation system
  static async createDonation(donationData: {
    donorId: string
    recipientId: string
    amount: number
    message: string
    type: string
  }): Promise<string> {
    const sanitizedData = this.sanitizeObject(donationData)
    const donationsRef = ref(db, DB_PATHS.DONATIONS)
    const newDonationRef = push(donationsRef)
    const donationId = newDonationRef.key!

    await set(newDonationRef, {
      ...sanitizedData,
      id: donationId,
      createdAt: new Date().toISOString(),
      status: "completed",
    })

    return donationId
  }

  static async getUserDonations(userId: string, type: "sent" | "received"): Promise<any[]> {
    const field = type === "sent" ? "donorId" : "recipientId"
    const donationsQuery = query(ref(db, DB_PATHS.DONATIONS), orderByChild(field), equalTo(userId))
    const snapshot = await get(donationsQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val())
  }

  // Mystery Box operations
  static async createBox(boxData: Omit<MysteryBox, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(boxData)
    const boxesRef = ref(db, DB_PATHS.BOXES)
    const newBoxRef = push(boxesRef)
    const boxId = newBoxRef.key!

    await set(newBoxRef, {
      ...sanitizedData,
      id: boxId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      status: "pending", // All boxes start as pending for moderation
    })

    return boxId
  }

  static async getBox(boxId: string): Promise<MysteryBox | null> {
    const boxRef = ref(db, `${DB_PATHS.BOXES}/${boxId}`)
    const snapshot = await get(boxRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  static async getBoxes(filters?: {
    category?: string
    sellerId?: string
    status?: string
    limit?: number
  }): Promise<MysteryBox[]> {
    let boxesQuery = query(ref(db, DB_PATHS.BOXES))

    if (filters?.category) {
      boxesQuery = query(ref(db, DB_PATHS.BOXES), orderByChild("category"), equalTo(filters.category))
    }

    if (filters?.sellerId) {
      boxesQuery = query(ref(db, DB_PATHS.BOXES), orderByChild("sellerId"), equalTo(filters.sellerId))
    }

    if (filters?.status) {
      boxesQuery = query(ref(db, DB_PATHS.BOXES), orderByChild("status"), equalTo(filters.status))
    }

    if (filters?.limit) {
      boxesQuery = query(boxesQuery, limitToLast(filters.limit))
    }

    const snapshot = await get(boxesQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as MysteryBox[]
  }

  static async updateBox(boxId: string, updates: Partial<MysteryBox>): Promise<void> {
    const sanitizedUpdates = this.sanitizeObject(updates)
    const boxRef = ref(db, `${DB_PATHS.BOXES}/${boxId}`)
    await update(boxRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  static async incrementBoxViews(boxId: string): Promise<void> {
    const box = await this.getBox(boxId)
    if (box) {
      await this.updateBox(boxId, { views: (box.views || 0) + 1 })
    }
  }

  // Order operations
  static async createOrder(orderData: Omit<Order, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(orderData)
    const ordersRef = ref(db, DB_PATHS.ORDERS)
    const newOrderRef = push(ordersRef)
    const orderId = newOrderRef.key!

    await set(newOrderRef, {
      ...sanitizedData,
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return orderId
  }

  static async getOrder(orderId: string): Promise<Order | null> {
    const orderRef = ref(db, `${DB_PATHS.ORDERS}/${orderId}`)
    const snapshot = await get(orderRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  static async getUserOrders(userId: string, type: "buyer" | "seller" = "buyer"): Promise<Order[]> {
    const field = type === "buyer" ? "buyerId" : "sellerId"
    const ordersQuery = query(ref(db, DB_PATHS.ORDERS), orderByChild(field), equalTo(userId))
    const snapshot = await get(ordersQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Order[]
  }

  static async updateOrderStatus(orderId: string, status: Order["status"], additionalData?: any): Promise<void> {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData,
    }

    if (status === "delivered") {
      updates.deliveredAt = new Date().toISOString()
    }

    const orderRef = ref(db, `${DB_PATHS.ORDERS}/${orderId}`)
    await update(orderRef, updates)
  }

  // Address operations
  static async createAddress(addressData: Omit<Address, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(addressData)
    const addressesRef = ref(db, DB_PATHS.ADDRESSES)
    const newAddressRef = push(addressesRef)
    const addressId = newAddressRef.key!

    await set(newAddressRef, {
      ...sanitizedData,
      id: addressId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return addressId
  }

  static async getUserAddresses(userId: string): Promise<Address[]> {
    const addressesQuery = query(ref(db, DB_PATHS.ADDRESSES), orderByChild("userId"), equalTo(userId))
    const snapshot = await get(addressesQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Address[]
  }

  static async updateAddress(addressId: string, updates: Partial<Address>): Promise<void> {
    const sanitizedUpdates = this.sanitizeObject(updates)
    const addressRef = ref(db, `${DB_PATHS.ADDRESSES}/${addressId}`)
    await update(addressRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  static async deleteAddress(addressId: string): Promise<void> {
    const addressRef = ref(db, `${DB_PATHS.ADDRESSES}/${addressId}`)
    await remove(addressRef)
  }

  // Message operations
  static async sendMessage(messageData: Omit<Message, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(messageData)
    const messagesRef = ref(db, DB_PATHS.MESSAGES)
    const newMessageRef = push(messagesRef)
    const messageId = newMessageRef.key!

    await set(newMessageRef, {
      ...sanitizedData,
      id: messageId,
      createdAt: new Date().toISOString(),
      status: "sent",
    })

    return messageId
  }

  static async getConversation(conversationId: string, limit = 50): Promise<Message[]> {
    const messagesQuery = query(
      ref(db, DB_PATHS.MESSAGES),
      orderByChild("conversationId"),
      equalTo(conversationId),
      limitToLast(limit),
    )
    const snapshot = await get(messagesQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Message[]
  }

  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const messageRef = ref(db, `${DB_PATHS.MESSAGES}/${messageId}`)
    const messageSnapshot = await get(messageRef)
    if (messageSnapshot.exists()) {
      const message = messageSnapshot.val()
      const readBy = message.readBy || []
      if (!readBy.includes(userId)) {
        readBy.push(userId)
        await update(messageRef, { readBy, status: "read" })
      }
    }
  }

  static subscribeToUserConversations(userId: string, callback: (conversations: any[]) => void): () => void {
    const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
    const conversationsQuery = query(conversationsRef, orderByChild(`participants/${userId}`), equalTo(true))
    
    const unsubscribe = onValue(conversationsQuery, (snapshot) => {
      const conversations = snapshot.exists() ? Object.values(snapshot.val()) : []
      callback(conversations)
    })
    
    return unsubscribe
  }

  static subscribeToConversationMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = ref(db, DB_PATHS.MESSAGES)
    const messagesQuery = query(messagesRef, orderByChild("conversationId"), equalTo(conversationId))
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages = snapshot.exists() ? Object.values(snapshot.val()) as Message[] : []
      callback(messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    })
    
    return unsubscribe
  }

  static subscribeToOnlineUsers(callback: (userIds: string[]) => void): () => void {
    const onlineUsersRef = ref(db, "onlineUsers")
    
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const onlineUsers = snapshot.exists() ? Object.keys(snapshot.val()) : []
      callback(onlineUsers)
    })
    
    return unsubscribe
  }

  static subscribeToTypingIndicators(conversationId: string, callback: (typingUserIds: string[]) => void): () => void {
    const typingRef = ref(db, `typing/${conversationId}`)
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.exists() ? snapshot.val() : {}
      const typingUserIds = Object.keys(typingData).filter(userId => typingData[userId] === true)
      callback(typingUserIds)
    })
    
    return unsubscribe
  }

  static async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(db, `typing/${conversationId}/${userId}`)
    if (isTyping) {
      await set(typingRef, true)
      // Auto-remove typing status after 3 seconds
      setTimeout(() => {
        set(typingRef, false)
      }, 3000)
    } else {
      await set(typingRef, false)
    }
  }

  static async createConversation(participant1Id: string, participant2Id: string): Promise<string> {
    const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
    const newConversationRef = push(conversationsRef)
    const conversationId = newConversationRef.key!

    const conversationData = {
      id: conversationId,
      participants: {
        [participant1Id]: true,
        [participant2Id]: true,
      },
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessage: null,
    }

    await set(newConversationRef, conversationData)
    return conversationId
  }

  static async sendMessageToAdmin(userId: string, subject: string, content: string, priority: "low" | "medium" | "high" | "urgent" = "medium"): Promise<string> {
    // Find admin user
    const adminUser = await this.getUserByEmail("uzairxdev223@gmail.com")
    if (!adminUser) {
      throw new Error("Admin user not found")
    }

    // Check if conversation already exists between user and admin
    const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
    const conversationsSnapshot = await get(conversationsRef)
    
    let conversationId = null
    
    if (conversationsSnapshot.exists()) {
      const conversations = Object.values(conversationsSnapshot.val()) as any[]
      const existingConversation = conversations.find(conv => 
        conv.participants && 
        conv.participants[userId] && 
        conv.participants[adminUser.uid]
      )
      
      if (existingConversation) {
        conversationId = existingConversation.id
      }
    }

    // Create new conversation if it doesn't exist
    if (!conversationId) {
      conversationId = await this.createConversation(userId, adminUser.uid)
    }

    // Send message with subject in content
    const messageContent = subject ? `Subject: ${subject}\n\n${content}` : content
    
    const messageId = await this.sendMessage({
      conversationId,
      senderId: userId,
      content: messageContent,
      type: "text",
    })

    return messageId
  }

  // Notification operations
  static async createNotification(notificationData: Omit<Notification, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(notificationData)
    const notificationsRef = ref(db, DB_PATHS.NOTIFICATIONS)
    const newNotificationRef = push(notificationsRef)
    const notificationId = newNotificationRef.key!

    await set(newNotificationRef, {
      ...sanitizedData,
      id: notificationId,
      createdAt: new Date().toISOString(),
      isRead: false,
    })

    return notificationId
  }

  static async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const notificationsQuery = query(
      ref(db, DB_PATHS.NOTIFICATIONS),
      orderByChild("userId"),
      equalTo(userId),
      limitToLast(limit),
    )
    const snapshot = await get(notificationsQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Notification[]
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = ref(db, `${DB_PATHS.NOTIFICATIONS}/${notificationId}`)
    await update(notificationRef, { isRead: true })
  }

  // Report operations
  static async createReport(reportData: Omit<Report, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(reportData)
    const reportsRef = ref(db, DB_PATHS.REPORTS)
    const newReportRef = push(reportsRef)
    const reportId = newReportRef.key!

    await set(newReportRef, {
      ...sanitizedData,
      id: reportId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
    })

    return reportId
  }

  static async getReports(status?: string): Promise<Report[]> {
    let reportsQuery = query(ref(db, DB_PATHS.REPORTS))

    if (status) {
      reportsQuery = query(ref(db, DB_PATHS.REPORTS), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(reportsQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val()) as Report[]
  }

  static async updateReport(reportId: string, updates: Partial<Report>): Promise<void> {
    const sanitizedUpdates = this.sanitizeObject(updates)
    const reportRef = ref(db, `${DB_PATHS.REPORTS}/${reportId}`)
    await update(reportRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  // Comment operations
  static async createComment(commentData: Omit<Comment, "id">): Promise<string> {
    const sanitizedData = this.sanitizeObject(commentData)
    const commentsRef = ref(db, DB_PATHS.COMMENTS)
    const newCommentRef = push(commentsRef)
    const commentId = newCommentRef.key!

    await set(newCommentRef, {
      ...sanitizedData,
      id: commentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      isPinned: false,
      isReported: false,
    })

    return commentId
  }

  static async getBoxComments(boxId: string): Promise<Comment[]> {
    const commentsQuery = query(ref(db, DB_PATHS.COMMENTS), orderByChild("boxId"), equalTo(boxId))
    const snapshot = await get(commentsQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val()) as Comment[]
  }

  static async updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
    const sanitizedUpdates = this.sanitizeObject(updates)
    const commentRef = ref(db, `${DB_PATHS.COMMENTS}/${commentId}`)
    await update(commentRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  // Category operations
  static async getCategories(): Promise<Category[]> {
    const categoriesRef = ref(db, DB_PATHS.CATEGORIES)
    const snapshot = await get(categoriesRef)

    if (!snapshot.exists()) {
      // Initialize default categories if they don't exist
      await this.initializeDefaultCategories()
      return this.getCategories()
    }

    return Object.values(snapshot.val()) as Category[]
  }

  static async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: "Electronics",
        description: "Tech gadgets and electronic devices",
        icon: "Smartphone",
        color: "bg-blue-500",
      },
      { name: "Fashion", description: "Clothing, accessories, and style items", icon: "Shirt", color: "bg-pink-500" },
      { name: "Home & Garden", description: "Home decor and gardening supplies", icon: "Home", color: "bg-green-500" },
      { name: "Collectibles", description: "Rare and collectible items", icon: "Trophy", color: "bg-yellow-500" },
      {
        name: "Books & Media",
        description: "Books, movies, and media content",
        icon: "BookOpen",
        color: "bg-purple-500",
      },
      { name: "Sports", description: "Sports equipment and gear", icon: "Dumbbell", color: "bg-red-500" },
      { name: "Beauty", description: "Beauty and personal care products", icon: "Sparkles", color: "bg-indigo-500" },
      { name: "Toys & Games", description: "Toys, games, and entertainment", icon: "Gamepad2", color: "bg-orange-500" },
      { name: "Other", description: "Miscellaneous items", icon: "MoreHorizontal", color: "bg-gray-500" },
    ]

    const categoriesRef = ref(db, DB_PATHS.CATEGORIES)
    const categoriesData: Record<string, Category> = {}

    defaultCategories.forEach((category, index) => {
      const id = `category_${index + 1}`
      categoriesData[id] = {
        id,
        ...category,
        boxCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    })

    await set(categoriesRef, categoriesData)
  }

  // Real-time listeners
  static subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationsQuery = query(ref(db, DB_PATHS.NOTIFICATIONS), orderByChild("userId"), equalTo(userId))

    const unsubscribe = onValue(notificationsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = Object.values(snapshot.val()) as Notification[]
        callback(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      } else {
        callback([])
      }
    })

    return () => off(notificationsQuery, "value", unsubscribe)
  }

  static subscribeToConversation(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const messagesQuery = query(ref(db, DB_PATHS.MESSAGES), orderByChild("conversationId"), equalTo(conversationId))

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()) as Message[]
        callback(messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      } else {
        callback([])
      }
    })

    return () => off(messagesQuery, "value", unsubscribe)
  }

  // Analytics and stats
  static async getPlatformStats(): Promise<{
    totalUsers: number
    totalBoxes: number
    totalOrders: number
    totalRevenue: number
    activeReports: number
    pendingVerifications: number
    pendingSellerRequests: number
    totalDonations: number
    bannedUsers: number
    activeBoxes: number
    pendingBoxes: number
  }> {
    const [users, boxes, orders, reports, verifications, sellerRequests, donations] = await Promise.all([
      get(ref(db, DB_PATHS.USERS)),
      get(ref(db, DB_PATHS.BOXES)),
      get(ref(db, DB_PATHS.ORDERS)),
      get(ref(db, DB_PATHS.REPORTS)),
      get(ref(db, DB_PATHS.VERIFICATION_REQUESTS)),
      get(ref(db, DB_PATHS.SELLER_REQUESTS)),
      get(ref(db, DB_PATHS.DONATIONS)),
    ])

    const usersData = users.exists() ? (Object.values(users.val()) as UserProfile[]) : []
    const boxesData = boxes.exists() ? (Object.values(boxes.val()) as MysteryBox[]) : []
    const ordersData = orders.exists() ? (Object.values(orders.val()) as Order[]) : []
    const reportsData = reports.exists() ? (Object.values(reports.val()) as Report[]) : []
    const verificationsData = verifications.exists()
      ? (Object.values(verifications.val()) as VerificationRequest[])
      : []
    const sellerRequestsData = sellerRequests.exists() ? Object.values(sellerRequests.val()) : []
    const donationsData = donations.exists() ? Object.values(donations.val()) : []

    const totalRevenue = ordersData
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + order.paymentDetails.amount, 0)

    const totalDonations = donationsData.reduce((sum: number, donation: any) => sum + donation.amount, 0)

    return {
      totalUsers: usersData.length,
      totalBoxes: boxesData.length,
      totalOrders: ordersData.length,
      totalRevenue,
      activeReports: reportsData.filter((report) => report.status === "pending").length,
      pendingVerifications: verificationsData.filter((verification) => verification.status === "pending").length,
      pendingSellerRequests: sellerRequestsData.filter((request: any) => request.status === "pending").length,
      totalDonations,
      bannedUsers: usersData.filter((user) => user.isBanned).length,
      activeBoxes: boxesData.filter((box) => box.status === "active").length,
      pendingBoxes: boxesData.filter((box) => box.status === "pending").length,
    }
  }
}
