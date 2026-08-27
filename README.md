# AI Defense Lab — Payment Security

An automated Red Team / Blue Team adversarial simulation and defense platform for payment fraud detection systems.

## Overview

AI Defense Lab simulates adversarial attack campaigns against payment detection engines and evaluates defense strategies in multi-round feedback loops:

- **Red Team (Attacker)**: Generates realistic synthetic payment transaction probes and evolving attack vectors (e.g. card testing, bin enumeration, velocity evasion).
- **Blue Team (Defender)**: Trains and updates machine learning detection models (such as XGBoost with SHAP explainability) and tier-based rules (ALLOW / CHALLENGE / BLOCK) to counter the evolving threats.
- **Feedback & Adaptation**: Evaluates false negatives and hard examples across iterative rounds, feeding edge cases back to adversarial generators and defense retrainers.

## Architecture

The platform follows a modular pipeline structure:

1. **Identify**: Attack definition and target surface profiling.
2. **Generate**: Red Team synthetic probe generation with statistical fidelity gates (KS-test / discriminator).
3. **Detect**: Blue Team inference, risk scoring, tier routing, and SHAP feature attributions.
4. **Evaluate**: Confusion matrix calculation, precision/recall/F1, AUC-ROC/PR, and per-tier stop rates.
5. **Feedback**: Failure clustering, hard example extraction, and next-round adaptation.

The reference attack implementation is available under `backend/attacks/card_testing/`.

## Quickstart

### 1. Prerequisites & Installation

```bash
# Clone and enter the repository
cd /Users/naushad/.gemini/antigravity/scratch/ai-defense-lab

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

### 2. Run the API Server

```bash
uvicorn backend.main:app --reload
```

The API docs will be accessible at [http://localhost:8000/docs](http://localhost:8000/docs).

## LLM Fallback Mode

AI Defense Lab supports full execution without external LLM provider API keys. By setting `LLM_PROVIDER=none` in `.env`, the system uses built-in rule-based and statistical heuristics for generation, clustering, and feedback analysis. When configured with an LLM provider key (`openai`, `anthropic`, etc.), advanced semantic analysis and strategy adaptation are enabled automatically.

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/v1/runs` | Trigger a new attack simulation / defense pipeline run |
| `GET` | `/api/v1/runs/{run_id}` | Retrieve pipeline execution status and intermediate stages |
| `GET` | `/api/v1/runs/{run_id}/metrics` | Fetch evaluation metrics and confusion matrices |
| `POST` | `/api/v1/attacks/card-testing/simulate` | Run standalone card testing adversarial simulation |
| `GET` | `/api/v1/models` | List available detection models |
