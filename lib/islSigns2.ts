
import { ISLGloss, ISLSign, PALM_ORIENTATIONS, SIGNING_SPACE_SCALE } from "./islCore"

export const SIGNS_PART_2: Partial<Record<ISLGloss, ISLSign>> = {
    // 51. HAVE
    HAVE: {
        gloss: "HAVE",
        leftTarget: { x: 0.5 * SIGNING_SPACE_SCALE, y: 0.58 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.5 * SIGNING_SPACE_SCALE, y: 0.58 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 52. GET
    GET: {
        gloss: "GET",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.5 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.5 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8, thumb: 0.7 },
        rightFingers: { index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP, // Start open, end closed. Maybe represent the closed state?
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 53. GIVE
    GIVE: {
        gloss: "GIVE",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 1.1 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 1.1 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, thumb: 0.4 },
        rightFingers: { index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, thumb: 0.4 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 54. TAKE
    TAKE: {
        gloss: "TAKE",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9, thumb: 0.8 },
        rightFingers: { index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 55. SHOW
    SHOW: {
        gloss: "SHOW",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 }, // Palm up
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 }, // Index on palm
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 56. LOOK
    LOOK: {
        gloss: "LOOK",
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.85 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 1, pinky: 1, thumb: 0.8 },
        rightPalm: PALM_ORIENTATIONS.PALM_ANGLED_IN,
    },
    // 57. WATCH
    WATCH: {
        gloss: "WATCH",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 1.0 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.3, middle: 0.3, ring: 1, pinky: 1, thumb: 0.8 }, // Bent V
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    // 58. LISTEN
    LISTEN: {
        gloss: "LISTEN",
        rightTarget: { x: 0.32 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.0 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.3 },
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 59. UNDERSTAND
    // 59. UNDERSTAND (1-hand flick near forehead)
    UNDERSTAND: {
        gloss: "UNDERSTAND",
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 1.35 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE }, // Near Temple
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 1 }, // Index Up (1-hand)
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 60. DONT_UNDERSTAND
    DONT_UNDERSTAND: {
        gloss: "DONT_UNDERSTAND",
        rightTarget: { x: 0.25 * SIGNING_SPACE_SCALE, y: 1.25 * SIGNING_SPACE_SCALE, z: 0.1 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 }, // Same as UNDERSTAND + head shake (not animated here)
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 61. WORK
    WORK: {
        gloss: "WORK",
        leftTarget: { x: -0.08 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE }, // Tapping top
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 62. SCHOOL
    SCHOOL: {
        gloss: "SCHOOL",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE }, // Clap
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_FACING,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 63. LEARN
    LEARN: {
        gloss: "LEARN",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.2 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.7, middle: 0.7, ring: 0.7, pinky: 0.7, thumb: 0.6 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 64. TEACH
    TEACH: {
        gloss: "TEACH",
        leftTarget: { x: 0.6 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.7, middle: 0.7, ring: 0.7, pinky: 0.7, thumb: 0.6 },
        rightFingers: { index: 0.7, middle: 0.7, ring: 0.7, pinky: 0.7, thumb: 0.6 },
        leftPalm: PALM_ORIENTATIONS.PALM_OUT,
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    // 64B. THINK (New)
    THINK: {
        gloss: "THINK",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.25 * SIGNING_SPACE_SCALE, z: 0.15 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 64C. KNOW (New)
    KNOW: {
        gloss: "KNOW",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.3 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.2 },
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 65. READ
    READ: {
        gloss: "READ",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.05 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 1, pinky: 1, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 66. WRITE
    WRITE: {
        gloss: "WRITE",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.05 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.65 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0.9, middle: 1, ring: 1, pinky: 1, thumb: 0.6 }, // Pinched like pen
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 67. DRIVE
    DRIVE: {
        gloss: "DRIVE",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 0.5 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_FACING,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 68. PLAY
    PLAY: {
        gloss: "PLAY",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 }, // Y shape
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_FACING,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 69. LAUGH
    LAUGH: {
        gloss: "LAUGH",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 1.05 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 1.05 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 70. CRY
    CRY: {
        gloss: "CRY",
        leftTarget: { x: 0.4 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.4 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 71. SLEEP_POSE
    SLEEP_POSE: {
        gloss: "SLEEP_POSE",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.2 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 }, // Flat hand on cheek
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 72. WATER
    // 72. WATER (W-hand on Chin)
    WATER: {
        gloss: "WATER",
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.25 * SIGNING_SPACE_SCALE }, // Tap Chin
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 1, thumb: 1 }, // W-Hand (Index/Middle/Ring Up)
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE_IN,
    },
    // 73. FOOD
    FOOD: {
        gloss: "FOOD",
        rightTarget: { x: -0.5 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.35 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.6, middle: 0.6, ring: 0.6, pinky: 0.6, thumb: 0.6 },
        rightPalm: PALM_ORIENTATIONS.PALM_TO_FACE,
    },
    // 74. MILK
    MILK: {
        gloss: "MILK",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // Squeeze
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 75. COFFEE
    COFFEE: {
        gloss: "COFFEE",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE }, // Grinding
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_SIDE,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 76. TEA
    TEA: {
        gloss: "TEA",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE }, // Cup
        rightTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE }, // Dip
        leftFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.5 }, // O shape
        rightFingers: { index: 0.9, middle: 1, ring: 1, pinky: 1, thumb: 0.6 }, // Pinched
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 77. APPLE
    APPLE: {
        gloss: "APPLE",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE }, // Cheek
        rightFingers: { index: 0.6, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // X hand
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 78. BREAD
    BREAD: {
        gloss: "BREAD",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Loaf
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.55 * SIGNING_SPACE_SCALE }, // Slicing
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0.2, middle: 0.2, ring: 0.2, pinky: 0.2, thumb: 0.4 },
        leftPalm: PALM_ORIENTATIONS.PALM_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 79. PIZZA
    PIZZA: {
        gloss: "PIZZA",
        rightTarget: { x: -0.3 * SIGNING_SPACE_SCALE, y: 1.15 * SIGNING_SPACE_SCALE, z: 0.35 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.3, middle: 0.3, ring: 1, pinky: 1, thumb: 0.6 }, // Bent V/slice
        rightPalm: PALM_ORIENTATIONS.PALM_TO_FACE,
    },
    // 80. HOME
    HOME: {
        gloss: "HOME",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE }, // Cheek
        rightFingers: { index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9, thumb: 0.9 }, // Flat O
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 81. HOUSE
    HOUSE: {
        gloss: "HOUSE",
        leftTarget: { x: -0.15 * SIGNING_SPACE_SCALE, y: 1.3 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.15 * SIGNING_SPACE_SCALE, y: 1.3 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_ANGLED_IN,
        rightPalm: PALM_ORIENTATIONS.PALM_ANGLED_IN,
    },
    // 82. SCHOOL_PLACE (Same as SCHOOL)
    SCHOOL_PLACE: {
        gloss: "SCHOOL_PLACE",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_FACING,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 83. BATHROOM
    BATHROOM: {
        gloss: "BATHROOM",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.5, middle: 0.5, ring: 1, pinky: 1, thumb: 0 }, // T hand: thumb tucked under index? Index over thumb.
        // T-hand: Thumb between index and middle.
        // We can approximate by curling index strongly.
        rightPalm: PALM_ORIENTATIONS.PALM_OUT,
    },
    // 84. STORE
    STORE: {
        gloss: "STORE",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8, thumb: 0.8 }, // Flattened O
        rightFingers: { index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8, thumb: 0.8 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 85. RESTAURANT
    RESTAURANT: {
        gloss: "RESTAURANT",
        rightTarget: { x: 0.05 * SIGNING_SPACE_SCALE, y: 1.1 * SIGNING_SPACE_SCALE, z: 0.3 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 0.1, middle: 0.1, ring: 1, pinky: 1, thumb: 0.7 }, // R hand: Index/Middle crossed. Hard to simulate.
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 86. HOSPITAL
    HOSPITAL: {
        gloss: "HOSPITAL",
        rightTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 1.2 * SIGNING_SPACE_SCALE, z: 0.4 * SIGNING_SPACE_SCALE }, // Shoulder
        rightFingers: { index: 0, middle: 0, ring: 1, pinky: 1, thumb: 0.7 }, // H hand
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 87. CHURCH
    CHURCH: {
        gloss: "CHURCH",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0.8 }, // Fist
        rightFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.4 }, // C hand
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 88. CITY
    CITY: {
        gloss: "CITY",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_FACING,
        rightPalm: PALM_ORIENTATIONS.PALM_FACING,
    },
    // 89. PARK
    PARK: {
        gloss: "PARK",
        leftTarget: { x: -0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.9 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.9 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 90. NOW
    NOW: {
        gloss: "NOW",
        leftTarget: { x: -0.18 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.18 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 }, // Y hand
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 91. TODAY
    TODAY: {
        gloss: "TODAY",
        leftTarget: { x: -0.18 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.18 * SIGNING_SPACE_SCALE, y: 0.55 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 0, thumb: 0.2 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_UP,
    },
    // 92. YESTERDAY
    YESTERDAY: {
        gloss: "YESTERDAY",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.05 * SIGNING_SPACE_SCALE, z: 0.0 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0 },
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 93. TOMORROW
    TOMORROW: {
        gloss: "TOMORROW",
        rightTarget: { x: -0.6 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightFingers: { index: 1, middle: 1, ring: 1, pinky: 1, thumb: 0 },
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 94. MORNING
    MORNING: {
        gloss: "MORNING",
        leftTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Horizon arm?
        rightTarget: { x: 0.1 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Rising
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 }, // Flat
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 95. AFTERNOON
    AFTERNOON: {
        gloss: "AFTERNOON",
        leftTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.9 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 96. NIGHT
    NIGHT: {
        gloss: "NIGHT",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.7 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Hand over hand
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0.4, middle: 0.4, ring: 0.4, pinky: 0.4, thumb: 0.3 }, // Bent
        leftPalm: PALM_ORIENTATIONS.PALM_DOWN,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 97. WEEK
    WEEK: {
        gloss: "WEEK",
        leftTarget: { x: 0.0 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE }, // Slide
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    },
    // 98. MONTH
    MONTH: {
        gloss: "MONTH",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.8 * SIGNING_SPACE_SCALE, z: 0.6 * SIGNING_SPACE_SCALE }, // Down
        leftFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        leftPalm: PALM_ORIENTATIONS.PALM_SIDE,
        rightPalm: PALM_ORIENTATIONS.PALM_IN,
    },
    // 99. AGAIN
    AGAIN: {
        gloss: "AGAIN",
        leftTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.6 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        rightTarget: { x: -0.1 * SIGNING_SPACE_SCALE, y: 0.65 * SIGNING_SPACE_SCALE, z: 0.7 * SIGNING_SPACE_SCALE },
        leftFingers: { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0.3 },
        rightFingers: { index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3, thumb: 0.3 }, // Bent
        leftPalm: PALM_ORIENTATIONS.PALM_UP,
        rightPalm: PALM_ORIENTATIONS.PALM_DOWN,
    },
    // 100. ALWAYS
    ALWAYS: {
        gloss: "ALWAYS",
        rightTarget: { x: 0.2 * SIGNING_SPACE_SCALE, y: 1.0 * SIGNING_SPACE_SCALE, z: 0.8 * SIGNING_SPACE_SCALE }, // Circle
        rightFingers: { index: 0, middle: 1, ring: 1, pinky: 1, thumb: 0.7 },
        rightPalm: PALM_ORIENTATIONS.PALM_SIDE,
    }
}
