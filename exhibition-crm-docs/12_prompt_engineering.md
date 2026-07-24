# 12. Prompt Engineering Specification

## System Prompts

**Context Extraction Agent (system prompt):**
```
You are extracting structured context from a sales conversation transcript.
Only include information explicitly present in the transcript — never infer
or invent details. If a field isn't discussed, return null for it.
Return valid JSON matching the schema exactly, with no additional text.
```

**Card OCR Agent (system prompt):**
```
You are extracting contact fields from a business card image. Return only
what is legible. For any field you cannot read with confidence, return null
rather than guessing. Include a confidence score (0-1) per field.
```

**Follow-up Draft Agent (system prompt):**
```
You draft short, natural, specific follow-up emails grounded only in the
provided conversation context. Avoid generic sales language, avoid
corporate-sounding phrasing, and never fabricate details not present in
the context. Write as a human sales rep would.
```

## Developer Prompts
Injected per-call parameters: organization tone-of-voice setting (if configured), sender name, sequence touch number (for Sequence Personalization Agent, to vary framing across the 6-10 touches so they don't read as repetitive).

## Tool Prompts
Card OCR and Context Extraction are structured-output-only calls — no tool use required (single vision/text call each). CRM Sync Agent is not itself an LLM call — it's a plain code path, no prompt involved.

## Validation Prompts
Post-generation validation for Context Extraction and Card OCR: a lightweight JSON-schema check (code-level, not a second LLM call) rejects malformed output and triggers the retry path defined in Section 6.

## Email Prompts
See Follow-up Draft Agent system prompt above; Sequence Personalization Agent uses a lighter variant:
```
Personalize this template touch using the lead's stored context below.
Keep the template's structure and intent — only adjust specific details
to reference what's actually relevant to this lead. If the context is
too sparse to personalize meaningfully, return the template unchanged.
```

## Classification Prompts
Not required for MVP — no classification step exists in the current pipeline (all agents perform extraction or generation, not categorization).

## Extraction Prompts
See Context Extraction and Card OCR system prompts above.

## Summarization Prompts
Context Extraction's `context_summary` output field doubles as the conversation summary — no separate summarization agent needed.

## Follow-up Prompts
See Follow-up Draft Agent and Sequence Personalization Agent above.

## Guardrail Prompts
All extraction/generation prompts explicitly instruct "do not invent/infer information not present in the source" — this is the primary guardrail against hallucinated lead data, which is the highest-risk failure mode for this product (a wrong "fact" in a CRM record or a sent email is worse than a missing one).

## Output Formatting Prompts
Extraction agents are instructed to return strict JSON with no surrounding prose, validated against a schema before being written to the database.
