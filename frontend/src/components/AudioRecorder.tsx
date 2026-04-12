import { useState, useRef } from "react";
import { Mic, Square, Loader } from "lucide-react";
import { logger } from "../utils/logger";

interface AudioProfile {
    tempo: number;
    pitch_variance: number;
    mean_energy: number;
    stress_level: string;
    detected_emotion?: string;
}

interface AudioRecorderProps {
    onAudioAnalyzed: (profile: AudioProfile) => void;
    apiBaseUrl: string;
}

export default function AudioRecorder({ onAudioAnalyzed, apiBaseUrl }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await analyzeAudio(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            logger.error("Error accessing microphone", err);
            alert("Microphone access is required for voice analysis.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const analyzeAudio = async (audioBlob: Blob) => {
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "voice_memo.webm");

        try {
            const response = await fetch(`${apiBaseUrl}/api/audio/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to analyze audio");
            }

            const data = await response.json();
            if (data.status === "success") {
                onAudioAnalyzed(data.acoustic_profile);
            }
        } catch (err) {
            logger.error("Audio analysis failed", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center
        ${isAnalyzing ? "bg-gray-500 cursor-not-allowed" : ""}
        ${isRecording ? "bg-red-500 animate-pulse text-white" : "glass text-purple-300 hover:text-white hover:bg-white/10"}
      `}
            title={isRecording ? "Stop Recording" : "Analyze Voice Sentiment"}
        >
            {isAnalyzing ? (
                <Loader size={16} className="animate-spin" />
            ) : isRecording ? (
                <Square size={16} fill="currentColor" />
            ) : (
                <Mic size={16} />
            )}
        </button>
    );
}
