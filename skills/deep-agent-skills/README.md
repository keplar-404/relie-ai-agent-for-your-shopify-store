# 🚀 Deep Agent Skills Directory (`skills/deep-agent-skills/`)

This directory houses active domain-specific **Skills** for your Deep Agent. 

The agent scans all subdirectories inside `skills/deep-agent-skills/` at startup.

---

## 📂 Directory Structure

```text
skills/
├── templates/
│   └── _template/                     # 🌟 Developer Skill Template (Outside agent scan directory)
│       ├── SKILL.md                   # Frontmatter & progressive disclosure instructions template
│       ├── references/                # Detailed technical documentation template
│       ├── scripts/                   # Executable TS/JS script template
│       └── assets/                    # Schemas & output report templates
└── deep-agent-skills/                 # 🤖 ACTIVE AGENT SKILLS (Loaded by createDeepAgent)
    ├── README.md                      # This guide
    └── shopify-store-helper/          # Active sample skill
        └── SKILL.md
```

---

## 🛠️ How to Create & Deploy a New Skill

1. **Duplicate the Template:**
   Copy `skills/templates/_template/` into `skills/deep-agent-skills/`:
   ```bash
   cp -r skills/templates/_template skills/deep-agent-skills/my-new-skill
   ```

2. **Configure `SKILL.md` Frontmatter:**
   Edit `skills/deep-agent-skills/my-new-skill/SKILL.md`. Ensure the `name` matches your new folder name (`my-new-skill`):
   ```yaml
   ---
   name: my-new-skill
   description: "Detailed description of what this skill does and WHEN to activate it."
   ---
   ```

3. **Automatic Loading:**
   `src/features/deepAgent/agent.ts` scans `/skills/deep-agent-skills/`. The agent will automatically discover `my-new-skill` on its next startup turn!
