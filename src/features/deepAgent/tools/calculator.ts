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
    description:
      "Evaluate a math expression. Supports + - * / % ( ) and functions: sqrt, log, pow, abs, floor, ceil, round, min, max. Example: sqrt(2) + pow(3, 4).",
    schema: z.object({
      expression: z.string().describe("Math expression to evaluate."),
    }),
  },
);
