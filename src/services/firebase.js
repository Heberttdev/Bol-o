import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAtcWusBYwGxvgEcNfbdbJ5Ws018G8oHhk",
  authDomain: "bolao26-bbe2c.firebaseapp.com",
  databaseURL: "https://bolao26-bbe2c-default-rtdb.firebaseio.com",
  projectId: "bolao26-bbe2c",
  storageBucket: "bolao26-bbe2c.firebasestorage.app",
  messagingSenderId: "33072795427",
  appId: "33072795427-pl4npka5oqms44juodci4grfohqpo65n.apps.googleusercontent.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;