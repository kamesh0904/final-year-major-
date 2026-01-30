import { useState, useEffect } from "react";
import { addSessionTime } from "../api/neuroNestApi";

interface UsePostGameQuestionnaireProps {
    gameName: string;
    sessionDuration: number; // in seconds
    isGameActive: boolean;
}

interface QuestionnaireState {
    shouldShow: boolean;
    isEligible: boolean;
    category: string;
    totalDuration: number;
    availableQuestionsCount: number;
    loading: boolean;
}

export const usePostGameQuestionnaire = ({
    gameName,
    sessionDuration,
    isGameActive
}: UsePostGameQuestionnaireProps) => {
    const [state, setState] = useState<QuestionnaireState>({
        shouldShow: false,
        isEligible: false,
        category: "",
        totalDuration: 0,
        availableQuestionsCount: 0,
        loading: true
    });

    useEffect(() => {
        // Only check when game ends and has some duration
        if (!isGameActive && sessionDuration > 0) {
            checkEligibility();
        } else if (isGameActive) {
            setState(prev => ({ ...prev, shouldShow: false, loading: false }));
        }
    }, [gameName, sessionDuration, isGameActive]);

    const checkEligibility = async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));

            // Add session time and check if questionnaire should be triggered
            const response = await addSessionTime({
                game_name: gameName,
                session_duration: sessionDuration
            });

            setState({
                shouldShow: response.should_trigger_questionnaire && response.available_questions_count > 0,
                isEligible: response.should_trigger_questionnaire,
                category: response.category,
                totalDuration: response.total_duration,
                availableQuestionsCount: response.available_questions_count,
                loading: false
            });

        } catch (error) {
            console.error("Error checking questionnaire eligibility:", error);
            setState(prev => ({ ...prev, loading: false }));
        }
    };

    const markCompleted = () => {
        setState(prev => ({ ...prev, shouldShow: false }));
    };

    const skip = () => {
        setState(prev => ({ ...prev, shouldShow: false }));
    };

    return {
        ...state,
        markCompleted,
        skip,
        refresh: checkEligibility
    };
};