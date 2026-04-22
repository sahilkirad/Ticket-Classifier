import json
import math
import pickle
import re
from pathlib import Path


ROUTING_RULES = {
    "Billing": "Finance Team",
    "Refund": "Finance Team",
    "Technical Issue": "Engineering Team",
    "Cancellation": "Customer Success Team",
    "Product Inquiry": "Product Team",
    "General": "General Support Queue",
}


def clean_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _load_pickle(path: Path):
    with open(path, "rb") as f:
        return pickle.load(f)


def _load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_model_bundle(artifacts_dir: Path, model_type: str, legacy: dict) -> dict:
    model_dir = artifacts_dir / model_type
    model_file = model_dir / f"{model_type}_model.pkl"
    vec_file = model_dir / "tfidf_vectorizer.pkl"
    enc_file = model_dir / "label_encoder.pkl"
    meta_file = model_dir / "metadata.json"

    if model_file.exists() and vec_file.exists() and enc_file.exists() and meta_file.exists():
        return {
            "model": _load_pickle(model_file),
            "vectorizer": _load_pickle(vec_file),
            "encoder": _load_pickle(enc_file),
            "metadata": _load_json(meta_file),
        }

    # Backward compatibility with old single-artifact layout.
    return {
        "model": legacy[f"{model_type}_model"],
        "vectorizer": legacy["vectorizer"],
        "encoder": legacy[f"{model_type}_encoder"],
        "metadata": legacy["metadata"],
    }


def load_artifacts(artifacts_dir: str | Path) -> dict:
    artifacts_dir = Path(artifacts_dir)

    legacy = {
        "category_model": _load_pickle(artifacts_dir / "category_model.pkl"),
        "urgency_model": _load_pickle(artifacts_dir / "urgency_model.pkl"),
        "vectorizer": _load_pickle(artifacts_dir / "tfidf_vectorizer.pkl"),
        "metadata": _load_json(artifacts_dir / "model_metadata.json"),
    }
    label_encoders = _load_pickle(artifacts_dir / "label_encoders.pkl")
    legacy["category_encoder"] = label_encoders["category"]
    legacy["urgency_encoder"] = label_encoders["urgency"]

    category_bundle = _load_model_bundle(artifacts_dir, "category", legacy)
    urgency_bundle = _load_model_bundle(artifacts_dir, "urgency", legacy)

    return {
        "category": category_bundle,
        "urgency": urgency_bundle,
    }


def predict_ticket(text: str, threshold: float, bundle: dict) -> dict:
    cleaned = clean_text(text)

    cat_vec = bundle["category"]["vectorizer"].transform([cleaned])
    cat_proba = bundle["category"]["model"].predict_proba(cat_vec)[0]
    cat_idx = int(cat_proba.argmax())
    category = str(bundle["category"]["encoder"].classes_[cat_idx])
    category_conf = float(cat_proba[cat_idx])

    urg_vec = bundle["urgency"]["vectorizer"].transform([cleaned])
    urg_proba = bundle["urgency"]["model"].predict_proba(urg_vec)[0]
    urg_idx = int(urg_proba.argmax())
    urgency = str(bundle["urgency"]["encoder"].classes_[urg_idx])
    urgency_conf = float(urg_proba[urg_idx])

    combined_conf = float(math.sqrt(category_conf * urgency_conf))
    routing_team = ROUTING_RULES.get(category, "General Support Queue")
    auto_routed = combined_conf >= threshold
    status = "auto_routed" if auto_routed else "pending_review"

    return {
        "category": category,
        "category_confidence": category_conf,
        "urgency": urgency,
        "urgency_confidence": urgency_conf,
        "combined_confidence": combined_conf,
        "routing_team": routing_team,
        "status": status,
        "auto_routed": auto_routed,
    }
