import os
import glob
import librosa
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# RAVDESS Emotion Mapping
# Filename format: modality-vocal_channel-emotion-intensity-statement-repetition-actor.wav
# e.g., 03-01-06-01-02-01-12.wav
EMOTIONS = {
    '01': 'neutral',
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
}

def extract_feature(file_name):
    """
    Extract MFCC, Chroma, and Mel Spectrogram features from an audio file.
    """
    try:
        # Load audio (use lower sampling rate for speed)
        X, sample_rate = librosa.load(file_name, sr=22050)
        
        # We will extract 2 types of stable audio features
        result = np.array([])
        
        # 1. MFCC (Mel-Frequency Cepstral Coefficients)
        mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
        result = np.hstack((result, mfccs))
        
        # 2. Mel Spectrogram (Frequencies mapped to the mel scale)
        mel = np.mean(librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
        result = np.hstack((result, mel))
        
        return result
    except Exception as e:
        print(f"Error parsing {file_name}: {e}")
        return None

def process_file(file):
    """Worker function for concurrent processing"""
    file_name = os.path.basename(file)
    parts = file_name.split('-')
    if len(parts) >= 3:
        emotion_code = parts[2]
        if emotion_code in EMOTIONS:
            feat = extract_feature(file)
            if feat is not None:
                return feat, EMOTIONS[emotion_code]
    return None

def load_data():
    x, y = [], []
    
    print(f"Scanning for Actor_* folders in {BASE_DIR}...")
    
    # Check if they are inside audio_speech_actors_01-24 or directly in ml/
    search_path_1 = os.path.join(BASE_DIR, "Actor_*", "*.wav")
    search_path_2 = os.path.join(BASE_DIR, "audio_speech_actors_01-24", "Actor_*", "*.wav")
    
    files = glob.glob(search_path_1)
    if not files:
        files = glob.glob(search_path_2)

    if not files:
        raise FileNotFoundError("Could not find any RAVDESS Actor folders with .wav files!")

    print(f"Found {len(files)} total audio files. Preparing to extract features from ALL files... This will take a few minutes.")

    count = 0
    for file in files:
        file_name = os.path.basename(file)
        parts = file_name.split('-')
        if len(parts) >= 3:
            emotion_code = parts[2]
            if emotion_code in EMOTIONS:
                print(f"Extracting features from: {file_name} ...", end=" ")
                feat = extract_feature(file)
                if feat is not None:
                    x.append(feat)
                    y.append(EMOTIONS[emotion_code])
                    count += 1
                    print("SUCCESS")
                else:
                    print("FAILED")

    return np.array(x), np.array(y)

def train_and_evaluate():
    # 1. Load the data
    X, y = load_data()
    print(f"\nFinal Dataset Size: {X.shape[0]} samples, {X.shape[1]} features extracted per audio")
    
    # 2. Split into train and test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Initialize the Multi-Layer Perceptron Classifier
    # This is a Neural Network suitable for pattern recognition in audio arrays
    model = MLPClassifier(
        alpha=0.01, 
        batch_size=256, 
        epsilon=1e-08, 
        hidden_layer_sizes=(300,), 
        learning_rate='adaptive', 
        max_iter=500,
        random_state=42
    )
    
    # 4. Train the Model
    print("Training the MLP Neural Network on audio features...")
    model.fit(X_train, y_train)
    
    # 5. Evaluate the Model
    print("\n--- Model Evaluation ---")
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_true=y_test, y_pred=y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 6. Save the Model
    model_path = os.path.join(BASE_DIR, "audio_emotion_model.pkl")
    print(f"\nSaving highly accurate audio model to {model_path}...")
    joblib.dump(model, model_path)
    print("✅ Model saved successfully!")

if __name__ == "__main__":
    train_and_evaluate()
