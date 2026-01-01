import { db } from "@/config/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  doc, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";

// --- NUEVA ESTRUCTURA ---
export interface GuestMember {
  name: string;
  isConfirmed: boolean;
  tableId?: string | null;
}

export interface GuestData {
  id?: string;
  eventId: string;
  familyName: string;
  contactEmail?: string;
  contactPhone?: string;
  members: GuestMember[];
  status: 'pending' | 'confirmed' | 'declined';
  // --- CAMPOS NUEVOS PARA HOSTESS ---
  hasArrived?: boolean; 
  arrivedAt?: object; // <--- CORREGIDO: Cambiamos 'any' por 'object'
}

export const guestService = {
  // 1. AGREGAR GRUPO
  add: async (guest: Omit<GuestData, 'id'>) => {
    const docRef = await addDoc(collection(db, "guests"), {
      ...guest,
      createdAt: serverTimestamp()
    });
    return docRef.id; // <--- ¡Esto es lo que nos faltaba!
  },

  // 2. ESCUCHAR
  subscribeByEvent: (eventId: string, callback: (guests: GuestData[]) => void) => {
    const q = query(collection(db, "guests"), where("eventId", "==", eventId));
    return onSnapshot(q, (snapshot) => {
      const guests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuestData[];
      callback(guests);
    });
  },

  // 3. ELIMINAR
  delete: async (guestId: string) => {
    await deleteDoc(doc(db, "guests", guestId));
  },

  // 4. ACTUALIZAR
  update: async (guestId: string, data: Partial<GuestData>) => {
    const docRef = doc(db, "guests", guestId);
    await updateDoc(docRef, data);
  },

  // 6. ASIGNAR MIEMBRO A MESA
  assignMember: async (guestId: string, memberName: string, tableId: string | null) => {
    try {
      const docRef = doc(db, "guests", guestId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data() as GuestData;
        const updatedMembers = data.members.map(m => {
          if (m.name === memberName) {
            return { ...m, tableId }; 
          }
          return m;
        });

        await updateDoc(docRef, { members: updatedMembers });
      }
    } catch (error) {
      console.error("Error asignando miembro:", error);
      throw error;
    }
  },

  // 8. OBTENER POR ID (Para el Escáner)
  getById: async (guestId: string) => {
    try {
      const docRef = doc(db, "guests", guestId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as GuestData;
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo invitado:", error);
      throw error;
    }
  },

  // 9. CHECK-IN (Marcar asistencia real en la puerta)
  checkIn: async (guestId: string) => {
    try {
      const docRef = doc(db, "guests", guestId);
      await updateDoc(docRef, { 
        hasArrived: true, 
        arrivedAt: serverTimestamp() 
      });
    } catch (error) {
      console.error("Error en check-in:", error);
      throw error;
    }
  }
};