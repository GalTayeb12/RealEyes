import numpy as np
import tensorflow as tf
import cv2
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input

def load_rgb_letterbox(image_path, size=(224, 224)):
    """
    Loads an image as RGB and resizes it with padding, without stretching.
    This matches the Grad-CAM logic from the notebook.
    """
    pil = Image.open(image_path).convert("RGBA")

    background = Image.new("RGBA", pil.size, (255, 255, 255, 255))
    background.paste(pil, mask=pil.split()[3])

    img_rgb = np.array(background.convert("RGB"), dtype=np.uint8)

    target_w, target_h = size
    h, w = img_rgb.shape[:2]

    scale = min(target_w / w, target_h / h)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))

    resized = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)

    canvas = np.full((target_h, target_w, 3), 0, dtype=np.uint8)

    y_off = (target_h - new_h) // 2
    x_off = (target_w - new_w) // 2

    canvas[y_off:y_off + new_h, x_off:x_off + new_w] = resized

    return canvas


def overlay_gradcam(image_rgb, heatmap, alpha=0.45):
    """
    Blends the heatmap on top of the original image.
    Blue = low influence, Red = high influence.
    """
    h, w = image_rgb.shape[:2]

    heatmap_resized = cv2.resize(heatmap, (w, h))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)

    heatmap_colored_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)

    image_float = image_rgb.astype(np.float32)
    heatmap_float = heatmap_colored_rgb.astype(np.float32)

    blended = (1 - alpha) * image_float + alpha * heatmap_float
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    return blended


def generate_efficientnet_heatmap(image_path, model, output_path):
    """
    Generates Grad-CAM heatmap for the EfficientNetB0 model used by the website.

    Parameters:
        image_path: path to uploaded image
        model: loaded Keras model
        output_path: where to save the heatmap image

    Returns:
        output_path if successful
    """
    image_rgb = load_rgb_letterbox(image_path, size=(224, 224))

    x = tf.cast(image_rgb, tf.float32)
    x = preprocess_input(x)
    x = x[tf.newaxis, ...]

    try:
        efficientnet_layer = model.get_layer("efficientnetb0")
    except Exception:
        raise ValueError(
            "Could not find layer 'efficientnetb0'. "
            "Check the model layer names."
        )

    last_conv_layer = efficientnet_layer.get_layer("top_conv")

    grad_model = tf.keras.Model(
        inputs=efficientnet_layer.input,
        outputs=[last_conv_layer.output, efficientnet_layer.output]
    )

    with tf.GradientTape() as tape:
        conv_out, backbone_out = grad_model(x, training=False)

        h = backbone_out

        for layer in model.layers[2:]:
            h = layer(h, training=False)

        fake_score = h[:, 0]

    grads = tape.gradient(fake_score, conv_out)

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    heatmap_raw = tf.squeeze(conv_out[0] @ pooled_grads[..., tf.newaxis])
    heatmap_raw = tf.maximum(heatmap_raw, 0.0)

    max_val = tf.reduce_max(heatmap_raw)
    if max_val > 0:
        heatmap_raw = heatmap_raw / max_val

    heatmap = heatmap_raw.numpy()

    overlay = overlay_gradcam(image_rgb, heatmap, alpha=0.45)

    Image.fromarray(overlay).save(output_path)

    return output_path