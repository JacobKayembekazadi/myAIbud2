"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/../convex/_generated/api";

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const getOrCreateTenant = useMutation(api.tenants.getOrCreateTenant);

    useEffect(() => {
        if (isLoaded && user) {
            // Create tenant if it doesn't exist
            getOrCreateTenant({
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress || "",
                name: user.fullName || user.firstName || undefined,
            }).catch(console.error);
        }
    }, [isLoaded, user, getOrCreateTenant]);

    return <>{children}</>;
}
