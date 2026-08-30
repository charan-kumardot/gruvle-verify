import type { MetadataRoute } from "next";

const SITE_URL = "https://gruvle-verify.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/example", "/privacy", "/terms", "/login", "/signup"],
      disallow: [
        "/dashboard",
        "/verify",
        "/history",
        "/saved",
        "/watchlist",
        "/reports",
        "/settings",
        "/onboarding",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
