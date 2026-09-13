export type ProjectCategory = "Mathematics" | "Physics" | "Chemistry" | "Biology" | "Study & Productivity" | "Exam Preparation" | "Notes & Revision" | "School Project";
export type ProjectTemplate = { id:string; name:string; category:ProjectCategory; subject:string; classLevel:string; description:string; icon:string; formula?:string; tags:string[] };
export const PROJECT_CATEGORIES: ProjectCategory[] = ["Mathematics","Physics","Chemistry","Biology","Study & Productivity","Exam Preparation","Notes & Revision","School Project"];
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
{id:"percentage",name:"Percentage Calculator",category:"Mathematics",subject:"Mathematics",classLevel:"6–12",description:"Marks-to-percentage calculator with formula and worked result.",icon:"%",formula:"Percentage = (Obtained / Total) × 100",tags:["calculator","marks"]},
{id:"profit-loss",name:"Profit & Loss Calculator",category:"Mathematics",subject:"Mathematics",classLevel:"7–12",description:"Learn cost price, selling price, profit and loss percentage.",icon:"₹",tags:["calculator","arithmetic"]},
{id:"interest",name:"Simple & Compound Interest",category:"Mathematics",subject:"Mathematics",classLevel:"8–12",description:"Compare SI and CI using a worked calculation.",icon:"∑",tags:["formula","calculator"]},
{id:"trigonometry",name:"Trigonometry Calculator",category:"Mathematics",subject:"Mathematics",classLevel:"9–12",description:"Explore common trigonometric ratios and angles.",icon:"△",tags:["trigonometry","calculator"]},
{id:"quadratic",name:"Quadratic Equation Solver",category:"Mathematics",subject:"Mathematics",classLevel:"10–12",description:"Solve ax² + bx + c = 0 and explain the discriminant.",icon:"x²",formula:"x = (-b ± √(b² − 4ac)) / 2a",tags:["algebra","solver"]},
{id:"ohm",name:"Ohm's Law",category:"Physics",subject:"Physics",classLevel:"9–12",description:"Explore voltage, current and resistance.",icon:"Ω",formula:"V = I × R",tags:["electricity","formula"]},
{id:"kinematics",name:"Kinematics Calculator",category:"Physics",subject:"Physics",classLevel:"9–12",description:"Calculate motion quantities for uniform acceleration.",icon:"↗",formula:"v = u + at",tags:["motion","mechanics"]},
{id:"projectile",name:"Projectile Motion Simulator",category:"Physics",subject:"Physics",classLevel:"11–12",description:"Visualize how launch speed and angle affect a projectile.",icon:"⌁",tags:["simulation","mechanics"]},
{id:"waves",name:"Wave Calculator",category:"Physics",subject:"Physics",classLevel:"9–12",description:"Connect wavelength, frequency and wave speed.",icon:"〰",formula:"v = fλ",tags:["waves","formula"]},
{id:"mole",name:"Mole Concept Calculator",category:"Chemistry",subject:"Chemistry",classLevel:"11–12",description:"Calculate amount of substance from mass and molar mass.",icon:"mol",formula:"n = m / M",tags:["mole","physical chemistry"]},
{id:"molar-mass",name:"Molar Mass Helper",category:"Chemistry",subject:"Chemistry",classLevel:"9–12",description:"Learn how atomic masses combine to form molar mass.",icon:"⚗",tags:["molar mass","chemistry"]},
{id:"periodic-table",name:"Periodic Table Explorer",category:"Chemistry",subject:"Chemistry",classLevel:"6–12",description:"Explore elements, symbols, groups and periods.",icon:"◈",tags:["elements","revision"]},
{id:"biology-flashcards",name:"Biology Flashcards",category:"Biology",subject:"Biology",classLevel:"6–12",description:"Create concise biology concept cards for revision.",icon:"🧬",tags:["flashcards","revision"]},
{id:"pomodoro",name:"Pomodoro Study Timer",category:"Study & Productivity",subject:"Study Skills",classLevel:"6–12",description:"Focus timer with a simple study/break cycle.",icon:"◷",tags:["focus","timer"]},
{id:"study-planner",name:"Daily Study Planner",category:"Study & Productivity",subject:"Study Skills",classLevel:"6–12",description:"Turn subjects and tasks into an actionable daily plan.",icon:"☷",tags:["planner","productivity"]},
{id:"exam-countdown",name:"Exam Countdown",category:"Study & Productivity",subject:"Study Skills",classLevel:"6–12",description:"Convert an exam date into a clear revision target.",icon:"⌛",tags:["exam","planning"]},
{id:"mcq",name:"MCQ Quiz Starter",category:"Exam Preparation",subject:"Practice",classLevel:"6–12",description:"Build concept-check questions with explanations.",icon:"✓",tags:["mcq","practice"]},
{id:"mock-test",name:"Mock Test",category:"Exam Preparation",subject:"Practice",classLevel:"9–12",description:"Create a timed practice test and score it safely.",icon:"▤",tags:["mock test","score"]},
{id:"mistake-tracker",name:"Mistake Tracker",category:"Exam Preparation",subject:"Revision",classLevel:"6–12",description:"Organize mistakes by subject, chapter and revision status.",icon:"!",tags:["mistakes","revision"]},
{id:"flashcards",name:"Flashcard Revision Tool",category:"Notes & Revision",subject:"Revision",classLevel:"6–12",description:"Flip through concise concept cards and revise actively.",icon:"▣",tags:["flashcards","memory"]},
{id:"formula-sheet",name:"Formula Sheet",category:"Notes & Revision",subject:"Revision",classLevel:"6–12",description:"Build a structured formula reference for quick revision.",icon:"ƒ",tags:["formula","revision"]},
{id:"science-experiment",name:"Interactive Science Experiment",category:"School Project",subject:"Science",classLevel:"6–12",description:"Create safe educational visual demonstrations.",icon:"⚗",tags:["science","project"]},
{id:"solar-system",name:"Solar System Explorer",category:"School Project",subject:"Science",classLevel:"6–10",description:"Explore planets and basic solar-system concepts interactively.",icon:"◉",tags:["space","interactive"]}
];
export const getProjectTemplate=(id:string)=>PROJECT_TEMPLATES.find(t=>t.id===id);
