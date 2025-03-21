import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCDI9rTwI2T6RT-V6TBl3S1gN9NClCXemc",
    authDomain: "nextprop-ai.firebaseapp.com",
    projectId: "nextprop-ai",
    storageBucket: "nextprop-ai.firebasestorage.app",
    messagingSenderId: "868965846272",
    appId: "1:868965846272:web:b51d010de80123ce6f37e5"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);