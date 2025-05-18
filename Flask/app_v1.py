from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from datetime import datetime
import tensorflow as tf
from PIL import Image
import numpy as np

# Load environment variables
load_dotenv()

# Setup Flask and DB
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Load SavedModel
MODEL_PATH = os.getenv("MODEL_PATH", "best_model/best_model")
model = tf.saved_model.load(MODEL_PATH)
predict_fn = model.signatures["serving_default"]

# Upload folder
UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Result table
class Result(db.Model):
    __tablename__ = 'Results'
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String)
    prediction = db.Column(db.String)
    explanation = db.Column(db.Text)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    UserId = db.Column(db.Integer)

@app.route('/')
def homepage():
    return {"message": "✅ Catascan Flask aktif. Gunakan POST /predict"}

# Optional normalize=False to debug preprocessing
def preprocess_image(image_path, normalize=False):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img = np.array(img).astype(np.float32)
    if normalize:
        img = img / 255.0
    img = np.expand_dims(img, axis=0)
    return img

# Predict endpoint
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files or 'user_id' not in request.form:
        return jsonify({"error": "image dan user_id wajib diisi"}), 400

    file = request.files['image']
    user_id = request.form.get('user_id')
    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Preprocess & convert
    input_img = preprocess_image(filepath)
    input_tensor = tf.convert_to_tensor(input_img, dtype=tf.float32)
    prediction_result = predict_fn(input_tensor)
    prediction_values = list(prediction_result.values())[0].numpy()
    
    label_map = ['normal', 'mature', 'immature']
    pred_index = np.argmax(prediction_values)
    pred_label = label_map[pred_index]

    confidence = {
        label_map[i]: float(score) for i, score in enumerate(prediction_values[0])
    }

    explanation_dict = {
        'normal': 'Tidak ditemukan indikasi katarak.',
        'mature': 'Lensa mengalami kekeruhan total (mature cataract).',
        'immature': 'Kekeruhan sebagian pada lensa (immature cataract).'
    }
    explanation = explanation_dict.get(pred_label, 'Tidak diketahui')

    result = Result(
        image_path=filepath,
        prediction=pred_label,
        explanation=explanation,
        UserId=user_id
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({
        "prediction": pred_label,
        "explanation": explanation,
        "confidence_scores": confidence
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
