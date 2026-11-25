import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import siteCss from "../site/site.css?url";
import { markup } from "../site/markup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixel Pioneers | Property Management" },
      { name: "description", content: "Pixel Pioneers property management workspace." },
      { property: "og:title", content: "Pixel Pioneers | Property Management" },
      { property: "og:description", content: "Pixel Pioneers property management workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: siteCss },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    void import("../site/app.js").then((m) => m.startSite());
  }, []);
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
