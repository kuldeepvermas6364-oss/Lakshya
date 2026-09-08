export default function manifest() {
  return {
    name: "Lakshya Study Platform",
    short_name: "Lakshya",
    description: "Focused study, planning, practice and progress in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#111820",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
