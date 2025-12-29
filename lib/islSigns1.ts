
import { ISLGloss, ISLSign, PALM_ORIENTATIONS, SIGNING_SPACE_SCALE } from "./islCore"

export const SIGNS_PART_1: Partial<Record<ISLGloss, ISLSign>> = {
    // 1. HELLO
    // 1. HELLO (Salute)
    // 1. HELLO (Salute)
    HELLO: {
        gloss: "HELLO",
        rightTarget: { x: -0.55 * SIGNING_SPACE_SCALE, y: 1.35 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Touch Forehead (Z-tuned)
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 1.0 }, // Thumb tucked
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 2. GOODBYE
    // 2. GOODBYE (Wave)
    GOODBYE: {
        gloss: "GOODBYE",
        rightTarget: { x: 0.4 * SIGNING_SPACE_SCALE, y: 1.2 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 3. PLEASE (Rub Chest)
    PLEASE: {
        gloss: "PLEASE",
        rightTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 }, // Flat hand
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 4. THANK_YOU (Chin to Forward)
    THANK_YOU: {
        gloss: "THANK_YOU",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE }, // Touch Chin
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 5. SORRY (Fist Circle Chest)
    // 5. SORRY (Fist Circle Chest)
    SORRY: {
        gloss: "SORRY",
        rightTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.2 }, // A-Hand (Fist with thumb side up)
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 6. GOOD (Chin to Hand)
    GOOD: {
        gloss: "GOOD",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE }, // Touch Chin
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Left hand support
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 7. BAD (Chin to Down)
    BAD: {
        gloss: "BAD",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE }, // Touch Chin
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 8. YES
    // 8. YES (Nodding Fist)
    // 8. YES (Nodding Fist)
    YES: {
        gloss: "YES",
        rightTarget: { x: 0.3 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // S-hand (Thumb crosses fingers)
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 9. NO (Pinch)
    NO: {
        gloss: "NO",
        rightTarget: { x: 0.3 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.1, middle: 0.1, ring: 1, pinky: 1, thumb: 0.1 }, // Contact
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD_DOWN,
    },
    // 10. I_ME (Point to Self)
    I_ME: {
        gloss: "I_ME",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.18 * SIGNING_SPACE_SCALE }, // Touch Sternum
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 11. YOU (Point Forward)
    YOU: {
        gloss: "YOU",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 1.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 12. HE_SHE_IT
    HE_SHE_IT: {
        gloss: "HE_SHE_IT",
        rightTarget: { x: 0.4 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 1.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 13. WE_US
    // 13. WE_US (Index Circle R->L)
    WE_US: {
        gloss: "WE_US",
        rightTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE }, // End on Left
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 14. THEY_THEM (Index Arc Side)
    THEY_THEM: {
        gloss: "THEY_THEM",
        rightTarget: { x: 0.45 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 1.0 * SIGNING_SPACE_SCALE }, // Sweep Right
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 15. MY_MINE
    // 15. MY_MINE (Palm on Chest)
    MY_MINE: {
        gloss: "MY_MINE",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.18 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 16. YOUR_YOURS
    YOUR_YOURS: {
        gloss: "YOUR_YOURS",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 1.4 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    // 17. WHO
    // 17. WHO (Index Circle Mouth)
    WHO: {
        gloss: "WHO",
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Near Mouth
        rightFingers: { index: 0.2, middle: 1, ring: 1, pinky: 1, thumb: 1 }, // Hooked Index
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 18. WHAT (Open Shake)
    WHAT: {
        gloss: "WHAT",
        rightTarget: { x: 0.3 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftTarget: { x: -0.3 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 19. WHERE (Index Shake)
    WHERE: {
        gloss: "WHERE",
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD,
    },
    // 20. WHEN (Index Circle)
    WHEN: {
        gloss: "WHEN",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.85 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE }, // Circle
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 21. WHY (Y-hand Temple)
    WHY: {
        gloss: "WHY",
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 1.35 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Temple Touch
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0 }, // Y-Hand
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 22. HOW (Bent Hands Roll)
    HOW: {
        gloss: "HOW",
        rightTarget: { x: 0.12 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftTarget: { x: -0.12 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.3 }, // Bent
        leftFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 23. HAPPY
    // 23. HAPPY (Brush Chest Up)
    HAPPY: {
        gloss: "HAPPY",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.9 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.9 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 24. SAD (Drag Face Down)
    SAD: {
        gloss: "SAD",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.4 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.4 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.2 },
        rightFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 25. ANGRY
    // 25. ANGRY (Claw Face)
    ANGRY: {
        gloss: "ANGRY",
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Near Face
        rightFingers: { index: 0.7, middle: 0.7, ring: 0.7, pinky: 0.7, thumb: 0.7 }, // Claw shape
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 26. TIRED (Hands Drop Chest)
    TIRED: {
        gloss: "TIRED",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE }, // Body contact
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3, thumb: 0.2 },
        rightFingers: { index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 27. SICK (Head and Stomach)
    SICK: {
        gloss: "SICK",
        rightTarget: { x: -0.55 * SIGNING_SPACE_SCALE, y: 1.35 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Forehead
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Stomach
        rightFingers: { index: 0, middle: 0, ring: 1, pinky: 1, thumb: 0.3 }, // Middle finger open
        leftFingers: { index: 0, middle: 0, ring: 1, pinky: 1, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 28. HURT (Index Twist)
    HURT: {
        gloss: "HURT",
        leftTarget: { x: -0.05 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.05 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 29. SCARED (Shake Chest)
    SCARED: {
        gloss: "SCARED",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.75 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.75 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.1 }, // Spread
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.1 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 30. EXCITED
    EXCITED: {
        gloss: "EXCITED",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.1, middle: 0, ring: 0.1, pinky: 0.1, thumb: 0.2 }, // Middle finger contact intent
        rightFingers: { index: 0.1, middle: 0, ring: 0.1, pinky: 0.1, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 31. BORED
    BORED: {
        gloss: "BORED",
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 1.05 * SIGNING_SPACE_SCALE, z: 0.18 * SIGNING_SPACE_SCALE }, // Side of nose
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE_IN,
    },
    // 32. HUNGRY (C-Hand Slide)
    HUNGRY: {
        gloss: "HUNGRY",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.75 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Sternum slide
        rightFingers: { index: 0.3, middle: 0.4, ring: 0.5, pinky: 0.6, thumb: 0.3 }, // C shape
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 33. THIRSTY (Index Slide)
    THIRSTY: {
        gloss: "THIRSTY",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.95 * SIGNING_SPACE_SCALE, z: 0.22 * SIGNING_SPACE_SCALE }, // Throat slide
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 34. LOVE
    // 34. LOVE (Cross Chest)
    LOVE: {
        gloss: "LOVE",
        leftTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE }, // Cross to Right
        rightTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE }, // Cross to Left
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // Fist
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 35. EAT
    // 35. EAT (Squashed O to Mouth)
    // 35. EAT (Squashed O to Mouth)
    EAT: {
        gloss: "EAT",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.28 * SIGNING_SPACE_SCALE }, // Tuned Z
        rightFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.1 }, // Squashed O
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 36. DRINK (C-hand to Mouth)
    DRINK: {
        gloss: "DRINK",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.5, middle: 0.6, ring: 0.7, pinky: 0.8, thumb: 0.3 }, // C-Shape
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE_IN,
    },
    // 37. SLEEP (Hand over face)
    SLEEP: {
        gloss: "SLEEP",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.25 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.2, middle: 0.2, ring: 0.2, pinky: 0.2, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 38. WAKE_UP
    WAKE_UP: {
        gloss: "WAKE_UP",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.5 * SIGNING_SPACE_SCALE }, // Near eyes
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.5 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.7, middle: 1, ring: 1, pinky: 1, thumb: 0.4 }, // Pinch? No, open eyes. L shape.
        rightFingers: { index: 0.7, middle: 1, ring: 1, pinky: 1, thumb: 0.4 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 39. GO
    // 40. COME (Beckon)
    COME: {
        gloss: "COME",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.5, middle: 1, ring: 1, pinky: 1, thumb: 1 }, // Beckon
        rightFingers: { index: 0.5, middle: 1, ring: 1, pinky: 1, thumb: 1 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 41. WALK
    WALK: {
        gloss: "WALK",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 1, thumb: 1 }, // 3-hand?? No, description says 3-hand: index, middle, thumb.
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 1, thumb: 1 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 42. RUN (L-Hand Hook)
    RUN: {
        gloss: "RUN",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.4, middle: 1, ring: 1, pinky: 1, thumb: 0.2 }, // L shape hooked?
        rightFingers: { index: 0.4, middle: 1, ring: 1, pinky: 1, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_FORWARD_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD_DOWN,
    },
    // 39. GO (Throw)
    GO: {
        gloss: "GO",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 1.2 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 1.2 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_SIDE,
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 43. HELP
    // 43. HELP (Fist on Palm)
    // 43. HELP (Fist on Palm)
    HELP: {
        gloss: "HELP",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE }, // Raised 0.1 to sit ON palm
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 }, // Flat palm up
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.2 }, // A-Hand
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 44. STOP (Chop on Palm)
    // 44. STOP (Chop on Palm)
    STOP: {
        gloss: "STOP",
        leftTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE }, // Raised to hit palm
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 }, // Flat palm up
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 }, // Chop
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 45. WAIT
    WAIT: {
        gloss: "WAIT",
        leftTarget: { x: -0.22 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.85 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.22 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.85 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.2 },
        rightFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 46. FINISH (F-Hand Flick)
    FINISH: {
        gloss: "FINISH",
        leftTarget: { x: -0.25 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.9 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.9 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0 }, // 5-Hand
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0 },
        leftPalm: PALM_ORIENTATIONS.PALM_OUT,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    // 47. WANT
    // 47. WANT (Claw Pull)
    WANT: {
        gloss: "WANT",
        leftTarget: { x: -0.25 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.6, middle: 0.6, ring: 0.6, pinky: 0.6, thumb: 0.4 }, // Claw
        rightFingers: { index: 0.6, middle: 0.6, ring: 0.6, pinky: 0.6, thumb: 0.4 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 48. NEED (X-Hand)
    NEED: {
        gloss: "NEED",
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.9 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.7, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // Hooked Index
        rightPalm: PALM_ORIENTATIONS.PALM_FORWARD_DOWN,
    },
    // 49. LIKE (Pull Chest)
    LIKE: {
        gloss: "LIKE",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE }, // Pulling
        rightFingers: { index: 0.1, middle: 0.6, ring: 0.8, pinky: 0.8, thumb: 0.1 }, // 8-hand
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 50. DONT_LIKE (Throw away)
    DONT_LIKE: {
        gloss: "DONT_LIKE",
        rightTarget: { x: 0.4 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, thumb: 0.1 },
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    }
}
