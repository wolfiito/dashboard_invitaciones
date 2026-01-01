import { db } from "@/config/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  where,
  getDocs
} from "firebase/firestore";

export interface EventData {
  id?: string;
  name: string;
  client: string;
  date: string;
  guests: number;
  status: 'active' | 'disabled' | 'pending' | 'finished'; // Agregamos 'disabled'
  adminToken?: string; // <--- NUEVO: Token de seguridad
  createdAt?: Timestamp;
}

export const eventService = {
  // 1. CREAR
  create: async (data: Partial<EventData> & { userId: string }) => {
    try {
      const docRef = await addDoc(collection(db, "events"), {
        ...data,
        status: "active",
        guests: 0,
        // Generamos un token inicial automáticamente al crear
        adminToken: crypto.randomUUID(), 
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error("Error al crear evento:", error);
      throw error;
    }
  },

  // 2. ESCUCHAR LISTA
  subscribe: (callback: (events: EventData[]) => void) => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventData[];
      callback(events);
    });
  },

  // 3. OBTENER UNO
  getById: async (id: string) => {
    try {
      const docRef = doc(db, "events", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as EventData;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error al obtener evento:", error);
      throw error;
    }
  },

  // 4. ACTUALIZAR (NUEVO)
  update: async (id: string, data: Partial<EventData>) => {
    try {
      const docRef = doc(db, "events", id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      throw error;
    }
  },

  loginWithToken: async (token: string) => {
    try {
      // Buscamos en toda la colección si hay un evento con este 'adminToken'
      // NOTA: En producción, esto requiere un índice en Firestore, pero funcionará en dev.
      const q = query(collection(db, "events"), where("adminToken", "==", token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Token inválido o evento no encontrado.");
      }

      // Si existe, devolvemos el primer resultado (debería ser único)
      const docSnap = querySnapshot.docs[0];
      const eventData = { id: docSnap.id, ...docSnap.data() } as EventData;

      if (eventData.status === 'disabled') {
        throw new Error("Este evento ha sido deshabilitado por el administrador.");
      }

      return eventData;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }
};