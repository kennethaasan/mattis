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

## Principles & Mandatory Gates (Cross-Feature) (Constitution v1.1.0)
| Principle | MUST Gates | SHOULD Gates |
|-----------|------------|--------------|
| Accessibility | Identify affected UI surfaces; baseline keyboard + landmark checks; a11y test scaffolding before core impl; role/label based E2E assertions planned | Contrast review; assistive tech announcement notes; visual regression plan |
| Security & Supply Chain | Data classification; SAST baseline (no High/Critical unresolved); dependency & license audit; secret scan; actions pinned; no hardcoded secrets; transitive vuln mitigation path | Threat modeling notes; artifact/image signing pilot; OIDC creds plan; periodic automated re-audit |
| CI/CD Integrity & Reliability | Job timeouts enumerated; least-privilege GITHUB_TOKEN plan; concurrency group for deploys; immutable artifact reuse defined; gating sequence listed (lint→tests→SAST→deps/secret→a11y) | Provenance/SBOM exploration; artifact signing enforcement escalation path |
| Observability | Success & failure events; minimal metrics & log categories before implementation; correlation id propagation noted | Trace span design; dashboard stub; alert thresholds draft |
| Performance & Scale | Latency/throughput targets or NEEDS CLARIFICATION; performance-sensitive paths identified | Perf budget test harness; progressive optimization roadmap |
| Data & Retention | Created/modified data enumerated; retention & deletion rules or clarification markers | Privacy review checklist linkage; data minimization opportunities |
| Assumptions & Scope | Assumptions and explicit Out-of-Scope enumerated | Risk register linkage |

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
