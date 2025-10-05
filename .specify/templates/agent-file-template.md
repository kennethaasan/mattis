# [PROJECT NAME] Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies
[EXTRACTED FROM ALL PLAN.MD FILES]

## Project Structure
```
[ACTUAL STRUCTURE FROM PLANS]
```

## Commands
[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

## Code Style
[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

## Recent Changes
[LAST 3 FEATURES AND WHAT THEY ADDED]

## Principles & Mandatory Gates (Cross-Feature)
| Principle | MUST Gates | SHOULD Gates |
|-----------|------------|--------------|
| Accessibility | Identify affected UI surfaces; baseline keyboard + landmark checks; add a11y test scaffolding before core impl | Contrast review, assistive tech announcement notes |
| Security & Supply Chain | Data classification; SAST baseline; dependency & license audit; secret scan; actions pinned | Threat modeling notes; periodic re-audit automation |
| Observability | Define success/failure events; minimal metrics list before implementation | Trace span design; dashboard stub |
| Performance & Scale | State latency/throughput targets or mark NEEDS CLARIFICATION | Add perf budget test harness |
| Data & Retention | List created/modified data; retention & deletion rules | Privacy review checklist linkage |
| Assumptions & Scope | Assumptions and explicit Out-of-Scope enumerated | Risk register linkage |

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
