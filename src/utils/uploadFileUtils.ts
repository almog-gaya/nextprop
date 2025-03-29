import { getStorage, ref, getDownloadURL } from "firebase/storage";

export const uploadFile = async (
    file: File,
    path: string, 
    storage = getStorage()
): Promise<string> => {
    const storageBucket = "highlevel-backend.appspot.com";  
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;

    try {
        const jwtToken = ((await (await fetch('/api/auth/firebase-token-id')).json())).tokenId;
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": file.type,
            },
            body: file,
        });

        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

        const result = await response.json();
        console.log("Upload successful:", result); 
        return path;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};