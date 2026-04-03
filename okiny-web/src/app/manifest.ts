import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OKINY",
    short_name: "OKINY",
    description: "「好き」を整理・共有するランキングアプリ",
    start_url: "/rankings",
    display: "standalone",
    background_color: "#f3f5f7",
    theme_color: "#005fcc",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
