import re
from urllib.parse import urlparse


def extract_features(url):
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""

    return {
        "url_length": len(url),
        "has_https": int(parsed.scheme == "https"),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "num_at": url.count("@"),
        "num_slashes": url.count("/"),
        "num_digits": sum(c.isdigit() for c in url),
        "has_ip": int(bool(re.match(r'\d+\.\d+\.\d+\.\d+', hostname))),
        "subdomain_count": max(len(hostname.split(".")) - 2, 0),
        "path_length": len(path),
        "has_suspicious_words": int(any(w in url.lower() for w in [
            "login", "verify", "secure", "account", "update",
            "banking", "paypal", "confirm", "password", "free",
            "lucky", "winner", "click", "prize", "urgent"
        ])),
        "special_char_count": sum(1 for c in url if c in "!$%^&*~|<>{}[]"),
        "has_port": int(bool(parsed.port)),
        "double_slash_redirect": int("//" in path),
        "query_length": len(parsed.query),
        "num_params": len(parsed.query.split("&")) if parsed.query else 0,
    }
