from flask import Flask, request, jsonify
import torch
import traceback
import pickle
import numpy as np
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast

app = Flask(__name__)

# ===========================
# 🔹 Safe model loading (CPU)
# ===========================
def safe_load_model(path):
    try:
        print(f"🔄 Loading {path} ...")
        with open(path, 'rb') as f:
            obj = pickle.load(f)
        print(f"✅ Loaded {path} with pickle")
        print(f"📊 Object type: {type(obj)}")
        return obj
    except Exception as e:
        print(f"❌ Failed to load {path}: {e}")
        traceback.print_exc()
        return None

# Load your converted files (CPU-safe versions)
MODEL_PATH = "emotion_model_cpu.pkl"
TOKENIZER_PATH = "tokenizer_cpu.pkl"

print("🚀 Starting model loading...")
model = safe_load_model(MODEL_PATH)
tokenizer = safe_load_model(TOKENIZER_PATH)

# Set model to evaluation mode
if model is not None:
    model.eval()
    print("🔧 Model set to evaluation mode")

if model is None or tokenizer is None:
    print("❌ Failed to load one or more components.")
else:
    print("✅ Model and tokenizer loaded successfully on CPU.")

# Emotion labels (adjust these based on your model's training)
# Common emotion classifications: 
EMOTION_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval",
    "caring", "confusion", "curiosity", "desire", "disappointment",
    "disapproval", "disgust", "embarrassment", "excitement", "fear",
    "gratitude", "grief", "joy", "love", "nervousness",
    "optimism", "pride", "realization", "relief", "remorse",
    "sadness", "surprise", "neutral"
]

# ======================================
# 🔹 Flask API Endpoints
# ======================================
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = "healthy" if (model is not None and tokenizer is not None) else "unhealthy"
    return jsonify({
        'status': status,
        'model_loaded': model is not None,
        'tokenizer_loaded': tokenizer is not None,
        'model_type': str(type(model)) if model else None,
        'tokenizer_type': str(type(tokenizer)) if tokenizer else None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint for DistilBert emotion classification"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing input text'}), 400

        text = data['text']
        print(f"📨 Received text: {text}")

        # Check if components are loaded
        if model is None or tokenizer is None:
            return jsonify({'error': 'Model or tokenizer not loaded'}), 500

        # Tokenize input using DistilBert tokenizer
        print("🔧 Tokenizing input...")
        inputs = tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            padding=True, 
            max_length=512,
            return_attention_mask=True
        )
        
        print(f"🔧 Input keys: {list(inputs.keys())}")
        print(f"🔧 Input shape: {inputs['input_ids'].shape}")

        # Make prediction
        print("🎯 Making prediction...")
        with torch.no_grad():
            outputs = model(**inputs)
            
        # Get predictions from the model outputs
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        predicted_class_id = torch.argmax(logits, dim=-1).item()
        confidence = torch.max(probabilities).item()
        
        print(f"🔧 Logits shape: {logits.shape}")
        print(f"🔧 Predicted class ID: {predicted_class_id}")
        print(f"🔧 Confidence: {confidence:.4f}")

        # Get emotion label
        emotion_label = EMOTION_LABELS[predicted_class_id] if predicted_class_id < len(EMOTION_LABELS) else str(predicted_class_id)
        
        # Get all probabilities for debugging
        all_probabilities = probabilities[0].tolist()
        emotion_scores = {}
        for i, prob in enumerate(all_probabilities):
            label = EMOTION_LABELS[i] if i < len(EMOTION_LABELS) else f"class_{i}"
            emotion_scores[label] = round(prob, 4)

        print(f"🎉 Prediction result: {emotion_label} (confidence: {confidence:.4f})")

        return jsonify({
            'emotion': emotion_label,
            'emotion_id': predicted_class_id,
            'confidence': round(confidence, 4),
            'all_emotions': emotion_scores,
            'text': text,
            'success': True
        })

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'message': 'Prediction failed'}), 500

@app.route('/debug', methods=['GET'])
def debug():
    """Debug endpoint to see model and tokenizer info"""
    model_config = None
    if model and hasattr(model, 'config'):
        model_config = {
            'id2label': getattr(model.config, 'id2label', 'Not available'),
            'label2id': getattr(model.config, 'label2id', 'Not available'),
            'num_labels': getattr(model.config, 'num_labels', 'Not available'),
            'model_type': getattr(model.config, 'model_type', 'Not available')
        }
    
    return jsonify({
        'model_loaded': model is not None,
        'tokenizer_loaded': tokenizer is not None,
        'model_type': str(type(model)) if model else None,
        'tokenizer_type': str(type(tokenizer)) if tokenizer else None,
        'model_config': model_config,
        'emotion_labels': EMOTION_LABELS
    })

@app.route('/emotions', methods=['GET'])
def emotions():
    """Get available emotion labels"""
    return jsonify({
        'available_emotions': EMOTION_LABELS,
        'count': len(EMOTION_LABELS)
    })

@app.route('/')
def home():
    return jsonify({
        'message': 'MindHaven Emotion Model API is running!',
        'model': 'DistilBertForSequenceClassification',
        'endpoints': {
            'home': '/ (GET)',
            'health': '/health (GET)',
            'debug': '/debug (GET)',
            'emotions': '/emotions (GET)',
            'predict': '/predict (POST)'
        },
        'usage': {
            'predict': 'Send POST request with JSON: {"text": "your text here"}'
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Flask server on http://127.0.0.1:5001")
    print("📋 Available endpoints:")
    print("   GET  /           - API information")
    print("   GET  /health     - Health check")
    print("   GET  /debug      - Debug information")
    print("   GET  /emotions   - Available emotion labels")
    print("   POST /predict    - Make prediction")
    app.run(debug=False, port=5001, host='0.0.0.0')