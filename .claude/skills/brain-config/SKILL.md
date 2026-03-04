# Brain Config — Neural Communication Flow Manager

Dynamically configure the Higgs dual-brain nervous system. This skill lets Claude Code evolve the communication flows between brain zones in real-time without restarting the bot.

## Config File

All neural parameters live in `~/.antigravity/comms/brain_config.json`. The brain modules hot-reload this file on every query — changes take effect immediately.

## What You Can Configure

### Thalamus (Query Router)
| Parameter | Key | Effect |
|-----------|-----|--------|
| Default hemisphere | `thalamus.default_hemisphere` | Which brain handles unmatched queries (`left`/`right`) |
| Long query threshold | `thalamus.long_query_threshold` | Word count above which unmatched queries → right hemisphere |
| Tie breaker | `thalamus.tie_breaker` | What happens when scores tie (`bilateral`/`left`/`right`) |
| Left patterns | `thalamus.left_patterns` | Regex list — queries matching these → Gemini |
| Right patterns | `thalamus.right_patterns` | Regex list — queries matching these → Claude |
| Bilateral patterns | `thalamus.bilateral_patterns` | Regex list — queries matching these → both |

### Left Hemisphere (Gemini)
| Parameter | Key | Effect |
|-----------|-----|--------|
| Model | `left_hemisphere.model` | Gemini model ID |
| Max tokens | `left_hemisphere.max_tokens` | Response length limit |
| Context window | `left_hemisphere.context_window` | Max chars of context sent |
| History pairs | `left_hemisphere.history_pairs` | Conversation memory depth |

### Right Hemisphere (Claude)
| Parameter | Key | Effect |
|-----------|-----|--------|
| Model | `right_hemisphere.model` | Claude model ID |
| Max tokens | `right_hemisphere.max_tokens` | Response length limit |
| Context window | `right_hemisphere.context_window` | Max chars of context sent |
| History pairs | `right_hemisphere.history_pairs` | Conversation memory depth |

### Corpus Callosum (Fusion)
| Parameter | Key | Effect |
|-----------|-----|--------|
| Fusion strategy | `corpus_callosum.fusion_strategy` | How bilateral responses merge |
| Max chars per hemi | `corpus_callosum.max_chars_per_hemisphere` | Truncation limit per side |
| Conflict preference | `corpus_callosum.prefer_hemisphere_on_conflict` | Which brain wins conflicts |

Available fusion strategies: `structured_dual`, `prefer_left`, `prefer_right`, `merge`, `shortest`, `longest`

### Neuroplasticity
| Parameter | Key | Effect |
|-----------|-----|--------|
| Enabled | `neuroplasticity.enabled` | Log routing decisions for learning |
| Auto-promote | `neuroplasticity.auto_promote_patterns` | Future: auto-adjust patterns |

## Steps

### 1. Diagnose current state
- Read `~/.antigravity/comms/brain_config.json` to see current configuration
- Read `~/.antigravity/comms/HEARTBEAT.md` to check live neural status
- Optionally read `~/.antigravity/comms/analytics/routing.jsonl` for routing history

### 2. Identify the change needed
- Determine which zone needs adjustment (thalamus, hemisphere, corpus callosum)
- For pattern changes: draft the new regex and test it mentally against example queries
- For strategy changes: review available options in the config

### 3. Apply the change
- Use the Edit tool to modify `~/.antigravity/comms/brain_config.json`
- Update `_meta.last_modified` and `_meta.modified_by` timestamps
- Changes take effect on the next query — no bot restart needed

### 4. Verify
- Check the bot logs: `tail -20 /tmp/higgs_bot.log`
- Send a test query through Telegram or check HEARTBEAT.md after a query
- Verify the routing decision matches expectations

## Common Operations

### Add a new routing pattern
```
Edit brain_config.json:
  thalamus.right_patterns → append new regex
  _meta.last_modified → update timestamp
```

### Switch default hemisphere
```
Edit brain_config.json:
  thalamus.default_hemisphere → "right" (or "left")
```

### Change fusion strategy
```
Edit brain_config.json:
  corpus_callosum.fusion_strategy → "prefer_right" (or other strategy)
```

### Upgrade a hemisphere model
```
Edit brain_config.json:
  right_hemisphere.model → "claude-opus-4-20250514" (or newer)
  left_hemisphere.model → "gemini-2.5-flash" (for speed)
```

### Increase response length
```
Edit brain_config.json:
  right_hemisphere.max_tokens → 2048
  corpus_callosum.max_chars_per_hemisphere → 2500
```

## Rollback
If a change causes issues:
- Revert the edit in `brain_config.json`
- The modules will pick up the reverted config on the next query
- For emergencies: delete `brain_config.json` — modules fall back to hardcoded defaults
