const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ",
  m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ",
  u: "ᵤ", v: "ᵥ", x: "ₓ",
};

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ",
  h: "ʰ", i: "ⁱ", j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ",
  o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ",
  w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
};

const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε",
  theta: "θ", lambda: "λ", mu: "μ", pi: "π", sigma: "σ", phi: "φ",
  omega: "ω", Delta: "Δ", Gamma: "Γ", Lambda: "Λ", Pi: "Π", Sigma: "Σ",
  Phi: "Φ", Omega: "Ω", times: "×", cdot: "·", pm: "±", leq: "≤",
  geq: "≥", neq: "≠", approx: "≈", infty: "∞", degree: "°",
  rightarrow: "→", longrightarrow: "→", to: "→", leftarrow: "←",
  Leftrightarrow: "⇔", Rightarrow: "⇒", Leftarrow: "⇐", div: "÷",
};

function unicodePower(value: string): string {
  return [...value].map((char) => SUPERSCRIPT[char] ?? char).join("");
}

function unicodeSubscript(value: string): string {
  return [...value].map((char) => SUBSCRIPT[char] ?? char).join("");
}

/**
 * Converts common Gemini LaTeX/Markdown math into student-friendly Unicode.
 * This is intentionally a fallback formatter rather than a raw HTML renderer:
 * AI output is treated as untrusted text and is never injected as HTML.
 */
export function cleanAIText(input: string): string {
  let value = String(input ?? "");

  // Remove fenced-code wrappers when an AI accidentally uses them for prose.
  value = value.replace(/```(?:text|latex|math|markdown)?\s*/gi, "").replace(/```/g, "");

  // Unwrap common LaTeX text/math containers before processing commands.
  value = value.replace(/\\text(?:rm|bf|it|sf|tt)?\{([^{}]*)\}/g, "$1");
  value = value.replace(/\\(?:mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1");

  // Common fractions. Keep them readable instead of exposing LaTeX syntax.
  value = value.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2");
  value = value.replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2");

  // Delimiters and spacing commands are presentation syntax, not content.
  value = value.replace(/\\left|\\right/g, "");
  value = value.replace(/\\[,;:!]/g, " ");

  // Named symbols/arrows.
  value = value.replace(/\\([A-Za-z]+)\b/g, (match, command: string) => SYMBOLS[command] ?? match);

  // Superscripts and subscripts with braces, e.g. ^{2}, _{4}, ^{+}.
  value = value.replace(/\^\{([^{}]+)\}/g, (_, content: string) => unicodePower(content));
  value = value.replace(/_\{([^{}]+)\}/g, (_, content: string) => unicodeSubscript(content));

  // Single-character superscripts/subscripts, e.g. x^2, CH_3.
  value = value.replace(/\^([0-9A-Za-z+\-=()])/g, (_, content: string) => unicodePower(content));
  value = value.replace(/_([0-9A-Za-z])/g, (_, content: string) => unicodeSubscript(content));

  // Remaining simple grouping braces and math delimiters are not meant for users.
  value = value.replace(/[${}]/g, "");

  // Clean up a few malformed leftovers commonly produced by mixed Markdown/LaTeX.
  value = value.replace(/\\+/g, "\\");
  value = value.replace(/\s{2,}/g, " ");

  return value.trim();
}
