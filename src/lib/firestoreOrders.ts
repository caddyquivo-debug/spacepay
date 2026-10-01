import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { Order } from '../types/index.ts';
import { handleFirestoreError, OperationType } from './firestoreProducts.ts';

const ORDERS_COLLECTION = 'orders';

export const firestoreOrders = {
  // Sync Order to Firestore
  async save(order: Order): Promise<void> {
    const docPath = `${ORDERS_COLLECTION}/${order.id}`;
    try {
      const cleanData = JSON.parse(JSON.stringify(order));
      await setDoc(doc(db, ORDERS_COLLECTION, order.id), {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async getById(id: string): Promise<Order | null> {
    const docPath = `${ORDERS_COLLECTION}/${id}`;
    try {
      const snap = await getDoc(doc(db, ORDERS_COLLECTION, id));
      if (!snap.exists()) return null;
      return snap.data() as Order;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  },
};
