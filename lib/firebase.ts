import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBa1zLJLRngGQCC0A-kRQNyfl2UG232kx8",
  authDomain: "quizbatter1.firebaseapp.com",
  databaseURL: "https://quizbatter1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizbatter1",
  storageBucket: "quizbatter1.firebasestorage.app",
  messagingSenderId: "998121763396",
  appId: "1:998121763396:web:0c50b1a4889fdcd2d4c211",
  measurementId: "G-X5B6ERZMP2"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { auth, database, ref, get };