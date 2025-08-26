// src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export class AuthService {
  static googleProvider = new GoogleAuthProvider();

  // Register new user
  static async register(email, password, displayName, businessName) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        businessName,
        plan: 'free',
        createdAt: new Date(),
        settings: {
          currency: 'INR',
          gstNumber: null,
          address: null,
          phone: null
        },
        usage: {
          invoicesThisMonth: 0,
          storageUsed: 0
        }
      });

      return { user, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: error.message };
    }
  }

  // Login user
  static async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return { user, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error.message };
    }
  }

  // Google Sign In
  static async signInWithGoogle() {
    try {
      const { user } = await signInWithPopup(auth, this.googleProvider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          plan: 'free',
          createdAt: new Date(),
          settings: {
            currency: 'INR',
            gstNumber: null,
            address: null,
            phone: null
          },
          usage: {
            invoicesThisMonth: 0,
            storageUsed: 0
          }
        });
      }

      return { user, error: null };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { user: null, error: error.message };
    }
  }

  // Logout user
  static async logout() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error.message };
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error.message };
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updates) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date()
      });
      return { error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error: error.message };
    }
  }

  // Get user data
  static async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { data: userDoc.data(), error: null };
      }
      return { data: null, error: 'User not found' };
    } catch (error) {
      console.error('Get user data error:', error);
      return { data: null, error: error.message };
    }
  }
}