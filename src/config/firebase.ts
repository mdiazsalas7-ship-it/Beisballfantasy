import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, addDoc, setDoc, deleteDoc,
  onSnapshot, query, where as fbWhere
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "firebase/storage";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZbYofqvt-gL2ZRPvjUlmd8fNyhMQXbFY",
  authDomain: "panavencargo.firebaseapp.com",
  projectId: "panavencargo",
  storageBucket: "panavencargo.firebasestorage.app",
  messagingSenderId: "1068216772342",
  appId: "1:1068216772342:web:869b8ec698f200ec1aaed7",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// ─── Auth helpers ───
export const Auth = {
  login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  onAuth: (cb: any) => onAuthStateChanged(auth, cb),
};

// ─── Firestore helpers ───
export const F = {
  add: async (col: string, data: any) => {
    const r = await addDoc(collection(db, col), { ...data, createdAt: Date.now() });
    return r.id;
  },
  set: async (col: string, id: string, data: any) => {
    await setDoc(doc(db, col, id), data, { merge: true });
  },
  del: async (col: string, id: string) => {
    await deleteDoc(doc(db, col, id));
  },
  on: (col: string, cb: any) => {
    return onSnapshot(collection(db, col), (snap: any) =>
      cb(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    );
  },
  onDoc: (col: string, id: string, cb: any) => {
    return onSnapshot(doc(db, col, id), (d: any) =>
      cb(d.exists() ? { id: d.id, ...d.data() } : null)
    );
  },
  where: (col: string, field: string, val: string, cb: any) => {
    return onSnapshot(
      query(collection(db, col), fbWhere(field, "==", val)),
      (snap: any) => cb(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })))
    );
  },
};

// ─── Image upload ───
export async function uploadLogo(file: File, path: string): Promise<string> {
  const resized = await resizeImage(file, 400);
  const ref = storageRef(storage, path);
  await uploadBytes(ref, resized);
  return getDownloadURL(ref);
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}