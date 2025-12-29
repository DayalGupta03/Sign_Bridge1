# Kiro System Architecture: SignBridge 3D

## Overview
This document defines the authoritative system architecture for SignBridge 3D as enforced by Kiro. The architecture is designed to guarantee privacy, safety, and clarity in all Deaf↔Hearing medical communication. It governs the flow of data, the boundaries of each subsystem, and the explicit constraints that ensure the system is robust, auditable, and extensible.

## System Topology Narrative
SignBridge 3D is a modular, layered system. The frontend (Next.js/React) owns all user interaction, state, and rendering. Input is captured via browser-native APIs (Web Speech API for STT, MediaPipe Hands for sign recognition). All raw input is routed through the AI Mediation Layer, which is the only permitted path for transforming user data into output. Output is delivered via subtitles, browser-native TTS, and a 2D animated avatar. No component may bypass the mediation layer or access raw input/output directly.

## Pipeline Ownership Rules
- Input capture (speech, video) is owned by the Application Interface component.
- The AI Mediation Layer is the sole owner of all transformation logic between input and output.
- Output rendering (subtitles, TTS, avatar) is strictly isolated from input and mediation logic.
- No cross-layer state mutation is permitted; all state transitions are explicit and auditable.

## Renderer Isolation Guarantees
- The avatar renderer is strictly 2D in MVP and is isolated from all input and mediation logic except for status and output text.
- No renderer may access raw video, audio, or gesture data.
- All animation is driven by explicit status changes and output events only.

## Mediation Layer Contract
- All user-facing output must be mediated by the AI layer.
- The mediation contract enforces: context awareness, brevity (≤20 words), professional tone, and strict prohibition of medical advice or hallucinations.
- The mediation layer is stateless with respect to user identity and does not persist or log any user data.

## Forbidden Architectural Patterns
- No direct connection between input and output layers (bypassing mediation) is permitted.
- No 3D avatar, inverse kinematics, or external animation libraries in MVP.
- No persistent storage or transmission of raw video/audio/gesture data.
- No analytics, tracking, or user profiling at any layer.

## Failure Handling Philosophy
- All input/output failures must degrade gracefully: e.g., if STT or TTS is unavailable, the system must fall back to subtitles only.
- Mediation layer failures (e.g., LLM API timeout) must result in clear, safe fallback messaging, never in raw or unmediated output.
- All error states are surfaced to the user in a non-intrusive, professional manner.

## References
- ARCHITECTURE.md (system diagrams, component hierarchy)
- MEDIATION_LAYER.md (mediation contract, API, constraints)
- AVATAR_EMBODIMENT.md (renderer isolation, animation)
- CODE_WALKTHROUGH.md (pipeline implementation)

## Status / Notes
- Last updated: December 30, 2025
- This architecture is enforced by all Kiro agents and is the single source of truth for system boundaries and constraints.
