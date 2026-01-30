import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import api from '../config/api';

const questions = [
    {
        id: 1,
        question: 'How would you describe your attention span?',
        options: ['Very short', 'Short', 'Average', 'Long', 'Very long'],
    },
    {
        id: 2,
        question: 'How do you handle routine tasks?',
        options: ['Very difficult', 'Difficult', 'Manageable', 'Easy', 'Very easy'],
    },
    {
        id: 3,
        question: 'How do you process sensory information?',
        options: ['Overwhelming', 'Challenging', 'Normal', 'Comfortable', 'Very comfortable'],
    },
];

export default function QuestionnaireScreen({ navigation }: any) {
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(false);

    const handleAnswer = (questionId: number, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            Alert.alert('Incomplete', 'Please answer all questions');
            return;
        }

        setLoading(true);
        try {
            await api.post('/questionnaire/submit', { answers });
            Alert.alert(
                'Success',
                'Questionnaire submitted successfully!',
                [{ text: 'OK', onPress: () => navigation.replace('Main') }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit questionnaire');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Initial Assessment</Text>
                <Text style={styles.subtitle}>
                    Help us understand you better
                </Text>
            </View>

            <View style={styles.content}>
                {questions.map((q) => (
                    <View key={q.id} style={styles.questionCard}>
                        <Text style={styles.questionText}>{q.question}</Text>
                        {q.options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionButton,
                                    answers[q.id] === option && styles.optionButtonSelected,
                                ]}
                                onPress={() => handleAnswer(q.id, option)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        answers[q.id] === option && styles.optionTextSelected,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Submitting...' : 'Complete Assessment'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#8B5CF6',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        padding: 15,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 15,
    },
    optionButton: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 10,
    },
    optionButtonSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: '#F3E8FF',
    },
    optionText: {
        fontSize: 16,
        color: '#4B5563',
    },
    optionTextSelected: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 10,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
