---
name: Target Market Optimizer
description: Analyzes global markets to identify optimal expansion targets for RiveHub restaurants based on utility costs, inflation, and regional rules.
---

# Target Market Optimizer

This skill enables the agent to evaluate and recommend target markets for restaurant expansion using the `global_markets` database and macro-economic factors.

## Core Responsibilities

1. **Utility Cost Analysis**: Evaluate markets based on their `avg_electricity_price_kwh` and `avg_water_price_l` from the `global_markets` table. Look for regions with stable or low utility costs to ensure high profit margins for energy-intensive restaurant operations (like breweries or high-volume kitchens).
2. **Economic Viability**: Factor in the local currency and relative inflation rates when recommending markets. (You can query Gemini or use web search tools to gather real-time data on inflation if needed).
3. **Strategic Recommendations**: When a user asks for expansion advice or "best markets", formulate a structured report comparing at least 3 regions, highlighting the utility cost differentials.

## Execution Rules

- **ALWAYS** check the `global_markets` table first to ensure the requested country or region exists in the database.
- **NEVER** recommend a market without citing the expected electricity and water costs. If the data is missing from the database, use external search tools to find the average costs and explicitly state you are using external data.
- Offer to `UPDATE` the `global_markets` table with the external data you found if it was missing.

## Usage Example

```markdown
User: "What are the best European markets to open a new brewery right now?"
Agent:
1. Queries `global_markets` for European countries.
2. Identifies countries with lowest `avg_electricity_price_kwh` (critical for breweries).
3. Cross-references with external economic data (inflation/currency stability).
4. Presents a ranked list of 3 countries, highlighting the projected utility savings compared to the user's current location.
```
