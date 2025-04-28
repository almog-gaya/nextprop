import { collection, doc, setDoc, getDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';


const A2P_COLLECTION = 'a2p-registrations';

export interface A2PRegistration {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  steps: {
    customerProfile: { status: string; message: string };
    trustProduct: { status: string; message: string };
    brandRegistration: { status: string; message: string };
    messagingService: { status: string; message: string };
    campaign: { status: string; message: string };
  };
  createdAt: Date;
  updatedAt: Date;
  formData: {
    legalCompanyName: string;
    dbaName: string;
    ein: string;
    einCountry: string;
    businessType: string;
    businessIndustry: string;
    website: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    campaignDescription: string;
    sampleMessage1: string;
    sampleMessage2: string;
    useCase: string;
    hasEmbeddedLinks: boolean;
    hasEmbeddedPhone: boolean;
    messageFlow: string;
  };
}

export const createA2PRegistration = async (userId: string, formData: A2PRegistration['formData']) => {
  const registrationRef = doc(collection(db, A2P_COLLECTION));
  const registration: Omit<A2PRegistration, 'id'> = {
    userId,
    status: 'pending',
    steps: {
      customerProfile: { status: 'pending', message: 'Initializing...' },
      trustProduct: { status: 'pending', message: 'Initializing...' },
      brandRegistration: { status: 'pending', message: 'Initializing...' },
      messagingService: { status: 'pending', message: 'Initializing...' },
      campaign: { status: 'pending', message: 'Initializing...' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    formData
  };

  await setDoc(registrationRef, registration);
  return { ...registration, id: registrationRef.id };
};

export const updateA2PRegistration = async (id: string, updates: Partial<A2PRegistration>) => {
  const registrationRef = doc(db, A2P_COLLECTION, id);
  await setDoc(registrationRef, { ...updates, updatedAt: new Date() }, { merge: true });
};

export const getA2PRegistration = async (id: string) => {
  const registrationRef = doc(db, A2P_COLLECTION, id);
  const docSnap = await getDoc(registrationRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as A2PRegistration;
  }
  return null;
};

export const getUserA2PRegistrations = (locationId: string, callback: (registrations: A2PRegistration[]) => void) => {
  console.log('Setting up Firestore query for locationId:', locationId);
  
  const q = query(
    collection(db, A2P_COLLECTION),
    where('userId', '==', locationId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, 
    (snapshot) => {
      console.log('Firestore snapshot received:', snapshot.docs.length, 'documents');
      const registrations = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing document:', doc.id, data);
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as A2PRegistration;
      });
      callback(registrations);
    },
    (error) => {
      console.error('Error in Firestore snapshot:', error);
    }
  );
}; 