# PAL MCP — Available Models for Auditing & Review

Use PAL MCP tools (`codereview`, `secaudit`, `analyze`, `chat`, `thinkdeep`, `consensus`) for cross-model second opinions on all significant changes.

## Active Providers (always available)

| Alias | Model | Best For |
|-------|-------|----------|
| `pro` | Gemini 2.5 Pro (1M ctx) | Deep code review, architecture analysis |
| `flash` | Gemini 2.5 Flash (1M ctx) | Quick checks, simple queries |
| `codestral` | Mistral Codestral (131K ctx) | Code-specialized review, bulk analysis |
| `mistral-large` | Mistral Large 2 (131K ctx) | Reasoning, architecture |
| `nova` | Amazon Nova Pro (300K ctx) | Multimodal, large context |
| `llama` | Llama 3.3 70B via Bedrock (128K ctx) | Open-weight second opinion |
| `free` | OpenRouter auto-router | Free fallback, picks best available |
| `qwen-free` | Qwen 3.6+ via OpenRouter (1M ctx) | Free large-context reasoning |

## IMPORTANT RESTRICTIONS

- **NEVER use `gemini-3-pro-preview` or `gemini3`** — incurs separate Google Cloud charges
- When specifying Gemini, always use `pro` (maps to 2.5 Pro) or `flash` (maps to 2.5 Flash)
- Prefer `codestral` or `mistral-large` for bulk code review (1B free tokens/month)
- Use `pro` or `flash` for quick interactive checks

## When to Audit

| Change Type | PAL Tool | Suggested Model |
|-------------|----------|-----------------|
| Application logic, components | `codereview` | `pro` or `codestral` |
| Security, auth, data handling | `secaudit` | `pro` |
| Architecture, major refactors | `analyze` | `mistral-large` |
| Quick sanity check | `chat` | `flash` or `codestral` |
| Complex reasoning, deep analysis | `thinkdeep` | `pro` |
| Multi-model consensus | `consensus` | (auto-selects multiple) |
