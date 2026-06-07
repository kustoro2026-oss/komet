import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Komet — Social Media Scheduling Platform",
    short_name: "Komet",
    description:
      "Schedule, publish, and analyze content across 15+ social media platforms. Built for creators, teams, and developers.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0c0c13",
    theme_color: "#6c63ff",
    categories: ["business", "social", "productivity"],
    icons: [
      {
        src: "/komet-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/komet-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/komet-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/komet-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
