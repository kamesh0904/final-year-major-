export type FeedbackQuestion = {
  id: string;
  text: string;
  type: "rating" | "yesno"; // Simple types for quick answering
};

export const GAME_QUESTIONS: Record<string, FeedbackQuestion[]> = {
  // --- ADHD GAMES ---
  "/game": [ // Chromatic Rush
    { id: "focus", text: "Did you find it hard to maintain focus as the speed increased?", type: "rating" },
    { id: "frustration", text: "Did you feel frustrated when you missed a color?", type: "yesno" },
  ],
  "/impulse-guard": [ // Impulse Guard
    { id: "urge", text: "Did you feel a physical urge to tap even on Red signals?", type: "rating" },
    { id: "patience", text: "Was waiting for the Green signal difficult?", type: "yesno" },
  ],

  // --- OCD GAMES ---
  "/pattern-release": [ // Pattern Release
    { id: "anxiety", text: "How much anxiety did you feel leaving the tiles imperfect?", type: "rating" },
    { id: "urge_fix", text: "Did you try to 'fix' the tiles mentally after clicking done?", type: "yesno" },
  ],
  "/order-shift": [ // Order Shift
    { id: "adaptation", text: "How quickly did you realize the rule had changed?", type: "rating" },
    { id: "stress", text: "Did the rule change cause you stress?", type: "yesno" },
  ],

  // --- ANXIETY GAMES ---
  "/breath-sync": [ // Breath Sync
    { id: "calm", text: "Do you feel calmer now compared to before the session?", type: "rating" },
    { id: "pace", text: "Was the breathing pace too fast for you?", type: "yesno" },
  ],
  "/calm-path": [ // Calm Path
    { id: "racing_thoughts", text: "Did tracing the line help slow down your thoughts?", type: "rating" },
    { id: "tension", text: "Did you notice any physical tension releasing?", type: "yesno" },
  ],

  // --- DEPRESSION GAMES ---
  "/light-builder": [ // Light Builder
    { id: "satisfaction", text: "Did seeing the lights turn on give you a sense of satisfaction?", type: "rating" },
    { id: "effort", text: "Did completing this feel like 'too much work' today?", type: "yesno" },
  ],
  "/momentum-steps": [ // Momentum Steps
    { id: "motivation", text: "Do you feel ready to take on a real-world task now?", type: "rating" },
    { id: "overwhelm", text: "Did the number of steps feel overwhelming?", type: "yesno" },
  ],

  // --- ASD GAMES ---
  "/sensory-flow": [ // Sensory Flow
    { id: "overload", text: "Did the colors or movements feel overwhelming at any point?", type: "yesno" },
    { id: "relaxation", text: "How relaxed did you feel while watching the shapes?", type: "rating" },
  ],
  "/emotion-match": [ // Emotion Match
    { id: "recognition", text: "Did you find it easy to identify the emotions?", type: "rating" },
    { id: "confusion", text: "Were any of the facial expressions confusing?", type: "yesno" },
  ],
};