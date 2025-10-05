# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
[Describe the main user journey in plain language]

### Acceptance Scenarios
1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases
- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*
- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*
- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

---

## Non-Functional Requirements *(include applicable subsections; remove entirely if not relevant)*

### Accessibility & Inclusion *(mandatory for any UI impact)*
- Affected UI surfaces: [list or NEEDS CLARIFICATION]
- High-level impacts (focus order, keyboard, semantics, contrast, error messaging): [summary]
- Assistive tech considerations (screen reader announcements, landmark usage): [summary]
- Internationalization / localization concerns: [if any or remove]

### Security & Supply Chain *(mandatory)*
- Data sensitivity classification: [e.g., public / internal / confidential / regulated]
- AuthN/AuthZ touch points: [high-level; no implementation detail]
- Threat / abuse scenarios considered: [bullets]
- Secrets involved: [list categories only; HOW omitted]
- Third-party / dependency introduction: [list or NONE]
- License / compliance concerns: [if any]
- Open questions: [NEEDS CLARIFICATION markers]

### Observability *(mandatory if user journey or reliability impact)*
- Key user journey success events: [list]
- Key failure events: [list]
- Metrics (counters, timers, gauges): [list names only]
- Log categories (structure-level): [list]
- Tracing spans (if applicable): [list high-level]

### Performance & Scale *(include if performance claims or constraints)*
- Target throughput: [value or NEEDS CLARIFICATION]
- Latency objectives (e.g., p95): [value]
- Resource constraints (memory / storage / CPU): [value]
- Concurrency considerations: [summary]

### Data / Privacy / Retention *(mandatory if storing/modifying user or behavioral data)*
- Data created / mutated: [list]
- Retention period: [value or NEEDS CLARIFICATION]
- Deletion / purge triggers: [conditions]
- PII categories involved: [list or NONE]
- Compliance considerations (GDPR/CCPA/etc): [summary]

### Assumptions & Out of Scope *(mandatory)*
- Assumptions: [bullets]
- Explicitly out of scope: [bullets]

*Use [NEEDS CLARIFICATION: ...] inside any subsection where information is missing. Do NOT add implementation plans (leave for later phases).*

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Non-Functional Coverage
- [ ] Accessibility impacts enumerated OR explicitly no UI surfaces
- [ ] Security classification & threat scenarios documented
- [ ] Observability events, metrics, and log categories defined where journey/reliability impacted
- [ ] Performance targets stated OR deferred with [NEEDS CLARIFICATION]
- [ ] Data retention & deletion rules stated if data created/modified
- [ ] Assumptions & Out of Scope section present
- [ ] Non-functional subsections included/removed appropriately (no empty headers)

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
