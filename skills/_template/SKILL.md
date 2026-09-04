---
name: my-advanced-skill
description: "Detailed, specific description telling the agent what this skill does and WHEN to activate it. Include target domain keywords (e.g., shopify, API, report, analytics, automation) so the agent matches this skill reliably."
license: MIT
compatibility: "Requires Node.js runtime or bash environment if running bundled scripts."
metadata:
  author: relie-ai
  version: "1.0.0"
  category: automation
allowed-tools: read_file write_file edit_file run_command
---

# Advanced Skill Template: My Advanced Skill

## Overview
Briefly describe the domain capability or workflow this skill provides. Explain the high-level objective and value.

---

## When to Activate
Activate this skill when the user's prompt matches any of the following scenarios:
- The user requests **[Scenario 1]** (e.g. "Generate a weekly sales summary report").
- The user asks to **[Scenario 2]** (e.g. "Validate JSON payload against our schema").
- Keywords present in user request: `keyword1`, `keyword2`, `keyword3`.

---

## Progressive Disclosure & Resource Map

This skill contains supplementary resources in the following subdirectories:

| Directory | File Path | Purpose / Description | When to Access |
| :--- | :--- | :--- | :--- |
| **`references/`** | `references/api-reference.md` | In-depth API endpoint schemas and technical specifications. | Read when building API payloads or checking request parameters. |
| **`references/`** | `references/style-guide.md` | Formatting rules and output brand standards. | Read when structuring final response outputs. |
| **`scripts/`** | `scripts/execute_task.ts` | Executable TypeScript script for automated calculations or validation. | Run via sandbox shell when execution is required. |
| **`assets/`** | `assets/schema.json` | JSON Schema template for output validation. | Read to inspect valid payload structures. |
| **`assets/`** | `assets/template.md` | Markdown report template structure. | Copy or format output according to this layout. |

> ⚠️ **Note:** Do NOT load all supporting files upfront. Only open and read files when a step explicitly calls for them.

---

## Workflow Instructions

Follow these step-by-step procedures when this skill is invoked:

### Step 1: Request Analysis & Validation
1. Parse the user request to identify required parameters and goals.
2. If schema validation is required, read [`assets/schema.json`](assets/schema.json) to verify expected fields.

### Step 2: Reference Guidance & Rule Check
1. For technical parameters, endpoints, or error codes, read [`references/api-reference.md`](references/api-reference.md).
2. For response formatting and brand tone, consult [`references/style-guide.md`](references/style-guide.md).

### Step 3: Script Execution (If Applicable)
If automated processing or validation is required:
1. Run the script located at `scripts/execute_task.ts` passing necessary arguments:
   ```bash
   npx tsx scripts/execute_task.ts --input "your_input_data"
   ```
2. Inspect the script execution output and handle any errors gracefully.

### Step 4: Output Synthesis & Generation
1. Format the final output adhering to [`assets/template.md`](assets/template.md).
2. Ensure all edge cases noted below are explicitly handled.

---

## Edge Cases & Error Handling

- **Missing Input Parameters**: Prompt the user specifically for missing required fields before executing scripts.
- **Script Failure**: If `scripts/execute_task.ts` fails or returns an error, fallback to manual analysis and inform the user of the error traceback.
- **Validation Mismatch**: If input fails schema check against `assets/schema.json`, list the invalid fields clearly.

---

## Expected Output Format

Provide responses according to the following Markdown layout:

```markdown
### 📊 Summary
[High-level concise summary of actions taken or results]

### 📝 Key Findings / Details
- **Detail 1**: ...
- **Detail 2**: ...

### 🚀 Next Steps / Recommendations
- [ ] Action item 1
- [ ] Action item 2
```
