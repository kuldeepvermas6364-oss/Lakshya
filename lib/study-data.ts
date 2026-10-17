export type Subject = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  progress: number;
  color: string;
  chapters: Chapter[];
};

export type Chapter = {
  id: string;
  name: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
  topics: string[];
};

export const subjects: Subject[] = [
  {
    id: "physics",
    name: "Physics",
    shortName: "PHY",
    description: "Concepts, numericals and JEE-focused practice.",
    progress: 42,
    color: "#2563eb",
    chapters: [
      { id: "phy-1", name: "Electric Charges & Fields", progress: 72, status: "in-progress", topics: ["Coulomb's law", "Electric field", "Gauss's law"] },
      { id: "phy-2", name: "Electrostatic Potential & Capacitance", progress: 35, status: "in-progress", topics: ["Potential", "Capacitance", "Dielectrics"] },
      { id: "phy-3", name: "Current Electricity", progress: 0, status: "not-started", topics: ["Drift velocity", "Ohm's law", "Kirchhoff's laws"] },
      { id: "phy-4", name: "Moving Charges & Magnetism", progress: 0, status: "not-started", topics: ["Lorentz force", "Biot-Savart law", "Ampere's law"] }
    ]
  },
  {
    id: "chemistry",
    name: "Chemistry",
    shortName: "CHEM",
    description: "NCERT concepts, reactions and problem solving.",
    progress: 68,
    color: "#16a34a",
    chapters: [
      { id: "chem-1", name: "Solutions", progress: 100, status: "completed", topics: ["Concentration", "Raoult's law", "Colligative properties"] },
      { id: "chem-2", name: "Electrochemistry", progress: 65, status: "in-progress", topics: ["Conductance", "Electrolysis", "Nernst equation"] },
      { id: "chem-3", name: "Chemical Kinetics", progress: 40, status: "in-progress", topics: ["Rate law", "Order of reaction", "Arrhenius equation"] },
      { id: "chem-4", name: "Haloalkanes & Haloarenes", progress: 0, status: "not-started", topics: ["C-X bond", "Substitution", "Elimination"] }
    ]
  },
  {
    id: "mathematics",
    name: "Mathematics",
    shortName: "MATH",
    description: "Board + JEE mathematics with progressive practice.",
    progress: 55,
    color: "#9333ea",
    chapters: [
      { id: "math-1", name: "Relations & Functions", progress: 100, status: "completed", topics: ["Relations", "Functions", "Composition"] },
      { id: "math-2", name: "Matrices & Determinants", progress: 80, status: "in-progress", topics: ["Matrix operations", "Determinants", "Inverse matrix"] },
      { id: "math-3", name: "Continuity & Differentiability", progress: 45, status: "in-progress", topics: ["Continuity", "Differentiability", "Derivatives"] },
      { id: "math-4", name: "Integrals", progress: 0, status: "not-started", topics: ["Indefinite integrals", "Definite integrals", "Area"] }
    ]
  }
];

export const upcomingTasks = [
  { id: "t1", title: "Physics — Current Electricity", time: "08:30", duration: "60 min", type: "Study" },
  { id: "t2", title: "Chemistry — Electrochemistry MCQs", time: "10:00", duration: "45 min", type: "Practice" },
  { id: "t3", title: "Mathematics — Differentiability", time: "12:00", duration: "60 min", type: "Study" }
];
