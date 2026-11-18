export default function manifest() {
  return {
    name: "Lakshya Study Platform",
    short_name: "Lakshya",
    description: "Focused study, planning, practice and progress in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#111820",
    categories: ["education", "productivity"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    shortcuts: [
      {
        name: "Study",
        short_name: "Study",
        description: "Open your study library.",
        url: "/study",
      },
      {
        name: "Practice",
        short_name: "Practice",
        description: "Continue solving practice questions.",
        url: "/practice",
      },
      {
        name: "Focus timer",
        short_name: "Focus",
        description: "Start a focused study session.",
        url: "/focus",
      },
      {
        name: "Study planner",
        short_name: "Planner",
        description: "Review your study schedule.",
        url: "/planner",
      },
    ],
  };
}
