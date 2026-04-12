import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Get absolute path to the dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "Suicide_Detection.csv")

def load_kaggle_dataset(sample_size=None):
    """
    Loads the Kaggle Suicide and Depression dataset.
    Has columns: ['Unnamed: 0', 'text', 'class']
    class is either 'suicide' or 'non-suicide'
    """
    print(f"Loading dataset from {DATASET_PATH}...")
    
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Please make sure you downloaded it.")
        
    # Load dataset
    df = pd.read_csv(DATASET_PATH)
    
    # Optional: Take a random sample if the full 232k rows is too slow to train locally
    if sample_size and sample_size < len(df):
        print(f"Sampling {sample_size} rows from the full dataset of {len(df)} rows for faster training...")
        df = df.sample(n=sample_size, random_state=42)
        
    print(f"Dataset Size: {len(df)} samples")
    print("Class Distribution:")
    print(df['class'].value_counts())
    
    # Map text labels to our system's integer labels
    # 'non-suicide' -> 0 (Safe)
    # 'suicide' -> 2 (Crisis) 
    # (Note: This dataset doesn't have a 'Mild Distress' (1) label, so it's binary for now. 
    # We will map non-suicide to Safe, and suicide to Crisis)
    
    label_map = {
        'non-suicide': 0, 
        'suicide': 2
    }
    
    df['label'] = df['class'].map(label_map)
    
    # Drop rows with NaN labels (just in case)
    df = df.dropna(subset=['label', 'text'])
    df['label'] = df['label'].astype(int)
    
    return df

def train_and_evaluate():
    # Load 10,000 samples for reasonable local training time (can increase to train on all 232k)
    df = load_kaggle_dataset(sample_size=10000)
    
    # Split the dataset
    print("\nSplitting data into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)
    
    # Create an ML Pipeline (TF-IDF Vectorizer + Random Forest)
    print("Training Random Forest model with TF-IDF Vectorization...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, stop_words='english')),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', n_jobs=-1))
    ])
    
    # Train the model
    pipeline.fit(X_train, y_train)
    
    # Evaluate the model
    print("\n--- Model Evaluation ---")
    y_pred = pipeline.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    
    print("\nClassification Report:")
    # Only map the target names that actually exist in the test set
    labels_present = np.unique(y_test)
    target_names = []
    if 0 in labels_present: target_names.append("Safe (0)")
    if 1 in labels_present: target_names.append("Mild Distress (1)")
    if 2 in labels_present: target_names.append("Crisis (2)")
    
    print(classification_report(y_test, y_pred, target_names=target_names))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save the model
    model_path = os.path.join(BASE_DIR, "crisis_model.pkl")
    print(f"\nSaving highly accurate trained model to {model_path}...")
    joblib.dump(pipeline, model_path)
    print("✅ Model saved successfully!")

if __name__ == "__main__":
    train_and_evaluate()
