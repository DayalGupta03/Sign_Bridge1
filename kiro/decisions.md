

# Kiro Architectural Decisions: SignBridge 3D

## Overview
This artifact records all major architectural and technical decisions for SignBridge 3D, following the Architecture Decision Record (ADR) format. Each decision is justified, referenced, and enforced by Kiro agents. No decision may be altered without explicit update to this file.

---

## ADR-01: Video-Based Avatar vs 3D IK
**Context:** The MVP required a visually engaging avatar to provide feedback during communication, but 3D inverse kinematics (IK) would introduce significant complexity, performance risk, and privacy concerns.

**Decision:** The system uses a 2D, video-based animated avatar for all user feedback. No 3D avatar, IK, or external animation libraries are permitted in MVP.

**Consequences:**
- Animation is lightweight, GPU-accelerated, and privacy-preserving
- Upgrade path to 3D/IK is documented but not implemented
- All avatar embodiment is strictly status-driven and isolated from raw input

References: AVATAR_EMBODIMENT.md, ARCHITECTURE.md

---

## ADR-02: Mandatory Mediation for All Outputs
**Context:** Medical safety and clarity require that all communication be context-aware, professional, and free from hallucinations or diagnoses. Direct output of raw speech or gesture is unacceptable.

**Decision:** All user-facing output must be routed through the AI Mediation Layer, which enforces context, brevity, and safety constraints.

**Consequences:**
- No output may bypass mediation
- All flows are auditable and context-constrained
- System is robust against unverified or unsafe output

References: MEDIATION_LAYER.md, CODE_WALKTHROUGH.md

---

## ADR-03: Local-Only Sign Recognition
**Context:** Privacy and compliance requirements prohibit the upload or storage of user video or gesture data. All sign recognition must occur in-browser.

**Decision:** MediaPipe Hands and all gesture processing are run locally in the browser. No video/audio/gesture data is ever uploaded, stored, or transmitted externally.

**Consequences:**
- System is compliant with privacy and medical data standards
- No persistent or external data risk
- All sign recognition is limited to intent-level in MVP

References: SIGN_RECOGNITION.md, ARCHITECTURE.md

---

## ADR-04: Demo Mode Isolation
**Context:** Stakeholder demonstrations require a safe, repeatable way to showcase system capabilities without affecting production logic or user data.

**Decision:** Demo mode is fully isolated from production flows, with no persistent state or data, and is invisible to the user interface when disabled.

**Consequences:**
- Demo mode can be enabled/disabled without code changes
- All demo flows use the same production pipeline and constraints
- No risk of demo artifacts leaking into real user sessions

References: DEMO_MODE.md, CODE_WALKTHROUGH.md

---

## Responsibilities / Purpose
- Document and justify all non-trivial, system-wide decisions
- Provide a single source of truth for audit and future iteration
- Ensure all decisions are traceable to real project requirements and constraints

## Design Constraints / Guarantees
- No deviation from privacy, safety, or MVP boundaries
- All future changes must reference and update this file
- No duplication of canonical documentation

## References
- MEDIATION_LAYER.md
- AVATAR_EMBODIMENT.md
- SIGN_RECOGNITION.md
- DEMO_MODE.md
- ARCHITECTURE.md
- MVP_STATUS.md

## Status / Notes
- Last updated: December 30, 2025
- All decisions current and enforced by Kiro orchestration
