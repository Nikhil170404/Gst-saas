// src/services/authService.js - Fixed version
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Create Google provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export class AuthService {
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
          phone: null,
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          theme: 'system'
        },
        usage: {
          invoicesThisMonth: 0,
          expensesThisMonth: 0,
          storageUsed: 0,
          lastLogin: new Date()
        },
        preferences: {
          emailNotifications: true,
          gstReminders: true,
          monthlyReports: false,
          marketingEmails: false
        }
      });

      return { user, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or try signing in.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email registration is currently disabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'Registration failed. Please try again.';
      }
      
      return { user: null, error: errorMessage };
    }
  }

  // Login user
  static async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        'usage.lastLogin': new Date()
      });
      
      return { user, error: null };
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      return { user: null, error: errorMessage };
    }
  }

  // Google Sign In - Fixed
  static async signInWithGoogle() {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document for first-time Google users
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          businessName: user.displayName || 'My Business',
          plan: 'free',
          createdAt: new Date(),
          settings: {
            currency: 'INR',
            gstNumber: null,
            address: null,
            phone: null,
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            theme: 'system'
          },
          usage: {
            invoicesThisMonth: 0,
            expensesThisMonth: 0,
            storageUsed: 0,
            lastLogin: new Date()
          },
          preferences: {
            emailNotifications: true,
            gstReminders: true,
            monthlyReports: false,
            marketingEmails: false
          }
        });
      } else {
        // Update last login for existing users
        await updateDoc(userDocRef, {
          'usage.lastLogin': new Date(),
          photoURL: user.photoURL // Update photo URL in case it changed
        });
      }

      return { user, error: null };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is currently disabled. Please contact support.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email using a different sign-in method.';
          break;
        default:
          errorMessage = error.message || 'Google sign-in failed. Please try again.';
      }
      
      return { user: null, error: errorMessage };
    }
  }

  // Logout user
  static async logout() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: 'Failed to sign out. Please try again.' };
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email. Please try again.';
      }
      
      return { error: errorMessage };
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updates) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { error: 'Failed to update profile. Please try again.' };
    }
  }

  // Get user data
  static async getUserData(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { data: userDoc.data(), error: null };
      }
      
      return { data: null, error: 'User not found' };
    } catch (error) {
      console.error('Get user data error:', error);
      return { data: null, error: 'Failed to fetch user data. Please try again.' };
    }
  }

  // Check if email exists
  static async checkEmailExists(email) {
    try {
      // This is a simplified check - in production, you might want to use Firebase Admin SDK
      // For now, we'll let the sign-up process handle duplicate email detection
      return { exists: false, error: null };
    } catch (error) {
      console.error('Email check error:', error);
      return { exists: false, error: 'Failed to check email. Please try again.' };
    }
  }

  // Update password
  static async updateUserPassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { error: 'No user logged in.' };
      }

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak. Please choose a stronger password.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log in again and try updating your password.';
          break;
        default:
          errorMessage = error.message || 'Failed to update password. Please try again.';
      }
      
      return { error: errorMessage };
    }
  }
}