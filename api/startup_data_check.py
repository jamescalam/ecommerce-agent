#!/usr/bin/env python3
"""
Startup script to ensure data is available before starting the application.
This can be called from docker-compose or as a pre-startup check.
"""
import os
import sys
from pluto.data_loader import download_hm_sample_data


def ensure_data_available():
    """Ensure data is downloaded and available before app startup"""
    data_dir = os.environ.get("DATA_DIR", "data")

    print(f"Checking data availability in: {data_dir}")

    try:
        # This will download data if not present, or skip if already available
        actual_path = download_hm_sample_data(data_dir)
        print(f"Data ready at: {actual_path}")

        # Basic validation
        required_files = ["customers.csv", "articles.csv", "transactions_train.csv"]
        for filename in required_files:
            filepath = os.path.join(actual_path, filename)
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Required file missing: {filepath}")

        print("✅ All required data files are present and ready")
        return True

    except Exception as e:
        print(f"❌ Data setup failed: {e}")
        return False


if __name__ == "__main__":
    success = ensure_data_available()
    if not success:
        sys.exit(1)
    print("🚀 Data is ready - application can start")