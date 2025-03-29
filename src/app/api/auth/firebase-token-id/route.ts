import { refreshTokenIdBackend } from "@/utils/authUtils";

export async function GET() {
    const tokenId = (await refreshTokenIdBackend()).id_token;
    return Response.json({ tokenId });
}