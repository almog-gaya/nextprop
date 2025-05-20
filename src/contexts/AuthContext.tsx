"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { flushAllAuthData } from "@/lib/authUtils";

interface User {
  email: string;
  name: string;
  locationId?: string;
  phone?: string;
  companyId?: string;
  dateAdded?: string;
  firstName?: string;
  lastName?: string;
  id: string;
  phoneNumbers?: PhoneNumber[];
  website?: string;
}
interface PhoneNumberCapabilities {
  fax: boolean;
  mms: boolean;
  sms: boolean;
  voice: boolean;
}

interface InboundCallService {
  type: string;
  value: string;
}

export interface PhoneNumber {
  phoneNumber: string;
  sid: string;
  countryCode: string;
  capabilities: PhoneNumberCapabilities;
  type: string;
  isDefaultNumber: boolean;
  linkedRingAllUsers: string[];
  forwardingNumber: string;
  isGroupConversationEnabled: boolean;
  addressSid: string | null;
  bundleSid: string | null;
  dateAdded: string;
  dateUpdated: string;
  origin: string;
  friendlyName?: string;
  inboundCallService?: InboundCallService;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  loadUser: () => Promise<void>;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = (path: string) => {
    return (
      path.startsWith("/onboarding") ||
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/register") ||
      path.startsWith("/register") ||
      path.startsWith("/auth/signup") ||
      path == '/signup'
    );
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/ghl/data");
      const data = await response.json();

      if (!data.authenticated) {
        // Only redirect if not on a public route
        if (!isPublicRoute(pathname)) {
          router.replace("/auth/login");
        }
        setLoading(false);
        return;
      }

      // Transform the API response to match User interface
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        locationId: data.locationData?.locationId,
        phone: data.user.phone,
        companyId: data.user.companyId,
        dateAdded: data.user.dateAdded,
        phoneNumbers: data.user.numbers,
        website: data.user.website,
      };

      console.log("Setting User as:", userData);
      setUser(userData);
    } catch (e) {
      console.error("Error loading user data:", e);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [router, pathname]); // Include pathname in dependencies

  const logout = () => {
    flushAllAuthData();
    setUser(null);
    setError(null);
    // Use our utility to clear all auth data
    flushAllAuthData();

    // Force a POST request to the logout API endpoint to clear server-side cookies
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch((err) => {
      console.error("Error calling logout API:", err);
    });

    // Navigate to login
    router.push("/auth/login");
  };

  return <AuthContext.Provider value={{ user, loading, error, logout, setError, loadUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
