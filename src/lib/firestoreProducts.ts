import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { Product } from '../types/index.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PRODUCTS_COLLECTION = 'products';

export const firestoreProducts = {
  // CREATE
  async create(product: Product): Promise<void> {
    const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
    try {
      const cleanData = JSON.parse(JSON.stringify(product));
      await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), {
        ...cleanData,
        createdAt: cleanData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  },

  // READ (single)
  async getById(id: string): Promise<Product | null> {
    const docPath = `${PRODUCTS_COLLECTION}/${id}`;
    try {
      const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
      if (!snap.exists()) return null;
      return snap.data() as Product;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  },

  // READ (list all)
  async getAll(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      return snap.docs.map((d) => d.data() as Product);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    }
  },

  // READ by seller
  async getBySellerEmail(sellerEmail: string): Promise<Product[]> {
    try {
      const q = query(collection(db, PRODUCTS_COLLECTION), where('sellerEmail', '==', sellerEmail));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Product);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    }
  },

  // UPDATE
  async update(id: string, updates: Partial<Product>): Promise<void> {
    const docPath = `${PRODUCTS_COLLECTION}/${id}`;
    try {
      const cleanUpdates = JSON.parse(JSON.stringify(updates));
      await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
        ...cleanUpdates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  },

  // DELETE
  async delete(id: string): Promise<void> {
    const docPath = `${PRODUCTS_COLLECTION}/${id}`;
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Real-time subscription
  subscribe(onUpdate: (products: Product[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        const prods = snapshot.docs.map((doc) => doc.data() as Product);
        onUpdate(prods);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
        } catch (e: any) {
          if (onError) onError(e);
        }
      }
    );
  },
};
