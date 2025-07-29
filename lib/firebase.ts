import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyDemMSrf63Zh23RIbKVRoDejHqYzkqCPaI",
  authDomain: "mystery-mart-by-uzair.firebaseapp.com",
  projectId: "mystery-mart-by-uzair",
  storageBucket: "mystery-mart-by-uzair.firebasestorage.app",
  messagingSenderId: "576259187773",
  appId: "1:576259187773:web:9102d2c1c913808800b654"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
