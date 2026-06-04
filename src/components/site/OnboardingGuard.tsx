import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/**
 * While a signed-in user's profile is still `incomplete`, lock them to the
 * onboarding form — every other route redirects back to /onboarding.
 */
export default function OnboardingGuard() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || !user || !profile) return;
    // Admins are never workers/businesses — they skip the onboarding form.
    if (isAdmin) return;
    if (profile.status !== "incomplete") return;
    if (pathname === "/onboarding") return;
    navigate({ to: "/onboarding" });
  }, [loading, user, profile, isAdmin, pathname, navigate]);

  return null;
}
