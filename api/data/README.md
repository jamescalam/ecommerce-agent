# H&M Sample Dataset

This directory contains a curated sample of the H&M Personalized Fashion Recommendations dataset, optimized for fast loading and development.

## Dataset Overview

| File | Records | Size | Description |
|------|---------|------|-------------|
| `customers.csv` | 1,100 | ~0.1 MB | Customer demographics and membership info |
| `articles.csv` | 5,000 | ~1.5 MB | Product catalog with detailed attributes |
| `transactions_train.csv` | 15,773 | ~1.0 MB | Purchase history and behavior data |
| `sample_stats.csv` | 1 | <1 KB | Statistics about the download source |

## Sample Selection Criteria

### Customers (1,100 total)
- **200 high-value customers** - Top spenders by total purchase amount
- **131 frequent shoppers** - Most transactions per customer
- **199 recently active** - Latest purchase dates  
- **185 long-term customers** - Longest engagement periods
- **285 random active** - General active customer base
- **100 inactive customers** - For churn prediction and testing

### Articles (5,000 total)
- Curated selection of products from the H&M catalog
- Maintains full product attribute data and categories
- Includes diverse product types and categories

### Transactions (15,773 total)
- Complete purchase history for selected customers
- Preserves temporal relationships and shopping patterns
- Includes price, sales channel, and date information

## Data Quality

✅ **Relationships preserved** - All foreign key relationships intact  
✅ **Temporal consistency** - Purchase dates and sequences maintained  
✅ **Diversity maintained** - Represents various customer segments  
✅ **Analytics ready** - Suitable for all prediction tasks  
✅ **Performance optimized** - 99%+ reduction in data size vs. full dataset  

## Size Comparison

| Metric | Original Dataset | Sample Dataset | Reduction |
|--------|------------------|----------------|-----------|
| Customers | 1,371,980 | 1,100 | 99.9% |
| Articles | 105,542 | 5,000 | 95.3% |
| Transactions | 31,788,324 | 15,773 | 99.9% |
| Total Size | ~7 GB | ~2.6 MB | 99.9% |

## Use Cases

This sample dataset supports all major ecommerce analytics:

- **Customer Analytics**: Churn prediction, segmentation, lifetime value
- **Product Analytics**: Demand forecasting, recommendation systems  
- **Purchase Prediction**: Next purchase timing and likelihood
- **Marketing Analytics**: Campaign targeting, personalization
- **Trend Analysis**: Seasonal patterns, category performance

## Data Source

This directory contains data automatically downloaded from HuggingFace Datasets:
- **Source**: [`jamescalam/hm-sample`](https://huggingface.co/datasets/jamescalam/hm-sample) on HuggingFace
- **Original Dataset**: H&M Personalized Fashion Recommendations (Kaggle Competition)
- **Download Method**: HuggingFace datasets library
- **License**: Competition data usage terms apply
- **Auto-refresh**: Data is downloaded on first startup if not present

## Schema

### customers.csv
- `customer_id`: Unique customer identifier (hashed)
- `FN`, `Active`, `club_member_status`: Customer status info
- `fashion_news_frequency`: Newsletter subscription preference  
- `age`: Customer age
- `postal_code`: Geographic location (hashed)

### articles.csv  
- `article_id`: Unique product identifier
- `prod_name`: Product name/description
- `product_type_name`, `product_group_name`: Product categorization
- `colour_group_name`: Color information
- `department_name`, `index_group_name`: Organizational hierarchy
- `detail_desc`: Detailed product description
- Additional attributes for size, material, etc.

### transactions_train.csv
- `t_dat`: Transaction date (YYYY-MM-DD format)
- `customer_id`: Customer identifier (links to customers.csv)
- `article_id`: Product identifier (links to articles.csv)  
- `price`: Purchase price (normalized)
- `sales_channel_id`: Sales channel (1=online, 2=store)

This curated dataset provides a perfect balance between realistic complexity and development efficiency!
