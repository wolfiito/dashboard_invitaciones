import { db } from "@/config/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

export interface TableData {
  id?: string;
  eventId: string;
  name: string;      // Ej. "Mesa 1", "Mesa Principal"
  capacity: number;  // Ej. 10 personas
  shape?: 'round' | 'rectangular'; // Para futuros iconos
}

export const tableService = {
  // 1. CREAR MESA
  add: async (table: Omit<TableData, 'id'>) => {
    try {
      await addDoc(collection(db, "tables"), {
        ...table,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creando mesa:", error);
      throw error;
    }
  },

  // 2. ESCUCHAR MESAS DEL EVENTO
  subscribeByEvent: (eventId: string, callback: (tables: TableData[]) => void) => {
    const q = query(
      collection(db, "tables"), 
      where("eventId", "==", eventId)
    ); // Podríamos agregar orderBy('name') si creamos un índice después

    return onSnapshot(q, (snapshot) => {
      const tables = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TableData[];
      
      // Ordenamos las mesas por nombre alfabéticamente en el cliente
      tables.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      
      callback(tables);
    });
  },

  // 3. ELIMINAR MESA
  delete: async (tableId: string) => {
    try {
      await deleteDoc(doc(db, "tables", tableId));
    } catch (error) {
      console.error("Error eliminando mesa:", error);
      throw error;
    }
  }
};