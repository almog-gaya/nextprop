import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Initialize the first Firebase app (NextProp)
const nextPropFirebase = {
  apiKey: "AIzaSyCDI9rTwI2T6RT-V6TBl3S1gN9NClCXemc",
  authDomain: "nextprop-ai.firebaseapp.com",
  projectId: "nextprop-ai",
  storageBucket: "nextprop-ai.firebasestorage.app",
  messagingSenderId: "868965846272",
  appId: "1:868965846272:web:b51d010de80123ce6f37e5",
};

const goHighLevelFirebase = {
  apiKey: "AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE",
  projectId: "439472444885",
  authDomain: "highlevel-backend.firebaseapp.com",
  storageBucket: "highlevel-backend.appspot.com",
};

// Initialize Firestore with NextProp
const app1 = initializeApp(nextPropFirebase);
export const db = getFirestore(app1);

// Initialize a second Firebase app for GoHighLevel
const app2 = initializeApp(goHighLevelFirebase, "goHighLevelApp");
export const goHighLevelStorage = getStorage(app2);