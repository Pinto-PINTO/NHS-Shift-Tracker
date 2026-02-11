// src/services/shiftService.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Shift Service for Firebase Firestore operations
 * 
 * Database Structure:
 * shifts/
 *   └── {date-string}/
 *       ├── type: 'shift' | 'leave'
 *       ├── shiftType: 'day' | 'night' | 'twilight'
 *       ├── leaveType: 'sick' | 'annual' | 'training' | 'preceptorship'
 *       ├── isShortShift: boolean
 *       ├── eventName: string
 *       ├── time: string
 *       ├── location: string
 *       ├── notes: string
 *       └── createdAt: timestamp
 */

class ShiftService {
  constructor() {
    this.collectionName = 'shifts';
  }

  /**
   * Remove undefined values from an object
   * Firestore doesn't accept undefined values
   * @param {object} obj - Object to clean
   * @returns {object} Cleaned object
   */
  removeUndefined(obj) {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }

  /**
   * Add or update a shift
   * @param {string} dateStr - Date in format YYYY-MM-DD
   * @param {object} shiftData - Shift data object
   * @param {string} userId - Optional user ID for multi-user support
   */
  async saveShift(dateStr, shiftData, userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftRef = doc(db, collectionPath, dateStr);
      
      // Remove undefined values from shiftData
      const cleanedData = this.removeUndefined(shiftData);
      
      const dataToSave = {
        ...cleanedData,
        updatedAt: new Date().toISOString()
      };

      // Add createdAt only for new shifts
      const existingShift = await this.getShift(dateStr, userId);
      if (!existingShift.success || !existingShift.data) {
        dataToSave.createdAt = new Date().toISOString();
      }

      await setDoc(shiftRef, dataToSave, { merge: true });
      return { success: true, data: dataToSave };
    } catch (error) {
      console.error('Error saving shift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single shift by date
   * @param {string} dateStr - Date in format YYYY-MM-DD
   * @param {string} userId - Optional user ID
   */
  async getShift(dateStr, userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftRef = doc(db, collectionPath, dateStr);
      const shiftSnap = await getDoc(shiftRef);
      
      if (shiftSnap.exists()) {
        return { success: true, data: shiftSnap.data() };
      } else {
        return { success: false, data: null };
      }
    } catch (error) {
      console.error('Error getting shift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all shifts
   * @param {string} userId - Optional user ID
   */
  async getAllShifts(userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftsRef = collection(db, collectionPath);
      const querySnapshot = await getDocs(shiftsRef);
      
      const shifts = {};
      querySnapshot.forEach((doc) => {
        shifts[doc.id] = doc.data();
      });
      
      return { success: true, data: shifts };
    } catch (error) {
      console.error('Error getting all shifts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shifts for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {string} userId - Optional user ID
   */
  async getShiftsByMonth(year, month, userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftsRef = collection(db, collectionPath);
      
      // Create date range for the month
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
      
      const querySnapshot = await getDocs(shiftsRef);
      
      const shifts = {};
      querySnapshot.forEach((doc) => {
        const dateStr = doc.id;
        if (dateStr >= startDate && dateStr <= endDate) {
          shifts[dateStr] = doc.data();
        }
      });
      
      return { success: true, data: shifts };
    } catch (error) {
      console.error('Error getting shifts by month:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shifts for a specific year
   * @param {number} year - Year
   * @param {string} userId - Optional user ID
   */
  async getShiftsByYear(year, userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftsRef = collection(db, collectionPath);
      
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const querySnapshot = await getDocs(shiftsRef);
      
      const shifts = {};
      querySnapshot.forEach((doc) => {
        const dateStr = doc.id;
        if (dateStr >= startDate && dateStr <= endDate) {
          shifts[dateStr] = doc.data();
        }
      });
      
      return { success: true, data: shifts };
    } catch (error) {
      console.error('Error getting shifts by year:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a shift
   * @param {string} dateStr - Date in format YYYY-MM-DD
   * @param {string} userId - Optional user ID
   */
  async deleteShift(dateStr, userId = null) {
    try {
      const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
      const shiftRef = doc(db, collectionPath, dateStr);
      await deleteDoc(shiftRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting shift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer a shift from one date to another
   * @param {string} fromDate - Source date
   * @param {string} toDate - Destination date
   * @param {string} userId - Optional user ID
   */
  async transferShift(fromDate, toDate, userId = null) {
    try {
      // Get the shift data from the source date
      const shiftResult = await this.getShift(fromDate, userId);
      
      if (!shiftResult.success || !shiftResult.data) {
        return { success: false, error: 'Source shift not found' };
      }

      // Save to the new date
      await this.saveShift(toDate, shiftResult.data, userId);
      
      // Delete from the old date
      await this.deleteShift(fromDate, userId);
      
      return { success: true };
    } catch (error) {
      console.error('Error transferring shift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time updates for all shifts
   * @param {function} callback - Callback function to handle updates
   * @param {string} userId - Optional user ID
   * @returns {function} Unsubscribe function
   */
  subscribeToShifts(callback, userId = null) {
    const collectionPath = userId ? `users/${userId}/shifts` : this.collectionName;
    const shiftsRef = collection(db, collectionPath);
    
    return onSnapshot(shiftsRef, (snapshot) => {
      const shifts = {};
      snapshot.forEach((doc) => {
        shifts[doc.id] = doc.data();
      });
      callback(shifts);
    }, (error) => {
      console.error('Error in real-time subscription:', error);
    });
  }

  /**
   * Get statistics for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {string} userId - Optional user ID
   */
  async getMonthStatistics(year, month, userId = null) {
    try {
      const result = await this.getShiftsByMonth(year, month, userId);
      
      if (!result.success) {
        return result;
      }

      const shifts = result.data;
      const stats = {
        total: Object.keys(shifts).length,
        dayShifts: 0,
        nightShifts: 0,
        twilightShifts: 0,
        shortShifts: 0,
        leaves: 0,
        sickLeave: 0,
        annualLeave: 0,
        training: 0,
        preceptorship: 0
      };

      Object.values(shifts).forEach(shift => {
        if (shift.type === 'leave') {
          stats.leaves++;
          if (shift.leaveType === 'sick') stats.sickLeave++;
          if (shift.leaveType === 'annual') stats.annualLeave++;
          if (shift.leaveType === 'training') stats.training++;
          if (shift.leaveType === 'preceptorship') stats.preceptorship++;
        } else {
          if (shift.shiftType === 'day') stats.dayShifts++;
          if (shift.shiftType === 'night') stats.nightShifts++;
          if (shift.shiftType === 'twilight') stats.twilightShifts++;
          if (shift.isShortShift) stats.shortShifts++;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance
export const shiftService = new ShiftService();
export default shiftService;