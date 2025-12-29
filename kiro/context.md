

# Kiro Project Context: SignBridge 3D

## Problem Statement
Medical communication between Deaf and Hearing individuals is fraught with barriers, especially in urgent or sensitive healthcare settings. Traditional solutions—such as human interpreters—are not always available, introduce privacy risks, and can delay care. SignBridge 3D exists to provide a real-time, AI-mediated bridge that ensures both accessibility and medical safety, eliminating the need for external interpreters and reducing the risk of miscommunication.

## Why AI Mediation is Mandatory
All communication in SignBridge 3D is routed through a context-aware AI mediation layer. This is not optional: it is a system-level guarantee that ensures every utterance or gesture is:
- Interpreted in the correct medical context (hospital or emergency)
- Constrained to professional, non-diagnostic, non-hallucinatory language
- Limited to ≤20 words for clarity and safety
- Free from technical jargon, meta-commentary, or unverified information
This mediation is enforced for both Deaf→Hearing and Hearing→Deaf flows, and is the only permitted path for user-facing output.

## Privacy Model
SignBridge 3D is architected for privacy by design. All sign recognition and speech processing occurs locally in the user’s browser. No video, audio, or gesture data is ever uploaded, stored, or transmitted to external servers. The only data that leaves the device is the minimal, mediated text required for LLM processing, and only when strictly necessary. This model is non-negotiable and is enforced at both the architectural and agent levels.

## Why Browser-Native APIs Were Chosen
Browser-native APIs (Web Speech API for STT, MediaPipe Hands for sign recognition, Web Speech Synthesis for TTS) were selected for their:
- Proven reliability and cross-platform support
- Ability to run entirely client-side, supporting the privacy model
- Elimination of external dependencies, API keys, or cloud services for core flows
- Seamless integration with modern frontend frameworks (Next.js, React)
This approach ensures that SignBridge 3D can be deployed in sensitive environments without risk of data leakage or compliance violations.

## Explicit Non-Goals
- No 3D avatar or inverse kinematics in MVP (upgrade path defined, not implemented)
- No medical advice, diagnosis, or treatment recommendations
- No persistent storage of user data, video, or audio
- No support for non-medical or non-institutional use cases in MVP
- No analytics, tracking, or user profiling

## Responsibilities / Purpose
- Define the project’s mission, scope, and boundaries for all Kiro-managed activities
- Anchor all orchestration, enforcement, and audit records to a single, canonical context
- Ensure all agents, tasks, and decisions align with the medical safety and privacy requirements

## How It Works / Key Details
- All communication flows are mediated by an LLM layer enforcing context, brevity, and safety
- Deaf↔Hearing translation is achieved via browser-native STT, sign recognition, and TTS
- No user video/audio is uploaded; all sign recognition is local for privacy
- The context file is referenced by all Kiro agents and tasks for alignment
- For full system and pipeline details, see canonical documentation below

## Design Constraints / Guarantees
- No deviation from medical privacy and safety standards
- No feature or agent may operate outside the defined MVP scope
- All references must point to canonical documentation, not duplicate it

## References
- ARCHITECTURE.md
- PROJECT_EXPLANATION.md
- MVP_STATUS.md
- README.md

## Status / Notes
- Last updated: December 30, 2025
- Aligned with SignBridge 3D MVP (Phase 4, production-ready)
