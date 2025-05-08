import { collection, doc, setDoc, getDoc, onSnapshot, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const A2P_COLLECTION = 'a2p-registrations';

export interface A2PRegistration {
    id: string;
    userId: string;
    sid?: string;
    customerProfileSid?: string;
    brandRegistrationSid?: string;
    messagingServiceSid?: string;
    campaignSid?: string;
    trustProductSid?: string;
    friendlyName?: string;
    brandstatus?: string;
    identityStatus?: string;
    brandStatusErrors?: []; 
    campaignStatus?: string; 
    campaign?: any,
    brand?: any,
    messagingService?: any,
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
        region: string;
        city: string;
        state: string;
        zip: string;
        isoCountry: string;
        campaignDescription: string;
        sampleMessage1: string;
        sampleMessage2: string;
        useCase: string;
        hasEmbeddedLinks: boolean;
        hasEmbeddedPhone: boolean;
        messageFlow: string;
        optInMessage: string;
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
    //  delete null and undefined values from updates
    Object.keys(updates).forEach(key => {
        if (updates[key] === null || updates[key] === undefined) {
            delete updates[key];
        }
    });
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

export const getA2PRegistrationByUserId = async (locationId: string) => {
    const document = doc(db, A2P_COLLECTION, locationId);
    const docSnap = await getDoc(document);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as A2PRegistration;
    }
    return null;
}
export const getA2PRegistrationBySid = async (sid: string) => {
    const q = query(
        collection(db, A2P_COLLECTION),
        where('sid', '==', sid)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }

    const docSnap = querySnapshot.docs[0];
    return { ...docSnap.data(), id: docSnap.id } as A2PRegistration;
}

export const dumpWeebhook = async (data: any) => {
    try {
        const ref = doc(collection(db, 'webhook-dumps'));
        // remove null and undefined values from data
        Object.keys(data).forEach(key => {
            if (data[key] === null || data[key] === undefined) {
                delete data[key];
            }
        });
        await setDoc(ref, {
            ...data,
            createdAt: Timestamp.now(),
        });
        return ref.id;
    }
    catch (error) {
        console.error('Error dumping webhook data:', error);
    }

}