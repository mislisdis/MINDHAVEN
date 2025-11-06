from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load your trained model (exported from Colab)
model = joblib.load('emotion_model.pkl')  

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text = data.get('text', '')

    # Preprocess or vectorize the text (depends on your model)
    # Example: using a TF-IDF vectorizer
    vectorizer = joblib.load('vectorizer.pkl')
    features = vectorizer.transform([text])

    prediction = model.predict(features)[0]
    return jsonify({'emotion': prediction})

if __name__ == '__main__':
    app.run(port=5001)
