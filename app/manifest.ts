import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Appliance Delivery Manager",
    short_name: "Delivery Manager",
    description: "Appliance delivery management system",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8f8",
    theme_color: "#111111",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}