import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib
from features import extract_features

# ── Synthetic Training Data ──────────────────────────────────────────────────

safe_urls = [
    "https://www.google.com", "https://github.com/Sandi179",
    "https://stackoverflow.com/questions/12345", "https://wikipedia.org/wiki/Python",
    "https://amazon.com/product/abc", "https://youtube.com/watch?v=xyz123",
    "https://linkedin.com/in/johndoe", "https://medium.com/article/tech",
    "https://docs.python.org/3/", "https://npmjs.com/package/express",
    "https://cloudflare.com", "https://microsoft.com/en-us/windows",
    "https://apple.com/iphone", "https://reddit.com/r/python",
    "https://twitter.com/openai", "https://openai.com/blog",
    "https://arxiv.org/abs/2301.00001", "https://kaggle.com/competitions",
    "https://flask.palletsprojects.com/", "https://scikit-learn.org/stable/",
    "https://nodejs.org/en/docs", "https://reactjs.org/docs/getting-started.html",
    "https://tailwindcss.com/docs", "https://developer.mozilla.org/en-US/",
    "https://pytorch.org/tutorials/", "https://tensorflow.org/guide",
    "https://huggingface.co/models", "https://anthropic.com/claude",
    "https://stripe.com/docs/api", "https://aws.amazon.com/s3/",
    "https://portal.azure.com", "https://console.cloud.google.com",
    "https://notion.so/workspace", "https://figma.com/design",
    "https://vercel.com/dashboard", "https://netlify.com/sites",
    "https://heroku.com/apps", "https://digitalocean.com/droplets",
    "https://mongodb.com/atlas", "https://postgresql.org/docs/",
]

phishing_urls = [
    "http://paypal-secure-login.xyz/verify?account=12345",
    "http://192.168.1.1/login/banking/confirm",
    "http://google-account-update.tk/password/reset",
    "http://amazonsecure-update.ml/account/login",
    "http://secure-bankofamerica.gq/verify/id",
    "http://apple-id-locked.cf/update/payment",
    "http://login-facebook.ru/confirm/account",
    "http://free-prize-winner.com/claim/now/urgent",
    "http://microsoft-alert.xyz/security/update",
    "http://netflix-billing-issue.tk/payment/update",
    "http://support-paypal.ml/case/open?id=99",
    "http://accounts-google-verify.ga/signin",
    "http://ebay-suspended-account.cf/restore",
    "http://chase-bank-secure.gq/online/login",
    "http://instagram-verify-account.tk/confirm",
    "http://dropbox-share-file.xyz/open?file=xyz",
    "http://irs-tax-refund-2024.ml/claim",
    "http://covid-relief-fund.tk/apply/now",
    "http://bit.ly/3xYZfakelink", "http://tinyurl.com/fakebanking",
    "http://78.92.100.21/login/secure", "http://103.45.67.89/paypal/verify",
    "http://secure-login-helpdesk.xyz/support",
    "http://win-jackpot-now.com/claim?user=lucky",
    "http://your-account-suspended.ml/reactivate",
]

suspicious_urls = [
    "http://github.com.fake-site.ru/login",
    "http://amazon-offers.biz/deals/flash?ref=abc",
    "https://mybank-login.online/secure/auth",
    "http://update-flash-player.net/install",
    "https://signup-bonus-now.com/register?promo=50",
    "http://docs-google-drive.co/file/open",
    "http://video-converter-free.xyz/download",
    "http://streaming-movies-free.net/watch",
    "http://antivirus-scan-now.com/protect",
    "http://crypto-investment-returns.biz/join",
    "https://bet-win-sports.xyz/promo",
    "http://cheap-flights-today.ml/book",
    "http://email-verify-now.tk/confirm?id=abc",
    "http://download-free-ebook.cf/get",
    "http://social-media-likes-boost.com/buy",
]

# ── Build DataFrame ──────────────────────────────────────────────────────────

records = []
for url in safe_urls:
    f = extract_features(url)
    f["label"] = 0  # safe
    records.append(f)

for url in phishing_urls:
    f = extract_features(url)
    f["label"] = 2  # phishing
    records.append(f)

for url in suspicious_urls:
    f = extract_features(url)
    f["label"] = 1  # suspicious
    records.append(f)

df = pd.DataFrame(records)
X = df.drop("label", axis=1)
y = df["label"]

feature_names = list(X.columns)

# ── Train Multiple Models ────────────────────────────────────────────────────

models = {
    "Logistic Regression": Pipeline([("scaler", StandardScaler()),
                                      ("clf", LogisticRegression(max_iter=1000, random_state=42))]),
    "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=42),
    "Gradient Boosting":   GradientBoostingClassifier(n_estimators=100, random_state=42),
    "SVM":                 Pipeline([("scaler", StandardScaler()),
                                      ("clf", SVC(probability=True, random_state=42))]),
}

print("=" * 55)
print("  URL Safety Checker — Model Training Results")
print("=" * 55)

best_model = None
best_score = 0

for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    mean_acc = scores.mean()
    print(f"  {name:<25} | CV Accuracy: {mean_acc*100:.2f}%")
    if mean_acc > best_score:
        best_score = mean_acc
        best_model = (name, model)

print("=" * 55)
print(f"\n  Best Model: {best_model[0]} ({best_score*100:.2f}% CV accuracy)")

# ── Final Train & Save ───────────────────────────────────────────────────────

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
best_model[1].fit(X_train, y_train)

y_pred = best_model[1].predict(X_test)
test_acc = accuracy_score(y_test, y_pred)
print(f"  Test Accuracy : {test_acc*100:.2f}%\n")

print("  Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=["Safe", "Suspicious", "Phishing"],
      zero_division=0))

joblib.dump(best_model[1], "model.pkl")
joblib.dump(feature_names, "feature_names.pkl")
print("  ✅ model.pkl saved successfully!")
print("  ✅ feature_names.pkl saved successfully!")
