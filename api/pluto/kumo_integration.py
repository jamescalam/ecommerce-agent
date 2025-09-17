import os
import pandas as pd
from kumoai.experimental import rfm
from .data_loader import download_hm_sample_data


class KumoRFMService:
    """Service for managing KumoRFM model and data"""

    def __init__(self):
        self.model = None
        self.customers_df = None
        self.articles_df = None
        self.transactions_df = None
        self.is_initialized = False

    def initialize(self, data_path: str = None):
        """Initialize KumoRFM with H&M sample dataset from HuggingFace"""
        if self.is_initialized:
            return

        # Get data path from environment or use default
        if data_path is None:
            data_path = os.environ.get("DATA_DIR", "data")

        # Download data from HuggingFace if not already present
        try:
            data_path = download_hm_sample_data(data_path)
        except Exception as e:
            print(f"Warning: Could not download data from HuggingFace: {e}")
            print("Attempting to use existing data files...")

        # Check if data files exist
        required_files = ["customers.csv", "articles.csv", "transactions_train.csv"]
        for filename in required_files:
            filepath = os.path.join(data_path, filename)
            if not os.path.exists(filepath):
                raise FileNotFoundError(
                    f"Required data file not found: {filepath}. "
                    f"Please ensure the sample dataset is available or check HuggingFace connection."
                )

        # Initialize KumoRFM
        api_key = os.environ.get("KUMO_API_KEY")
        if not api_key:
            raise ValueError("KUMO_API_KEY environment variable not set")

        rfm.init(api_key=api_key)

        # Load data
        print(f"Loading H&M sample data from: {data_path}")
        self.customers_df = pd.read_csv(f"{data_path}/customers.csv")
        self.articles_df = pd.read_csv(f"{data_path}/articles.csv")
        self.transactions_df = pd.read_csv(f"{data_path}/transactions_train.csv")

        print(f"Loaded data shapes: customers={self.customers_df.shape}, "
              f"articles={self.articles_df.shape}, transactions={self.transactions_df.shape}")
        
        # Create local tables
        customers = rfm.LocalTable(self.customers_df, name="customers").infer_metadata()
        transactions = rfm.LocalTable(self.transactions_df, name="transactions").infer_metadata()
        articles = rfm.LocalTable(self.articles_df, name="articles").infer_metadata()
        
        # Update semantic types
        customers["customer_id"].stype = "ID"
        customers["age"].stype = "numerical"
        
        # Set primary keys
        customers.primary_key = "customer_id"
        articles.primary_key = "article_id"
        
        # Set time column
        transactions.time_column = "t_dat"
        
        # Create graph
        graph = rfm.LocalGraph(tables=[customers, transactions, articles])
        graph.link(src_table="transactions", fkey="customer_id", dst_table="customers")
        graph.link(src_table="transactions", fkey="article_id", dst_table="articles")
        
        # Create model
        self.model = rfm.KumoRFM(graph=graph)
        self.is_initialized = True
    
    def predict(self, query: str):
        """Make a prediction using KumoRFM"""
        if not self.is_initialized:
            raise RuntimeError("KumoRFM service not initialized")
        return self.model.predict(query)


# Global instance
kumo_service = KumoRFMService()
