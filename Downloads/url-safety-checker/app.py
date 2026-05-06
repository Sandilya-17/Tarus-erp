from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
from features import extract_features

app = Flask(__name__)

# Load model and feature names
model = joblib.load("model.pkl")
feature_names = joblib.load("feature_names.pkl")

LABEL_MAP = {
    0: {"label": "Safe", "color": "#22c55e", "icon": "✅", "badge": "safe"},
    1: {"label": "Suspicious", "color": "#f59e0b", "icon": "⚠️", "badge": "suspicious"},
    2: {"label": "Phishing / Malicious", "color": "#ef4444", "icon": "🚫", "badge": "phishing"},
}


def predict_url(url):
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    feats = extract_features(url)
    df = pd.DataFrame([feats])[feature_names]
    pred = int(model.predict(df)[0])
    proba = model.predict_proba(df)[0]
    confidence = round(float(proba[pred]) * 100, 2)
    return {
        "url": url,
        "prediction": pred,
        "label": LABEL_MAP[pred]["label"],
        "color": LABEL_MAP[pred]["color"],
        "icon": LABEL_MAP[pred]["icon"],
        "badge": LABEL_MAP[pred]["badge"],
        "confidence": confidence,
        "features": feats,
        "probabilities": {
            "Safe": round(float(proba[0]) * 100, 2),
            "Suspicious": round(float(proba[1]) * 100, 2),
            "Phishing": round(float(proba[2]) * 100, 2),
        }
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    try:
        result = predict_url(url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/check", methods=["GET"])
def api_check():
    """REST API endpoint — GET /api/check?url=https://example.com"""
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"error": "Provide ?url= parameter"}), 400
    try:
        result = predict_url(url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
