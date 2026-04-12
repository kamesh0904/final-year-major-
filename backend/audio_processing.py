import os
import librosa
import numpy as np
import joblib
from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile

router = APIRouter()

# Load Neural Network Model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "audio_emotion_model.pkl")

# Initialize model variable
audio_model = None
if os.path.exists(MODEL_PATH):
    try:
        audio_model = joblib.load(MODEL_PATH)
        print("✅ Loaded Audio Emotion MLP model.")
    except Exception as e:
        print(f"⚠️ Could not load audio model: {e}")

def extract_features_for_prediction(file_path):
    """Extract identical features as used in training (MFCC, Chroma, Mel)"""
    try:
        X, sample_rate = librosa.load(file_path, sr=22050)
        result = np.array([])
        
        mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
        result = np.hstack((result, mfccs))
        
        mel = np.mean(librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
        result = np.hstack((result, mel))
        
        return result.reshape(1, -1)
    except:
        return None

router = APIRouter()

@router.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Analyze uploaded audio for acoustic stress markers.
    Returns a sentiment/stress profile based on vocal features.
    """
    if not file.filename.endswith(('.wav', '.webm', '.ogg', '.mp3', '.m4a')):
        raise HTTPException(status_code=400, detail="Unsupported audio format")
        
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
            
        # Load audio using librosa
        # sr=None preserves original sample rate
        y, sr = librosa.load(temp_audio_path, sr=None)
        
        # Extract features
        # 1. Speech Rate / Tempo (using onset strength)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo_array = librosa.beat.tempo(onset_envelope=onset_env, sr=sr)
        tempo = float(tempo_array[0])
        
        # 2. Pitch Variance (using fundamental frequency f0)
        # Using pyyin for robust f0 estimation
        f0, voiced_flag, voiced_probs = librosa.pyyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
        valid_f0 = f0[~np.isnan(f0)]
        pitch_variance = float(np.var(valid_f0)) if len(valid_f0) > 0 else 0.0
        
        # 3. Energy / Loudness (RMSE)
        rmse = librosa.feature.rms(y=y)[0]
        mean_energy = float(np.mean(rmse))
        
        # Advanced AI Prediction
        ml_emotion = "Unknown"
        if audio_model is not None:
            features = extract_features_for_prediction(temp_audio_path)
            if features is not None:
                prediction = audio_model.predict(features)
                ml_emotion = prediction[0]
                
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        # Analyze Acoustic Stress Profile
        stress_level = "Normal"
        anxiety_markers = 0
        depression_markers = 0
        
        if tempo > 130:
            anxiety_markers += 1
        elif tempo < 80:
            depression_markers += 1
            
        if pitch_variance > 3000: # highly fluctuating voice
            anxiety_markers += 1
        elif pitch_variance < 500 and len(valid_f0) > 0: # monotone voice
            depression_markers += 1
            
        if mean_energy > 0.1: # speaking loudly
            anxiety_markers += 1
        elif mean_energy < 0.02: # speaking softly
            depression_markers += 1
            
        if anxiety_markers >= 2:
            stress_level = "High Anxiety / Stress"
        elif depression_markers >= 2:
            stress_level = "Low Energy / Depressive"
            
        # Combine heuristics with ML
        final_assessment = f"{stress_level} (ML Detected: {ml_emotion.title()})"
            
        return {
            "status": "success",
            "acoustic_profile": {
                "tempo": tempo,
                "pitch_variance": pitch_variance,
                "mean_energy": mean_energy,
                "stress_level": final_assessment,
                "detected_emotion": ml_emotion
            }
        }
        
    except Exception as e:
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))
