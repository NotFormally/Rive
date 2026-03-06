# RiveHub GTM Strategy: The Trojan Horse

## 1. Le vecteur d'acquisition (GTM) : The "Trojan Horse"
**The Advisor's Concern:** Rive attempts to consolidate traditionally fragmented operational vectors (cash flow, HACCP, POS sync, HR NLP). What is the single critical usecase (Core Feature) that makes a chef buy *today*?

**Reflection & Strategy:**
We need to pick the feature that solves an immediate, bleeding-neck pain. 
*   **The Best Trojan Horse: OCR Invoice Processing & Dynamic Food Cost.** 
*   **Why?** Chefs and owners hate data entry. Plucking a crumpled invoice out of a box, snapping a photo, and magically seeing their *Food Cost* updated and receiving alerts about ingredient price drifts ("invisible waste") provides **immediate ROI**. 
*   **The Narrative:** "While our vision is the complete Kitchen OS, our GTM wedge is **Margin Protection**. The Trojan Horse is the OCR Food Cost engine. Once they are hooked on our platform because it saves them 3 hours a week of data entry and catches supplier overcharges, cross-selling the HACCP log and NLP translation features becomes effortless."

## 2. La symétrie des flux de données : Read-Only vs. Bidirectional POS Sync
**The Advisor's Concern:** Are integrations POS strictly *Read-Only* (asynchronous ingestion) or bidirectional (*Push* capability to modify inventory/prices)?

**Reflection & Strategy:**
This is a test of engineering scope and risk management. Pushing data to a legacy POS is difficult, error-prone, and risky.
*   **The Safest Answer for Seed Stage:** **Strictly Read-Only (for now).**
*   **The Narrative:** "For our current phase, we are strictly **Read-Only**. Our goal is to act as the 'Sonar Analysis'—giving chefs the intelligence they need to make decisions. Building bidirectional push capabilities requires massive engineering overhead to handle edge cases for every different POS API. By staying Read-Only, we keep our engineering lean and avoid the liability of breaking their live operations. We provide the *Liquid Intelligence*, and the manager makes the manual update in the POS. Two-way sync is on the roadmap for Series A."

## 3. Le traitement de l'OCR : Multimodal LLMs vs. Deterministic Architecture
**The Advisor's Concern:** Does the OCR for crumpled invoices rely on multimodal LLMs or a pre-trained deterministic extraction architecture?

**Reflection & Strategy:**
Food Cost software lives or dies by OCR reliability. 
*   **The Best Technical Answer: A Hybrid / Fallback Architecture.**
*   **The Narrative:** "We use a hybrid approach. Relying purely on multimodal LLMs is too risky for exact accounting because of hallucinations. Conversely, legacy deterministic template mapping fails on crumpled, uniquely formatted local supplier invoices. 
    Our pipeline uses a **Deterministic OCR engine** (like AWS Textract or Document AI) to flawlessly extract the raw text blocks and spatial bounding boxes. We then pass that structured text to an **LLM strictly constrained to output JSON** to map the semantic meaning (e.g., 'This line is tomatoes, quantity 5, price $20'). This gives us the flexibility of AI with the mathematical reliability of deterministic extraction."
