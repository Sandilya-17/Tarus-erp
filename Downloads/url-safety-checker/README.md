# 🛡️ URL Safety Checker — AI-Powered Threat Detection

[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)](https://flask.palletsprojects.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-orange?logo=scikit-learn)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A real-time **ML-powered URL classifier** that detects **Safe**, **Suspicious**, and **Phishing/Malicious** URLs — deployed as a live Flask web application with a REST API.

> Built to demonstrate practical application of machine learning in **network security** and **internet threat intelligence** — directly relevant to roles in network software engineering and cloud security.

---

## 🚀 Live Demo

```
python app.py   →   http://localhost:5000
```

---

## 📸 Features

- **16 engineered URL features** — length, HTTPS, IP detection, subdomain depth, suspicious keywords, special chars, query params, and more
- **4 ML models compared** — Logistic Regression, Random Forest, Gradient Boosting, SVM with 5-fold cross-validation
- **Best model auto-selected** and saved as `model.pkl`
- **Beautiful dark-theme web UI** with probability bars and feature breakdown
- **REST API endpoint** — `GET /api/check?url=https://example.com`

---

## 🧠 How It Works

```
URL Input
   │
   ▼
Feature Extraction (16 features)
   │  url_length, has_https, num_dots, has_ip,
   │  subdomain_count, has_suspicious_words, ...
   ▼
Gradient Boosting Classifier
   │
   ▼
Prediction + Confidence Score
   │
   ├── ✅ Safe
   ├── ⚠️  Suspicious
   └── 🚫 Phishing / Malicious
```

---

## 📁 Project Structure

```
url-safety-checker/
├── app.py              # Flask web application + REST API
├── model.py            # Train & compare 4 ML models, save best
├── features.py         # URL feature engineering (16 features)
├── templates/
│   └── index.html      # Dark-theme interactive web UI
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Run

```bash
# 1. Clone the repo
git clone https://github.com/Sandi179/url-safety-checker.git
cd url-safety-checker

# 2. Install dependencies
pip install -r requirements.txt

# 3. Train the model (generates model.pkl)
python model.py

# 4. Start the Flask app
python app.py

# 5. Open browser
# http://localhost:5000
```

---

## 🔌 REST API

```bash
# Check any URL via GET request
curl "http://localhost:5000/api/check?url=https://github.com"

# Response
{
  "url": "https://github.com",
  "label": "Safe",
  "confidence": 96.4,
  "probabilities": {
    "Safe": 96.4,
    "Suspicious": 2.8,
    "Phishing": 0.8
  },
  "features": { ... }
}
```

---

## 📊 Model Performance

| Model               | CV Accuracy |
|---------------------|------------|
| Logistic Regression | ~78%       |
| Random Forest       | ~84%       |
| **Gradient Boosting**   | **~87%**   |
| SVM                 | ~81%       |

> Best model is automatically selected and saved.

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| ML        | scikit-learn, pandas, numpy       |
| Backend   | Flask, joblib                     |
| Frontend  | HTML5, CSS3, Vanilla JS           |
| Deploy    | Gunicorn (production-ready)       |

---

## 👤 Author

**P. V. Sai Sandilya**  
B.Tech CSE (AI for Visual Intelligence) — KL University  
[GitHub](https://github.com/Sandi179) · [LinkedIn](https://linkedin.com)
