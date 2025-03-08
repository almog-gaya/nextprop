import { exchangeCodeForTokens, getRedirectUrl, logTokenResponse, setAuthCookies } from "@/utils/authUtils";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(
        getRedirectUrl(request.url, false, new Error('no_code'))
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    logTokenResponse(tokens);

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, tokens);

    return NextResponse.redirect(getRedirectUrl(request.url, true));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      getRedirectUrl(request.url, false, error as Error)
    );
  }
}