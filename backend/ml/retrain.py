import json
import os
import pickle
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import mlflow
import pandas as pd
from fastapi import FastAPI
from sqlalchemy import func
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from database import SessionLocal
from ml.predictor import clean_text, load_artifacts
from models import Feedback, Ticket

_retrain_lock = threading.Lock()

CATEGORY_MAP = {
    "PAYMENT": "Billing",
    "INVOICE": "Billing",
    "REFUND": "Refund",
    "ORDER": "Technical Issue",
    "ACCOUNT": "Technical Issue",
    "CANCEL": "Cancellation",
    "SUBSCRIPTION": "Cancellation",
    "DELIVERY": "Product Inquiry",
    "SHIPPING": "Product Inquiry",
    "FEEDBACK": "General",
    "CONTACT": "General",
}

URGENCY_MAP = {
    "complaint": "Critical",
    "payment_issue": "Critical",
    "registration_problems": "Critical",
    "get_refund": "High",
    "cancel_order": "High",
    "track_refund": "High",
    "delete_account": "High",
    "check_cancellation_fee": "High",
    "change_order": "Medium",
    "change_shipping_address": "Medium",
    "track_order": "Medium",
    "get_invoice": "Medium",
    "check_invoice": "Medium",
    "place_order": "Medium",
    "set_up_shipping_address": "Medium",
    "recover_password": "Medium",
    "edit_account": "Medium",
    "check_refund_policy": "Low",
    "check_payment_methods": "Low",
    "delivery_options": "Low",
    "delivery_period": "Low",
    "contact_customer_service": "Low",
    "contact_human_agent": "Low",
    "create_account": "Low",
    "switch_account": "Low",
    "newsletter_subscription": "Low",
    "review": "Low",
}


def _next_version(current: str | None) -> str:
    if not current:
        return "1.0.1"
    parts = current.split(".")
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        return f"{current}-r1"
    major, minor, patch = map(int, parts)
    return f"{major}.{minor}.{patch + 1}"


def _load_base_dataset() -> pd.DataFrame:
    dataset_path = os.getenv("BASE_DATASET_PATH", "")
    if not dataset_path:
        raise ValueError("BASE_DATASET_PATH is not set.")

    df = pd.read_csv(dataset_path)
    required = {"instruction", "category", "intent"}
    if not required.issubset(df.columns):
        raise ValueError("Base dataset must contain: instruction, category, intent")

    df["category_mapped"] = df["category"].astype(str).str.upper().map(CATEGORY_MAP)
    df["urgency_mapped"] = df["intent"].astype(str).map(URGENCY_MAP)
    df = df.dropna(subset=["instruction", "category_mapped", "urgency_mapped"])

    return pd.DataFrame(
        {
            "text": df["instruction"].astype(str),
            "category": df["category_mapped"].astype(str),
            "urgency": df["urgency_mapped"].astype(str),
        }
    )


def _load_feedback_corrections(db) -> pd.DataFrame:
    rows = (
        db.query(Ticket.text, Feedback.agent_category, Feedback.agent_urgency)
        .join(Feedback, Feedback.ticket_id == Ticket.id)
        .filter(Feedback.was_correct.is_(False))
        .all()
    )
    if not rows:
        return pd.DataFrame(columns=["text", "category", "urgency"])

    df = pd.DataFrame(rows, columns=["text", "category", "urgency"])
    return df.dropna(subset=["text", "category", "urgency"])


def _weekly_confidence_flags(db, threshold: float) -> tuple[bool, bool, float | None, float | None]:
    since = datetime.utcnow() - timedelta(days=7)
    avg_cat, avg_urg = (
        db.query(
            func.avg(Ticket.category_confidence),
            func.avg(Ticket.urgency_confidence),
        )
        .filter(Ticket.submitted_at >= since)
        .one()
    )

    need_category = avg_cat is not None and float(avg_cat) < threshold
    need_urgency = avg_urg is not None and float(avg_urg) < threshold
    return need_category, need_urgency, (float(avg_cat) if avg_cat is not None else None), (
        float(avg_urg) if avg_urg is not None else None
    )


def _train_candidates(df: pd.DataFrame, train_category: bool, train_urgency: bool) -> dict[str, Any]:
    df = df.copy()
    df["clean_text"] = df["text"].astype(str).apply(clean_text)
    df = df[df["clean_text"].str.len() > 0]

    if len(df) < 20:
        raise ValueError("Not enough rows for retraining.")

    stratify_col = df["category"] if train_category else df["urgency"]
    X_train, X_val, y_cat_train, y_cat_val, y_urg_train, y_urg_val = train_test_split(
        df["clean_text"],
        df["category"],
        df["urgency"],
        test_size=0.2,
        random_state=42,
        stratify=stratify_col,
    )

    vectorizer = TfidfVectorizer(
        max_features=6000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
        max_df=0.85,
    )
    X_train_vec = vectorizer.fit_transform(X_train.tolist())
    X_val_vec = vectorizer.transform(X_val.tolist())

    result: dict[str, Any] = {"vectorizer": vectorizer, "trained_on_rows": int(len(df))}

    if train_category:
        cat_encoder = LabelEncoder()
        y_train = cat_encoder.fit_transform(y_cat_train)
        y_val = cat_encoder.transform(y_cat_val)

        cat_model = LogisticRegression(
            C=3.0,
            solver="lbfgs",
            multi_class="multinomial",
            class_weight="balanced",
            max_iter=2000,
        )
        cat_model.fit(X_train_vec, y_train)
        cat_pred = cat_model.predict(X_val_vec)

        result["category_model"] = cat_model
        result["category_encoder"] = cat_encoder
        result["category_metrics"] = {
            "accuracy": float(accuracy_score(y_val, cat_pred)),
            "f1_weighted": float(f1_score(y_val, cat_pred, average="weighted", zero_division=0)),
        }

    if train_urgency:
        urg_encoder = LabelEncoder()
        y_train = urg_encoder.fit_transform(y_urg_train)
        y_val = urg_encoder.transform(y_urg_val)

        urg_model = LogisticRegression(
            C=3.0,
            solver="lbfgs",
            multi_class="multinomial",
            class_weight="balanced",
            max_iter=2000,
        )
        urg_model.fit(X_train_vec, y_train)
        urg_pred = urg_model.predict(X_val_vec)

        result["urgency_model"] = urg_model
        result["urgency_encoder"] = urg_encoder
        result["urgency_metrics"] = {
            "accuracy": float(accuracy_score(y_val, urg_pred)),
            "f1_weighted": float(f1_score(y_val, urg_pred, average="weighted", zero_division=0)),
        }

    return result


def _save_single_bundle(model_type: str, model, vectorizer, encoder, metadata: dict) -> None:
    root = Path(__file__).resolve().parent.parent / "artifacts" / model_type
    root.mkdir(parents=True, exist_ok=True)

    with open(root / f"{model_type}_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(root / "tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open(root / "label_encoder.pkl", "wb") as f:
        pickle.dump(encoder, f)
    with open(root / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def _log_to_mlflow(payload: dict[str, Any]) -> str | None:
    try:
        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
        mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT", "ticket-classifier-bitext"))
        with mlflow.start_run() as run:
            mlflow.log_dict(payload, "retrain_payload.json")
            return run.info.run_id
    except Exception:
        return None


def run_retraining(app: FastAPI | None = None) -> dict[str, Any]:
    if not _retrain_lock.acquire(blocking=False):
        return {"status": "skipped", "message": "Retraining already in progress."}

    try:
        threshold = float(os.getenv("RETRAIN_MODEL_CONFIDENCE_THRESHOLD", "0.75"))

        with SessionLocal() as db:
            need_cat, need_urg, avg_cat, avg_urg = _weekly_confidence_flags(db, threshold)
            if not need_cat and not need_urg:
                return {
                    "status": "skipped",
                    "message": "No model below weekly confidence threshold.",
                    "avg_category_confidence": avg_cat,
                    "avg_urgency_confidence": avg_urg,
                }

            base_df = _load_base_dataset()
            feedback_df = _load_feedback_corrections(db)
            train_df = pd.concat([base_df, feedback_df], ignore_index=True).drop_duplicates()

            trained = _train_candidates(train_df, need_cat, need_urg)

            run_payload = {
                "threshold": threshold,
                "need_category": need_cat,
                "need_urgency": need_urg,
                "avg_category_confidence": avg_cat,
                "avg_urgency_confidence": avg_urg,
                "trained_on_rows": trained["trained_on_rows"],
            }
            run_id = _log_to_mlflow(run_payload)

            current_bundle = app.state.ml_bundle if app is not None else None
            deployed = {"category": False, "urgency": False}

            if need_cat:
                cur_meta = current_bundle["category"]["metadata"] if current_bundle else {}
                cur_acc = float(cur_meta.get("accuracy", 0.0)) if cur_meta.get("accuracy") is not None else 0.0
                new_acc = trained["category_metrics"]["accuracy"]
                if new_acc > cur_acc:
                    new_ver = _next_version(str(cur_meta.get("version", "1.0.0")))
                    meta = {
                        "model_type": "category",
                        "version": new_ver,
                        "accuracy": new_acc,
                        "f1_weighted": trained["category_metrics"]["f1_weighted"],
                        "trained_at": datetime.utcnow().isoformat(),
                        "mlflow_run_id": run_id,
                    }
                    _save_single_bundle(
                        "category",
                        trained["category_model"],
                        trained["vectorizer"],
                        trained["category_encoder"],
                        meta,
                    )
                    deployed["category"] = True

            if need_urg:
                cur_meta = current_bundle["urgency"]["metadata"] if current_bundle else {}
                cur_acc = float(cur_meta.get("accuracy", 0.0)) if cur_meta.get("accuracy") is not None else 0.0
                new_acc = trained["urgency_metrics"]["accuracy"]
                if new_acc > cur_acc:
                    new_ver = _next_version(str(cur_meta.get("version", "1.0.0")))
                    meta = {
                        "model_type": "urgency",
                        "version": new_ver,
                        "accuracy": new_acc,
                        "f1_weighted": trained["urgency_metrics"]["f1_weighted"],
                        "trained_at": datetime.utcnow().isoformat(),
                        "mlflow_run_id": run_id,
                    }
                    _save_single_bundle(
                        "urgency",
                        trained["urgency_model"],
                        trained["vectorizer"],
                        trained["urgency_encoder"],
                        meta,
                    )
                    deployed["urgency"] = True

            if (deployed["category"] or deployed["urgency"]) and app is not None:
                artifacts_dir = Path(__file__).resolve().parent.parent / "artifacts"
                app.state.ml_bundle = load_artifacts(artifacts_dir)

            return {
                "status": "completed",
                "avg_category_confidence": avg_cat,
                "avg_urgency_confidence": avg_urg,
                "retrained_category": need_cat,
                "retrained_urgency": need_urg,
                "deployed_category": deployed["category"],
                "deployed_urgency": deployed["urgency"],
                "mlflow_run_id": run_id,
            }
    except Exception as exc:
        return {"status": "failed", "error": str(exc)}
    finally:
        _retrain_lock.release()
