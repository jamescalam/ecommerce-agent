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
- Kaggle account with API credentials
- OpenAI API key
- KumoRFM API key

### Setup

1. **Get Kaggle credentials** from [kaggle.com/settings](https://kaggle.com/settings)
   ```bash
   mkdir -p ~/.kaggle
   cp path/to/kaggle.json ~/.kaggle/
   chmod 600 ~/.kaggle/kaggle.json
   ```

2. **Accept competition terms** at [H&M Competition Page](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations)

3. **Set environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Start the system**
   ```bash
   docker-compose up
   ```

The system will automatically:
- Download the H&M dataset (~7GB) 
- Prepare data for KumoRFM
- Initialize the agent
- Start the API server on port 8000

### Usage

Visit `http://localhost:3000` for the web interface, or use the API directly:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What customers are most likely to churn in the next 30 days?"}'
```

## Documentation

- 📋 **[Data Setup Guide](DATA_SETUP.md)** - Detailed setup instructions
- 🛠️ **[Agent Setup Guide](ECOMMERCE_AGENT_SETUP.md)** - Agent architecture details

## Example Queries

- "Predict demand for article 685687003 over the next 30 days"
- "Find customers likely to churn and generate personalized emails"
- "What are the top selling products by category this quarter?"
- "Show me customers with the highest purchase likelihood"
- "Generate a marketing email for customer ID xyz123"

## Architecture

- **Init Container**: Downloads and prepares H&M dataset
- **API Service**: KumoRFM-powered GraphAI agent
- **Frontend**: React-based chat interface  
- **Persistent Storage**: Docker volumes for data persistence
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

## Troubleshooting

See [DATA_SETUP.md](DATA_SETUP.md) for common issues and solutions.

---

Built with [GraphAI](https://docs.aurelio.ai/graphai/) • [KumoRFM](https://kumo.ai/) • [FastAPI](https://fastapi.tiangolo.com/)
