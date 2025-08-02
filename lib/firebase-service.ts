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
        supportEmail: "uzairxdev223@gmail.com",
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
    
    // Convert username to lowercase if provided
    if (sanitizedData.username) {
      sanitizedData.username = sanitizedData.username.toLowerCase()
    }
    
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
    
    // Convert username to lowercase if provided
    if (sanitizedUpdates.username) {
      sanitizedUpdates.username = sanitizedUpdates.username.toLowerCase()
    }
    
    const userRef = ref(db, `${DB_PATHS.USERS}/${uid}`)
    await update(userRef, {
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    })
  }

  static async deleteUserData(uid: string): Promise<void> {
    try {
      // Get user data first to get username for cleanup
      const user = await this.getUser(uid)
      
      // Remove user from users collection
      const userRef = ref(db, `${DB_PATHS.USERS}/${uid}`)
      await remove(userRef)

      // Remove username reservation if exists
      if (user?.username) {
        const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${user.username}`)
        await remove(usernameRef)
      }

      // Remove user's boxes
      const userBoxesQuery = query(ref(db, DB_PATHS.BOXES), orderByChild("sellerId"), equalTo(uid))
      const boxesSnapshot = await get(userBoxesQuery)
      if (boxesSnapshot.exists()) {
        const boxes = boxesSnapshot.val()
        for (const boxId in boxes) {
          await remove(ref(db, `${DB_PATHS.BOXES}/${boxId}`))
        }
      }

      // Remove user's orders (as buyer)
      const userOrdersQuery = query(ref(db, DB_PATHS.ORDERS), orderByChild("buyerId"), equalTo(uid))
      const ordersSnapshot = await get(userOrdersQuery)
      if (ordersSnapshot.exists()) {
        const orders = ordersSnapshot.val()
        for (const orderId in orders) {
          await remove(ref(db, `${DB_PATHS.ORDERS}/${orderId}`))
        }
      }

      // Remove user's addresses
      const userAddressesQuery = query(ref(db, DB_PATHS.ADDRESSES), orderByChild("userId"), equalTo(uid))
      const addressesSnapshot = await get(userAddressesQuery)
      if (addressesSnapshot.exists()) {
        const addresses = addressesSnapshot.val()
        for (const addressId in addresses) {
          await remove(ref(db, `${DB_PATHS.ADDRESSES}/${addressId}`))
        }
      }

      // Remove user's messages and conversations
      const userMessagesQuery = query(ref(db, DB_PATHS.MESSAGES), orderByChild("senderId"), equalTo(uid))
      const messagesSnapshot = await get(userMessagesQuery)
      if (messagesSnapshot.exists()) {
        const messages = messagesSnapshot.val()
        for (const messageId in messages) {
          await remove(ref(db, `${DB_PATHS.MESSAGES}/${messageId}`))
        }
      }

      // Remove user's notifications
      const userNotificationsQuery = query(ref(db, DB_PATHS.NOTIFICATIONS), orderByChild("userId"), equalTo(uid))
      const notificationsSnapshot = await get(userNotificationsQuery)
      if (notificationsSnapshot.exists()) {
        const notifications = notificationsSnapshot.val()
        for (const notificationId in notifications) {
          await remove(ref(db, `${DB_PATHS.NOTIFICATIONS}/${notificationId}`))
        }
      }

      // Remove user's reports - get all reports and filter by reporterId
      const allReportsSnapshot = await get(ref(db, DB_PATHS.REPORTS))
      if (allReportsSnapshot.exists()) {
        const allReports = allReportsSnapshot.val()
        for (const [reportId, report] of Object.entries(allReports) as [string, any][]) {
          if (report.reporterId === uid) {
            await remove(ref(db, `${DB_PATHS.REPORTS}/${reportId}`))
          }
        }
      }

      // Remove user's verification requests
      const verificationQuery = query(ref(db, DB_PATHS.VERIFICATION_REQUESTS), orderByChild("userId"), equalTo(uid))
      const verificationSnapshot = await get(verificationQuery)
      if (verificationSnapshot.exists()) {
        const requests = verificationSnapshot.val()
        for (const requestId in requests) {
          await remove(ref(db, `${DB_PATHS.VERIFICATION_REQUESTS}/${requestId}`))
        }
      }

      // Remove from followers/following
      const followersRef = ref(db, `${DB_PATHS.FOLLOWERS}/${uid}`)
      const followingRef = ref(db, `${DB_PATHS.FOLLOWING}/${uid}`)
      await remove(followersRef)
      await remove(followingRef)

      // Remove user from other users' followers/following lists
      const allUsersSnapshot = await get(ref(db, DB_PATHS.USERS))
      if (allUsersSnapshot.exists()) {
        const allUsers = allUsersSnapshot.val()
        for (const userId in allUsers) {
          // Remove from their followers list
          const userFollowersRef = ref(db, `${DB_PATHS.FOLLOWERS}/${userId}/${uid}`)
          await remove(userFollowersRef)
          
          // Remove from their following list
          const userFollowingRef = ref(db, `${DB_PATHS.FOLLOWING}/${userId}/${uid}`)
          await remove(userFollowingRef)
        }
      }

    } catch (error) {
      console.error("Error deleting user data:", error)
      throw error
    }
  }

  static async checkUsernameAvailability(username: string): Promise<boolean> {
    const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${username}`)
    const snapshot = await get(usernameRef)
    return !snapshot.exists()
  }

  static async checkDonationAddressAvailability(address: string, excludeUserId?: string): Promise<boolean> {
    // Query all users to check if any user already has this donation address
    const usersRef = ref(db, DB_PATHS.USERS)
    const snapshot = await get(usersRef)
    
    if (!snapshot.exists()) return true
    
    const users = snapshot.val()
    for (const userId in users) {
      // Skip the current user if provided
      if (excludeUserId && userId === excludeUserId) {
        continue
      }
      
      const user = users[userId]
      if (user.ethAddress && user.ethAddress.toLowerCase() === address.toLowerCase()) {
        return false
      }
    }
    return true
  }

  static async reserveUsername(username: string, uid: string): Promise<void> {
    const usernameRef = ref(db, `${DB_PATHS.USERNAMES}/${username}`)
    await set(usernameRef, uid)
  }

  static async updateUsername(uid: string, oldUsername: string, newUsername: string): Promise<void> {
    // Convert username to lowercase
    const lowercaseUsername = newUsername.toLowerCase()
    
    // Check if new username is available
    const isAvailable = await this.checkUsernameAvailability(lowercaseUsername)
    if (!isAvailable) {
      throw new Error("Username is already taken")
    }

    // Remove old username from usernames collection
    if (oldUsername) {
      const oldUsernameRef = ref(db, `${DB_PATHS.USERNAMES}/${oldUsername}`)
      await remove(oldUsernameRef)
    }

    // Reserve new username
    await this.reserveUsername(lowercaseUsername, uid)

    // Update user profile with new username
    await this.updateUser(uid, { username: lowercaseUsername })
  }

  static async updateDonationAddress(uid: string, newAddress: string): Promise<void> {
    // Allow empty address (user wants to remove their address)
    if (!newAddress || newAddress.trim() === "") {
      await this.updateUser(uid, { ethAddress: "" })
      return
    }

    // First check if user is trying to enter their own address
    const currentUser = await this.getUser(uid)
    if (currentUser && currentUser.ethAddress && currentUser.ethAddress.toLowerCase() === newAddress.trim().toLowerCase()) {
      throw new Error("This is already your current address. Please enter a new one or leave it blank.")
    }

    // Check if the donation address is available (exclude current user)
    const isAvailable = await this.checkDonationAddressAvailability(newAddress.trim(), uid)
    if (!isAvailable) {
      throw new Error("This donation address is already being used by another user")
    }

    // Update user profile with new donation address
    await this.updateUser(uid, { ethAddress: newAddress.trim() })
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
  static async createSellerApplication(userId: string, applicationData: any): Promise<string> {
    return this.submitSellerApplication(userId, applicationData)
  }

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

  // Username change request system
  static async requestUsernameChange(userId: string, newUsername: string, reason: string): Promise<string> {
    // Check if the requested username is already taken
    const isAvailable = await this.checkUsernameAvailability(newUsername)
    if (!isAvailable) {
      throw new Error("This username is already taken")
    }

    // Check if user already has a pending username change request
    const existingRequestsRef = ref(db, DB_PATHS.USERNAME_CHANGE_REQUESTS)
    const existingRequestsQuery = query(
      existingRequestsRef,
      orderByChild("userId"),
      equalTo(userId)
    )
    const existingRequestsSnapshot = await get(existingRequestsQuery)
    
    if (existingRequestsSnapshot.exists()) {
      const requests = Object.values(existingRequestsSnapshot.val())
      const pendingRequest = requests.find((req: any) => req.status === "pending")
      if (pendingRequest) {
        throw new Error("You already have a pending username change request")
      }
    }

    // Get current user data to include current username
    const user = await this.getUser(userId)
    const currentUsername = user?.username || ""

    const requestsRef = ref(db, DB_PATHS.USERNAME_CHANGE_REQUESTS)
    const newRequestRef = push(requestsRef)
    const requestId = newRequestRef.key!

    await set(newRequestRef, {
      id: requestId,
      userId,
      currentUsername,
      requestedUsername: newUsername.toLowerCase(),
      reason: this.sanitizeInput(reason),
      status: "pending",
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: "",
    })

    return requestId
  }

  static async getUsernameChangeRequests(status?: string): Promise<any[]> {
    let requestsQuery = query(ref(db, DB_PATHS.USERNAME_CHANGE_REQUESTS))

    if (status) {
      requestsQuery = query(ref(db, DB_PATHS.USERNAME_CHANGE_REQUESTS), orderByChild("status"), equalTo(status))
    }

    const snapshot = await get(requestsQuery)
    if (!snapshot.exists()) return []

    return Object.values(snapshot.val())
  }

  static async approveUsernameChangeRequest(requestId: string, adminId: string): Promise<void> {
    const requestRef = ref(db, `${DB_PATHS.USERNAME_CHANGE_REQUESTS}/${requestId}`)
    const request = await get(requestRef)

    if (!request.exists()) throw new Error("Username change request not found")

    const requestData = request.val()

    // Check if username is still available
    const isAvailable = await this.checkUsernameAvailability(requestData.requestedUsername)
    if (!isAvailable) {
      throw new Error("Username is no longer available")
    }

    // Update username mappings first
    const oldUsernameRef = ref(db, `${DB_PATHS.USERNAMES}/${requestData.currentUsername}`)
    const newUsernameRef = ref(db, `${DB_PATHS.USERNAMES}/${requestData.requestedUsername}`)
    
    // Remove old username mapping
    await remove(oldUsernameRef)
    
    // Add new username mapping
    await set(newUsernameRef, requestData.userId)

    // Update the user's username
    await this.updateUser(requestData.userId, {
      username: requestData.requestedUsername,
    })

    // Update the username change request
    await update(requestRef, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
    })

    // Create notification
    await this.createNotification({
      userId: requestData.userId,
      type: "system",
      title: "Username Changed",
      message: `Your username has been changed to @${requestData.requestedUsername}`,
    })
  }

  static async rejectUsernameChangeRequest(requestId: string, adminId: string, notes: string): Promise<void> {
    const requestRef = ref(db, `${DB_PATHS.USERNAME_CHANGE_REQUESTS}/${requestId}`)
    const request = await get(requestRef)

    if (!request.exists()) throw new Error("Username change request not found")

    const requestData = request.val()

    await update(requestRef, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      adminNotes: this.sanitizeInput(notes),
    })

    // Create notification
    await this.createNotification({
      userId: requestData.userId,
      type: "system",
      title: "Username Change Request Rejected",
      message: `Your username change request was rejected. Reason: ${notes}`,
    })
  }

  // Fake follower management for admin panel
  static async addFakeFollower(userId: string, fakeFollowerId: string): Promise<void> {
    const followedAt = new Date().toISOString()
    
    // Add to followers collection: followers/{userId}/{fakeFollowerId}
    const followerRef = ref(db, `followers/${userId}/${fakeFollowerId}`)
    await set(followerRef, { followedAt })
    
    // Add to follows collection: follows/{fakeFollowerId}/{userId}  
    const followRef = ref(db, `follows/${fakeFollowerId}/${userId}`)
    await set(followRef, { followedAt })
  }

  static async removeFakeFollowers(userId: string, count: number): Promise<void> {
    // Get current followers
    const followersRef = ref(db, `followers/${userId}`)
    const snapshot = await get(followersRef)
    
    if (!snapshot.exists()) return
    
    const followers = Object.keys(snapshot.val())
    // Filter for fake followers (letters only, no numbers)
    const fakeFollowers = followers.filter(id => /^[a-zA-Z]+$/.test(id))
    
    // Remove up to the specified count
    const toRemove = fakeFollowers.slice(0, Math.min(count, fakeFollowers.length))
    
    for (const fakeFollowerId of toRemove) {
      // Remove from followers collection
      const followerRef = ref(db, `followers/${userId}/${fakeFollowerId}`)
      await remove(followerRef)
      
      // Remove from follows collection
      const followRef = ref(db, `follows/${fakeFollowerId}/${userId}`)
      await remove(followRef)
    }
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

  // Admin: Get all orders for oversight
  static async getAllOrders(limit?: number): Promise<Order[]> {
    try {
      const ordersRef = ref(db, DB_PATHS.ORDERS)
      const ordersQuery = limit ? query(ordersRef, orderByChild("createdAt"), limitToLast(limit)) : ordersRef
      const snapshot = await get(ordersQuery)
      
      if (!snapshot.exists()) return []
      
      const orders: Order[] = []
      snapshot.forEach((child) => {
        orders.unshift(child.val())
      })
      
      return orders
    } catch (error) {
      console.error("Error fetching all orders:", error)
      return []
    }
  }

  // Admin: Get orders by status
  static async getOrdersByStatus(status: Order["status"]): Promise<Order[]> {
    try {
      const ordersRef = ref(db, DB_PATHS.ORDERS)
      const ordersQuery = query(ordersRef, orderByChild("status"), equalTo(status))
      const snapshot = await get(ordersQuery)
      
      if (!snapshot.exists()) return []
      
      const orders: Order[] = []
      snapshot.forEach((child) => {
        orders.push(child.val())
      })
      
      return orders
    } catch (error) {
      console.error("Error fetching orders by status:", error)
      return []
    }
  }

  // Admin: Get users by userType
  static async getUsersByType(userType: "buyer" | "seller" | "both"): Promise<UserProfile[]> {
    try {
      const usersRef = ref(db, DB_PATHS.USERS)
      const usersQuery = query(usersRef, orderByChild("userType"), equalTo(userType))
      const snapshot = await get(usersQuery)
      
      if (!snapshot.exists()) return []
      
      const users: UserProfile[] = []
      snapshot.forEach((child) => {
        users.push(child.val())
      })
      
      return users
    } catch (error) {
      console.error("Error fetching users by type:", error)
      return []
    }
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

  static async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const messagesRef = ref(db, DB_PATHS.MESSAGES)
    const messagesQuery = query(messagesRef, orderByChild("conversationId"), equalTo(conversationId))
    const messagesSnapshot = await get(messagesQuery)
    
    if (messagesSnapshot.exists()) {
      const messages = Object.entries(messagesSnapshot.val()) as [string, Message][]
      const updates: { [key: string]: any } = {}
      
      messages.forEach(([messageId, message]) => {
        if (message.senderId !== userId) {
          const readBy = message.readBy || []
          if (!readBy.includes(userId)) {
            readBy.push(userId)
            updates[`${DB_PATHS.MESSAGES}/${messageId}/readBy`] = readBy
            updates[`${DB_PATHS.MESSAGES}/${messageId}/status`] = "read"
          }
        }
      })
      
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates)
      }
    }
  }

  static subscribeToUserConversations(userId: string, callback: (conversations: any[]) => void): () => void {
    const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
    const messagesRef = ref(db, DB_PATHS.MESSAGES)
    
    let messagesUnsubscribe: (() => void) | null = null
    
    // Subscribe to both conversations and messages to get real-time updates
    const conversationsUnsubscribe = onValue(conversationsRef, (snapshot) => {
      const conversationsData = snapshot.exists() ? Object.values(snapshot.val()) as any[] : []
      const userConversations = conversationsData.filter(conv => 
        conv.participants && conv.participants[userId] === true
      )
      
      // Unsubscribe from previous messages listener if it exists
      if (messagesUnsubscribe) {
        messagesUnsubscribe()
      }
      
      // Subscribe to messages to calculate unread counts
      messagesUnsubscribe = onValue(messagesRef, (messagesSnapshot) => {
        const messagesData = messagesSnapshot.exists() ? Object.values(messagesSnapshot.val()) as Message[] : []
        
        const conversationsWithUnread = userConversations.map((conversation) => {
          // Filter messages for this conversation
          const conversationMessages = messagesData.filter(msg => msg.conversationId === conversation.id)
          
          // Count unread messages for current user
          const unreadCount = conversationMessages.filter(msg => 
            msg.senderId !== userId && 
            (!msg.readBy || !msg.readBy.includes(userId))
          ).length
          
          return {
            ...conversation,
            unreadCount
          }
        })
        
        callback(conversationsWithUnread)
      })
    })
    
    return () => {
      conversationsUnsubscribe()
      // Also unsubscribe from messages if it exists
      if (messagesUnsubscribe) {
        messagesUnsubscribe()
      }
    }
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

  static async setUserOnline(userId: string): Promise<void> {
    const userOnlineRef = ref(db, `onlineUsers/${userId}`)
    await set(userOnlineRef, {
      lastSeen: new Date().toISOString(),
      status: "online"
    })
  }

  static async setUserOffline(userId: string): Promise<void> {
    const userOnlineRef = ref(db, `onlineUsers/${userId}`)
    await update(userOnlineRef, {
      lastSeen: new Date().toISOString(),
      status: "offline"
    })
  }

  static async removeUserFromOnline(userId: string): Promise<void> {
    const userOnlineRef = ref(db, `onlineUsers/${userId}`)
    await remove(userOnlineRef)
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

  // Get existing conversation or create new one between two users
  static async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<string> {
    try {
      // First, try to find existing conversation
      const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
      const snapshot = await get(conversationsRef)
      
      if (snapshot.exists()) {
        const conversations = snapshot.val()
        // Look for existing conversation between these participants
        for (const [conversationId, conversation] of Object.entries(conversations)) {
          const conv = conversation as any
          if (conv.participants && 
              conv.participants[participant1Id] === true && 
              conv.participants[participant2Id] === true) {
            return conversationId
          }
        }
      }
      
      // If no existing conversation found, create new one
      return await this.createConversation(participant1Id, participant2Id)
    } catch (error) {
      console.error("Error getting or creating conversation:", error)
      // Fallback to creating new conversation
      return await this.createConversation(participant1Id, participant2Id)
    }
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

  // Buy now functionality
  static async initiatePurchase(buyerId: string, boxId: string): Promise<string> {
    const box = await this.getBox(boxId)
    if (!box) {
      throw new Error("Mystery box not found")
    }

    if (box.status !== "active") {
      throw new Error("Mystery box is not available for purchase")
    }

    if (box.quantity <= box.soldQuantity) {
      throw new Error("Mystery box is out of stock")
    }

    const buyer = await this.getUser(buyerId)
    const seller = await this.getUser(box.sellerId)

    if (!buyer || !seller) {
      throw new Error("User not found")
    }

    // Check if conversation already exists between buyer and seller
    const conversationsRef = ref(db, DB_PATHS.CONVERSATIONS)
    const conversationsSnapshot = await get(conversationsRef)
    
    let conversationId = null
    
    if (conversationsSnapshot.exists()) {
      const conversations = Object.values(conversationsSnapshot.val()) as any[]
      const existingConversation = conversations.find(conv => 
        conv.participants && 
        conv.participants[buyerId] && 
        conv.participants[box.sellerId]
      )
      
      if (existingConversation) {
        conversationId = existingConversation.id
      }
    }

    // Create new conversation if it doesn't exist
    if (!conversationId) {
      conversationId = await this.createConversation(buyerId, box.sellerId)
    }

    // Send purchase inquiry message
    const boxUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://mystery-mart.com'}/boxes/${boxId}`
    const messageContent = `Hi, I am ${buyer.fullName} and I want to buy "${box.title}" (${boxUrl}). Please tell me what to do next.`
    
    const messageId = await this.sendMessage({
      conversationId,
      senderId: buyerId,
      content: messageContent,
      type: "text",
    })

    // Track purchase inquiry
    await this.createPurchaseInquiry({
      boxId,
      buyerId,
      sellerId: box.sellerId,
      conversationId,
      messageId,
      status: "pending"
    })

    // Create notification for seller with inventory management reminder
    await this.createNotification({
      userId: box.sellerId,
      type: "message",
      title: "Purchase Inquiry Received",
      message: `${buyer.fullName} wants to buy "${box.title}". After completing the sale, remember to update your inventory in the box management section.`,
      actionUrl: `/boxes/${boxId}/edit/order`,
    })

    return conversationId
  }

  // Send order message to seller
  static async sendOrderMessage(buyerId: string, sellerId: string, content: string, orderId: string): Promise<string> {
    // Create or get conversation
    const conversationId = await this.getOrCreateConversation(buyerId, sellerId)
    
    // Send the order message
    const messageId = await this.sendMessage(conversationId, buyerId, sellerId, content)
    
    // Create notification for seller
    await this.createNotification({
      userId: sellerId,
      type: "order",
      title: "New Order Received",
      message: "You have received a new order. Please check your messages for details.",
      actionUrl: `/order/${orderId}`,
      data: { orderId, buyerId }
    })
    
    return messageId
  }

  // Purchase inquiry tracking
  static async createPurchaseInquiry(inquiryData: {
    boxId: string
    buyerId: string
    sellerId: string
    conversationId: string
    messageId: string
    status: "pending" | "fulfilled" | "cancelled"
  }): Promise<string> {
    const inquiriesRef = ref(db, "purchaseInquiries")
    const newInquiryRef = push(inquiriesRef)
    const inquiryId = newInquiryRef.key!

    await set(newInquiryRef, {
      ...inquiryData,
      id: inquiryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return inquiryId
  }

  static async getPurchaseInquiriesForBox(boxId: string): Promise<any[]> {
    const inquiriesQuery = query(ref(db, "purchaseInquiries"), orderByChild("boxId"), equalTo(boxId))
    const snapshot = await get(inquiriesQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val())
  }

  static async getPurchaseInquiriesForSeller(sellerId: string): Promise<any[]> {
    const inquiriesQuery = query(ref(db, "purchaseInquiries"), orderByChild("sellerId"), equalTo(sellerId))
    const snapshot = await get(inquiriesQuery)

    if (!snapshot.exists()) return []
    return Object.values(snapshot.val())
  }

  static async updatePurchaseInquiryStatus(inquiryId: string, status: "pending" | "fulfilled" | "cancelled"): Promise<void> {
    const inquiryRef = ref(db, `purchaseInquiries/${inquiryId}`)
    await update(inquiryRef, {
      status,
      updatedAt: new Date().toISOString(),
    })
  }

  // Seller dashboard helpers
  static async getSellerDashboardData(sellerId: string): Promise<{
    pendingInquiries: any[]
    lowStockBoxes: any[]
    outOfStockBoxes: any[]
    recentSales: any[]
  }> {
    const [inquiries, boxes] = await Promise.all([
      this.getPurchaseInquiriesForSeller(sellerId),
      this.getBoxes({ sellerId, status: "active" })
    ])

    const pendingInquiries = inquiries.filter(inquiry => inquiry.status === "pending")
    const lowStockBoxes = boxes.filter(box => {
      const remaining = (box.quantity || 0) - (box.soldQuantity || 0)
      return remaining > 0 && remaining <= 2
    })
    const outOfStockBoxes = boxes.filter(box => {
      const remaining = (box.quantity || 0) - (box.soldQuantity || 0)
      return remaining <= 0
    })

    return {
      pendingInquiries,
      lowStockBoxes,
      outOfStockBoxes,
      recentSales: [] // We'll implement this later
    }
  }

  // Update box quantity and status
  static async updateBoxQuantity(boxId: string, soldQuantity: number): Promise<void> {
    const box = await this.getBox(boxId)
    if (!box) {
      throw new Error("Mystery box not found")
    }

    const newSoldQuantity = box.soldQuantity + soldQuantity
    const updates: any = {
      soldQuantity: newSoldQuantity,
    }

    // Mark as out of stock if all items are sold
    if (newSoldQuantity >= box.quantity) {
      updates.status = "out_of_stock"
    }

    await this.updateBox(boxId, updates)
  }

  // Check if box is available for purchase
  static async isBoxAvailable(boxId: string): Promise<boolean> {
    const box = await this.getBox(boxId)
    if (!box) return false
    
    return box.status === "active" && box.quantity > box.soldQuantity
  }

  // Get available quantity for a box
  static async getAvailableQuantity(boxId: string): Promise<number> {
    const box = await this.getBox(boxId)
    if (!box) return 0
    
    return Math.max(0, box.quantity - box.soldQuantity)
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

  // ETH Donation Verification Methods
  static async verifyEthDonation(donationRequest: {
    donorId: string
    recipientId: string
    donorAddress: string
    recipientAddress: string
  }) {
    const donationId = push(ref(db, DB_PATHS.DONATION_VERIFICATIONS)).key!
    
    await set(ref(db, `${DB_PATHS.DONATION_VERIFICATIONS}/${donationId}`), {
      id: donationId,
      ...donationRequest,
      status: "pending",
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      amount: null,
      transactionHash: null,
    })

    // Start background verification process
    try {
      await this.checkEtherscanForDonation(donationId, donationRequest)
    } catch (error) {
      console.error("Failed to start donation verification:", error)
    }

    return donationId
  }

  private static async checkEtherscanForDonation(
    donationId: string,
    donationRequest: {
      donorId: string
      recipientId: string
      donorAddress: string
      recipientAddress: string
    }
  ) {
    try {
      // Etherscan API call to check for recent transactions
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${donationRequest.donorAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=Q2A3ZJI7W1ACP43EMVC11GE6SH5TU53R6G`
      )
      
      const data = await response.json()
      
      if (data.status === "1" && data.result) {
        // Look for transactions from donor to recipient in the last hour
        const oneHourAgo = new Date().getTime() - (60 * 60 * 1000)
        
        for (const tx of data.result) {
          const txTimestamp = parseInt(tx.timeStamp) * 1000
          
          if (
            txTimestamp > oneHourAgo &&
            tx.to?.toLowerCase() === donationRequest.recipientAddress.toLowerCase() &&
            tx.from?.toLowerCase() === donationRequest.donorAddress.toLowerCase() &&
            parseFloat(tx.value) > 0
          ) {
            // Found a matching transaction!
            const amountEth = parseFloat(tx.value) / Math.pow(10, 18) // Convert from Wei to ETH
            
            await this.confirmDonation(donationId, {
              amount: amountEth,
              transactionHash: tx.hash,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed,
            })
            
            return
          }
        }
      }
      
      // If no transaction found, mark as failed after some time
      setTimeout(async () => {
        await this.markDonationFailed(donationId)
      }, 30 * 60 * 1000) // 30 minutes timeout
      
    } catch (error) {
      console.error("Etherscan API error:", error)
      await this.markDonationFailed(donationId)
    }
  }

  private static async confirmDonation(
    donationId: string,
    transactionDetails: {
      amount: number
      transactionHash: string
      blockNumber: string
      gasUsed: string
    }
  ) {
    // Update donation verification record
    await update(ref(db, `${DB_PATHS.DONATION_VERIFICATIONS}/${donationId}`), {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      ...transactionDetails,
    })

    // Get the donation request details
    const donationSnapshot = await get(ref(db, `${DB_PATHS.DONATION_VERIFICATIONS}/${donationId}`))
    const donation = donationSnapshot.val()

    if (donation) {
      // Create notifications for both donor and recipient
      await Promise.all([
        this.createNotification({
          userId: donation.donorId,
          type: "system",
          title: "Donation Verified",
          message: `Your donation of ${transactionDetails.amount.toFixed(4)} ETH has been verified and sent successfully!`,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
        this.createNotification({
          userId: donation.recipientId,
          type: "system",
          title: "Donation Received",
          message: `You received a donation of ${transactionDetails.amount.toFixed(4)} ETH! Transaction: ${transactionDetails.transactionHash}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      ])

      // Record the successful donation
      await this.createDonation({
        donorId: donation.donorId,
        recipientId: donation.recipientId,
        amount: transactionDetails.amount,
        message: `ETH donation verified via blockchain - ${transactionDetails.transactionHash}`,
        type: "eth_donation",
      })
    }
  }

  private static async markDonationFailed(donationId: string) {
    await update(ref(db, `${DB_PATHS.DONATION_VERIFICATIONS}/${donationId}`), {
      status: "failed",
      verifiedAt: new Date().toISOString(),
    })

    // Get the donation request details and notify donor
    const donationSnapshot = await get(ref(db, `${DB_PATHS.DONATION_VERIFICATIONS}/${donationId}`))
    const donation = donationSnapshot.val()

    if (donation) {
      await this.createNotification({
        userId: donation.donorId,
        type: "system",
        title: "Donation Not Found",
        message: "We couldn't find your donation transaction. Please make sure you sent the transaction and try again.",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
  }
}
