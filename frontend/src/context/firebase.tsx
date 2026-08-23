
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// keep your credentials 
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const isConfigured = firebaseConfig.apiKey !== "";

const app = isConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
export default app;
