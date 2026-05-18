import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import Input, GlobalAveragePooling2D, Dropout, Dense
from tensorflow.keras.models import Model

_model = None

def build_efficientnet_b0(input_shape=(224, 224, 3)):
    base_model = EfficientNetB0(
        include_top=False,
        weights=None, 
        input_shape=input_shape
    )
    
    inputs = Input(shape=input_shape, name="rgb_input")
    x = base_model(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.30)(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.25)(x)
    x = Dense(64, activation="relu")(x)
    x = Dropout(0.15)(x)
    outputs = Dense(1, activation="sigmoid", name="prob_fake")(x)

    model = Model(inputs, outputs, name="EfficientNetB0_Deepfake")
    return model

def load_deepfake_model():
    global _model
    if _model is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'ml_models', 'efficientnetb0_finetuned_best.keras')
        
        try:
            print("⚙️ Building empty model architecture...")
            _model = build_efficientnet_b0()
            
            print("🧠 Loading weights into the model...")
            _model.load_weights(model_path)
            
            print("✅ Deepfake model loaded successfully with weights!")
        except Exception as e:
            print(f"❌ Error loading model weights: {e}")
    return _model

def predict_image(image_path):
    model = load_deepfake_model()
    if model is None:
        return "ERROR", 0.0

    try:
        img = tf.io.read_file(image_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, (224, 224))
        
        img_array = tf.expand_dims(img, axis=0)
        img_processed = preprocess_input(img_array)
        
        prediction_prob = model.predict(img_processed, verbose=0)[0][0]
        
        is_fake = prediction_prob > 0.5
        result_label = "FAKE" if is_fake else "REAL"
        confidence = float(prediction_prob if is_fake else (1.0 - prediction_prob)) * 100.0
        
        return result_label, round(confidence, 2)

    except Exception as e:
        print(f"Error during prediction: {e}")
        return "ERROR", 0.0