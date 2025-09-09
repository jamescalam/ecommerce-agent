import os

import pandas as pd
from kumoai.experimental import rfm


class KumoRFMService:
    """Service for managing KumoRFM model and data"""
    
    def __init__(self):
        self.model = None
        self.customers_df = None
        self.articles_df = None
        self.transactions_df = None
        self.is_initialized = False
    
    def initialize(self, data_path: str | None = None, use_sample: bool = None):
        """Initialize KumoRFM with H&M dataset
        
        Args:
            data_path: Path to data directory (uses DATA_DIR env var if not provided)
            use_sample: Use sample dataset for faster loading (uses USE_SAMPLE_DATA env var if not provided)
        """
        if self.is_initialized:
            return
        
        # Check if we should use sample data
        if use_sample is None:
            use_sample = os.environ.get("USE_SAMPLE_DATA", "false").lower() in ["true", "1", "yes"]
        
        # Get data path from environment or use default
        if data_path is None:
            if use_sample:
                data_path = os.environ.get("SAMPLE_DATA_DIR", "/app/data_sample")
            else:
                data_path = os.environ.get("DATA_DIR", "hm_data")
        
        # Check if data files exist
        required_files = ["customers.csv", "articles.csv", "transactions_train.csv"]
        for filename in required_files:
            filepath = os.path.join(data_path, filename)
            if not os.path.exists(filepath):
                raise FileNotFoundError(
                    f"Required data file not found: {filepath}. "
                    f"Make sure the data-init container has completed successfully."
                )
        
        # Initialize KumoRFM
        api_key = os.environ.get("KUMO_API_KEY")
        if not api_key:
            raise ValueError("KUMO_API_KEY environment variable not set")
        
        rfm.init(api_key=api_key)
        
        # Load data
        data_type = "SAMPLE" if use_sample else "FULL"
        print(f"Loading {data_type} data from: {data_path}")
        self.customers_df = pd.read_csv(f"{data_path}/customers.csv")
        self.articles_df = pd.read_csv(f"{data_path}/articles.csv")
        self.transactions_df = pd.read_csv(f"{data_path}/transactions_train.csv")
        
        print(f"Loaded {data_type} data shapes: customers={self.customers_df.shape}, "
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
