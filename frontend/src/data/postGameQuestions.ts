// Post-game questionnaire system for weekly reports
// Questions are asked after 5+ minute game sessions, once per day per category

export interface GameMapping {
    [gameName: string]: string; // game name -> profile category
}

export interface QuestionBank {
    [category: string]: string[];
}

// Map games to their primary neurodivergent profile categories
export const GAME_TO_CATEGORY: GameMapping = {
    // ADHD & Focus Games
    "Chromatic Rush": "ADHD",
    "Impulse Guard": "ADHD",

    // Anxiety & Regulation Games
    "Nebula Breath": "Anxiety",
    "Breath Sync": "Anxiety", // Alternative name
    "Sensory Flow": "Anxiety",

    // OCD & Cognitive Flexibility Games
    "Pattern Release": "OCD",
    "Order Shift": "OCD",

    // Depression & Motivation Games
    "Lumina": "Depression",
    "Light Builder": "Depression", // Alternative name
    "Neon Rise": "Depression",
    "Momentum Steps": "Depression", // Alternative name

    // General/Mixed Games (use user's top profile)
    "Calm Path": "General",
    "Emotion Match": "General"
};

// Question bank organized by neurodivergent profile category
export const QUESTION_BANK: QuestionBank = {
    "ADHD": [
        "Did you feel fully immersed in the task?",
        "Were you able to ignore external noises?",
        "Did you stop yourself from clicking too early?",
        "Did your mind wander less than usual?",
        "Could you track the moving targets easily?",
        "Did you feel less urge to check your phone?",
        "Was it easier to restart after a mistake?",
        "Did you maintain a consistent rhythm?",
        "Did you feel mentally sharp afterwards?",
        "Were you able to filter out the wrong colors?",
        "Did the time passing feel natural?",
        "Did you feel in control of your reactions?",
        "Could you anticipate the next move clearly?",
        "Did your thoughts feel less scattered?",
        "Were you able to sit still during the session?",
        "Did you complete the level without frustration?",
        "Did you notice when your attention drifted?",
        "Were you able to snap back to focus quickly?",
        "Did the visual clutter feel manageable?",
        "Did you feel a sense of flow?",
        "Was your reaction time consistent?",
        "Did you avoid impulsive clicking?",
        "Did you feel calm despite the speed?",
        "Were you able to prioritize the right target?",
        "Did you ignore the distractors successfully?",
        "Did you feel clearer headed after playing?",
        "Was it easier to listen to instructions?",
        "Did you feel less restless physically?",
        "Did you finish the session without quitting?",
        "Were you able to predict the patterns?",
        "Did you feel a sense of completion?",
        "Did the game noise bother you less over time?",
        "Were you able to hyperfocus constructively?",
        "Did you feel less 'brain fog'?",
        "Did you hesitate less when making decisions?",
        "Did you feel proud of your high score?",
        "Was your focus steady throughout?",
        "Did you feel less overwhelmed by the speed?",
        "Did you catch yourself before making an error?",
        "Did you feel 'locked in'?",
        "Was it easier to direct your gaze?",
        "Did you feel less mental fatigue than expected?",
        "Did you manage the chaos effectively?",
        "Did you feel less need to multitask?",
        "Were your movements precise?",
        "Did you feel patient with the difficulty?",
        "Did you notice details you usually miss?",
        "Did the session fly by quickly?",
        "Did you feel ready to tackle work after?",
        "Do you feel more alert right now?"
    ],

    "Anxiety": [
        "Is your breathing slower than before?",
        "Did your shoulders drop and relax?",
        "Did the tightness in your chest fade?",
        "Are your racing thoughts slowing down?",
        "Do you feel more present in your body?",
        "Did the visual rhythm help you center?",
        "Did you stop clenching your jaw?",
        "Do you feel lighter mentally?",
        "Did the ambient sound soothe you?",
        "Are you less worried about the future?",
        "Did you feel safe during the session?",
        "Is your heart rate more steady?",
        "Did you manage to close your eyes comfortably?",
        "Do you feel a sense of spaciousness?",
        "Did you let go of the day's stress?",
        "Are your hands warmer and relaxed?",
        "Did you stop overthinking for a moment?",
        "Do you feel more grounded in the room?",
        "Did the colors help change your mood?",
        "Are you breathing from your diaphragm?",
        "Did you feel less need to control things?",
        "Did the silence feel comfortable?",
        "Do you feel more capable of handling stress?",
        "Did you visualize your worry leaving?",
        "Are you less reactive to noises?",
        "Did you feel a moment of pure peace?",
        "Is your mind quieter right now?",
        "Did you feel supported by the rhythm?",
        "Are you less focused on your problems?",
        "Did you feel a release of tension?",
        "Do you feel ready to rest?",
        "Did you stop fidgeting?",
        "Are you more aware of your breath?",
        "Did you feel a wave of calm?",
        "Are your thoughts less chaotic?",
        "Did you feel connected to the flow?",
        "Do you feel less on edge?",
        "Did you forget your to-do list?",
        "Are your muscles less stiff?",
        "Did you feel a sense of warmth?",
        "Are you judging yourself less?",
        "Did you allow yourself to just be?",
        "Do you feel more balanced emotionally?",
        "Did the panic subside?",
        "Are you breathing deeper naturally?",
        "Did you feel enveloped in calm?",
        "Do you feel less frantic?",
        "Did you find a moment of stillness?",
        "Are you ready to face the world calmly?",
        "Do you feel at ease?"
    ],

    "OCD": [
        "Did you accept the imperfect pattern?",
        "Did you resist the urge to fix it?",
        "Did the changing rules feel manageable?",
        "Did you adapt to the new color quickly?",
        "Were you able to let go of the mistake?",
        "Did you feel less need for symmetry?",
        "Did you tolerate the wrong order?",
        "Did the chaos feel okay?",
        "Did you stop counting the items?",
        "Were you able to switch strategies fast?",
        "Did you feel less stuck on details?",
        "Did you accept the 'odd one out'?",
        "Did you resist checking the score?",
        "Did you feel flexible in your thinking?",
        "Were you okay with not finishing perfectly?",
        "Did you manage the uncertainty?",
        "Did you feel less rigid mentally?",
        "Did you move on from the error quickly?",
        "Did you suppress the urge to reorganize?",
        "Did you feel comfortable with randomness?",
        "Did you trust your quick judgment?",
        "Did you handle the rule reversal well?",
        "Did you feel less compulsion to tap?",
        "Did you ignore the uneven spacing?",
        "Did you feel in control of your urge?",
        "Did you laugh at the mistake?",
        "Did you feel less pressure to be right?",
        "Did you flow with the changes?",
        "Did you stop analyzing the grid?",
        "Were you able to break your routine?",
        "Did you feel less mental friction?",
        "Did you accept the messy arrangement?",
        "Did you avoid restarting the level?",
        "Did you feel less 'stuck'?",
        "Did you handle the surprise well?",
        "Did you refrain from double-checking?",
        "Did you feel okay leaving it undone?",
        "Did you challenge your perfectionism?",
        "Did you feel freer in your choices?",
        "Did you stop seeking reassurance?",
        "Did you tolerate the asymmetry?",
        "Did you feel mentally agile?",
        "Did you embrace the disorder?",
        "Did you resist the ritual?",
        "Did you feel less mental stickiness?",
        "Did you go with the flow?",
        "Did you accept the 'good enough' result?",
        "Did you feel less trapped by rules?",
        "Did you surprise yourself with flexibility?",
        "Do you feel more open-minded?"
    ],

    "Depression": [
        "Did you feel a spark of achievement?",
        "Did the light make you feel hopeful?",
        "Did you enjoy the visual progress?",
        "Did completing the task feel good?",
        "Did you feel energetic seeing the glow?",
        "Did you want to keep going?",
        "Did the darkness lifting feel rewarding?",
        "Did you feel capable of change?",
        "Did you smile at the success?",
        "Did you feel less heavy?",
        "Did the small win matter?",
        "Did you feel a sense of purpose?",
        "Did you visualize your own growth?",
        "Did you feel motivated to try again?",
        "Did the colors brighten your mood?",
        "Did you feel less numb?",
        "Did you appreciate the beauty?",
        "Did you feel like you made an impact?",
        "Did the momentum carry you forward?",
        "Did you feel less stuck?",
        "Did you enjoy building something?",
        "Did you feel a sense of agency?",
        "Did the music lift your spirits?",
        "Did you look forward to the next step?",
        "Did you feel proud of the result?",
        "Did you feel less isolated?",
        "Did you realize you have power?",
        "Did the progress bar satisfying?",
        "Did you feel a little lighter?",
        "Did you want to do more?",
        "Did you feel connected to the goal?",
        "Did the visual feedback help?",
        "Did you feel a burst of dopamine?",
        "Did you realize small steps count?",
        "Did you feel less defeated?",
        "Did you enjoy the creation process?",
        "Did you feel active participation?",
        "Did the gloom fade a little?",
        "Did you feel ready to tackle a chore?",
        "Did you see the possibilities?",
        "Did you feel a shift in perspective?",
        "Did you feel less paralyzed?",
        "Did you enjoy the streaks?",
        "Did you feel worth the effort?",
        "Did you notice the improvement?",
        "Did you feel optimistic?",
        "Did you feel like a builder?",
        "Did the activity wake you up?",
        "Did you feel a sense of renewal?",
        "Do you feel ready for tomorrow?"
    ]
};

// Helper function to get 5 random questions for a category
// Helper function to get unused questions for a category
export const getUnusedQuestions = (
    category: string,
    usedQuestions: string[] = [],
    count: number = 5
): string[] => {
    const allQuestions = QUESTION_BANK[category] || [];

    // Filter out questions that have been used
    const unusedQuestions = allQuestions.filter(q => !usedQuestions.includes(q));

    // If we don't have enough unused questions, return what we have
    if (unusedQuestions.length <= count) {
        return unusedQuestions;
    }

    // Shuffle and take first 'count' questions
    const shuffled = [...unusedQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Helper function to get 5 random questions for a category (legacy - kept for compatibility)
export const getRandomQuestions = (category: string, count: number = 5): string[] => {
    return getUnusedQuestions(category, [], count);
};

// Helper function to determine category based on game and user profile
export const determineQuestionCategory = (
    gameName: string,
    userScores: Record<string, number>
): string => {
    // First check if game has a specific category mapping
    const gameCategory = GAME_TO_CATEGORY[gameName];
    if (gameCategory && gameCategory !== "General") {
        return gameCategory;
    }

    // For general games or unmapped games, use user's top profile
    if (!userScores || Object.keys(userScores).length === 0) {
        return "ADHD"; // Default fallback
    }

    // Find the category with highest score
    const sortedCategories = Object.entries(userScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    return sortedCategories[0][0];
};

// Helper function to get category display name
export const getCategoryDisplayName = (category: string): string => {
    switch (category) {
        case "ADHD":
            return "ADHD & Focus";
        case "Anxiety":
            return "Anxiety & Regulation";
        case "OCD":
            return "OCD & Cognitive Flexibility";
        case "Depression":
            return "Depression & Motivation";
        default:
            return category;
    }
};