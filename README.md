# Ecommerce Agent

An intelligent ecommerce analytics agent powered by KumoRFM and GraphAI, using the H&M Personalized Fashion Recommendations dataset.

## Features

🛍️ **Customer Analytics**
- Customer churn prediction
- Purchase likelihood forecasting
- Customer segmentation

📊 **Product Intelligence**  
- Product demand forecasting
- Sales trend analysis
- Inventory optimization insights

✉️ **Personalized Marketing**
- Automated email generation
- Customer-specific recommendations
- Targeted campaign insights

🔍 **Custom Queries**
- Natural language analytics
- Custom PQL (Predictive Query Language) queries
- Direct data exploration

## Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenAI API key
- KumoRFM API key

### Setup

1. **Set environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys:
   # OPENAI_API_KEY=your_openai_key
   # KUMO_API_KEY=your_kumo_key
   ```

2. **Start the system**
   ```bash
   docker-compose up
   ```

That's it! The system includes:
- ✅ Auto-download H&M sample dataset from HuggingFace (1,100 customers, 5K articles, 15K+ transactions)
- ✅ Fast startup (~30-60 seconds)
- ✅ All ecommerce analytics capabilities
- ✅ Representative data for demos and development

### Usage

Visit `http://localhost:3000` for the web interface, or use the API directly:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What customers are most likely to churn in the next 30 days?"}'
```

## Documentation

- 🛠️ **[Agent Setup Guide](ECOMMERCE_AGENT_SETUP.md)** - Agent architecture details
- 📊 **[Sample Data Guide](SAMPLE_DATA_GUIDE.md)** - Understanding the curated dataset

## Example Queries

- "Predict demand for article 685687003 over the next 30 days"
- "Find customers likely to churn and generate personalized emails"
- "What are the top selling products by category this quarter?"
- "Show me customers with the highest purchase likelihood"
- "Generate a marketing email for customer ID xyz123"

## Architecture

- **Sample Dataset**: H&M data auto-downloaded from HuggingFace (`jamescalam/hm-sample`)
- **API Service**: KumoRFM-powered GraphAI agent
- **Frontend**: React-based chat interface
- **Monitoring**: Jaeger tracing + Prometheus metrics

## Development

```bash
# Install dependencies
cd api && pip install -e .

# Run tests
python test_integration.py

# Example usage
python example_usage.py
```

## Sample Dataset

The system automatically downloads a curated sample of the H&M Personalized Fashion Recommendations dataset from HuggingFace:

- **1,100 customers** with demographic and membership data
- **5,000 articles** (products with full metadata)
- **15,773 transactions** (complete purchase history)

This sample preserves all data relationships while being fast enough for development and demos. The dataset is sourced from [`jamescalam/hm-sample`](https://huggingface.co/datasets/jamescalam/hm-sample) on HuggingFace and includes:
- Diverse customer segments for analytics
- Rich product catalog with detailed attributes
- Comprehensive transaction history for predictions

## Troubleshooting

For common issues, check the logs:
```bash
docker-compose logs api
```

Common solutions:
- Ensure KUMO_API_KEY and OPENAI_API_KEY are set
- Check that port 8000 is available
- Restart containers if needed: `docker-compose restart`

---

Built with [GraphAI](https://docs.aurelio.ai/graphai/) • [KumoRFM](https://kumo.ai/) • [FastAPI](https://fastapi.tiangolo.com/)
