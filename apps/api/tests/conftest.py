import os

# Tests seed their own data; no live ingestion.
os.environ.setdefault("INGEST_INTERVAL_SECONDS", "0")
