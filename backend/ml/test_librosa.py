import librosa
import numpy as np
import glob
import os
import sys

base = os.path.dirname(os.path.abspath(__file__))
files = glob.glob(os.path.join(base, "Actor_*", "*.wav"))
if not files:
    files = glob.glob(os.path.join(base, "audio_speech_actors_01-24", "Actor_*", "*.wav"))

f = files[0]
print("Loading file", f)
X, sample_rate = librosa.load(f, sr=22050)
print("File loaded. Shapes:", X.shape, sample_rate)

print("Extracting MFCC...")
sys.stdout.flush()
mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
print("MFCC done. Shape:", mfccs.shape)

print("Extracting STFT...")
sys.stdout.flush()
stft = np.abs(librosa.stft(X))
print("STFT done. Shape:", stft.shape)

print("Extracting Chroma...")
sys.stdout.flush()
chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
print("Chroma done. Shape:", chroma.shape)

print("Extracting Mel...")
sys.stdout.flush()
mel = np.mean(librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
print("Mel done. Shape:", mel.shape)

print("All features extracted successfully!")
