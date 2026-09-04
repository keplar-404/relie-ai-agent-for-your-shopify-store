import { tool } from "langchain";
import { z } from "zod";

// ponytail: eval expression. Identifier allow-list caps surface; swap for mathjs or a proper parser when you need arbitrary algebra.
const ALLOWED = {
  sqrt: Math.sqrt,
  log: Math.log,
  pow: Math.pow,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
} as const;

export const calculator = tool(
  ({ expression }: { expression: string }) => {
    if (typeof expression !== "string" || expression.length === 0 || expression.length > 200) {
      return "Error: expression must be a non-empty string under 200 characters.";
    }
    if (!/^[\d\s+\-*/().,%A-Za-z_]+$/.test(expression)) {
      return "Error: expression contains disallowed characters.";
    }
    const names = Object.keys(ALLOWED);
    const params = ["__ALLOWED", ...names].join(", ");
    const bindings = names.map((n, i) => `${n} = __ALLOWED.${n}`).join(", ");
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(params, `return (${bindings}, ${expression});`);
      const result = fn(ALLOWED);
      if (typeof result === "number" && !Number.isFinite(result)) {
        return "Error: result is not a finite number.";
      }
      return String(result);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : "failed to evaluate"}`;
    }
  },
  {
    name: "calculator",
    description: `Tool Name: calculator
What it does: Evaluates mathematical expressions safely using supported operators (+ - * / % ( )) and functions (sqrt, log, pow, abs, floor, ceil, round, min, max).
When to use: Use when performing numeric calculations, unit conversions, or layout dimension math.
Input Format: JSON object { expression: string } containing a math expression under 200 characters.
Output Format:
  - On Success: String representation of the resulting number (e.g. "4", "1.4142135623730951").
  - On Error / Not Found: String error message "Error: <reason>" (e.g. "Error: expression contains disallowed characters.", "Error: result is not a finite number.").
Rules / Constraints:
  - Expression must be under 200 characters and contain only allowed math symbols/functions.`,
    schema: z.object({
      expression: z.string().describe("Math expression to evaluate."),
    }),
  },
);
