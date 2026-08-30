# AI Defense Lab Backend

Local executable FastAPI prototype for the Red Team / Blue Team payment-security workflow.

## Run

From the repository root:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

The database is initialized automatically at `backend/data/results.db`. Set values from `.env.example` in the process environment when needed.

## API

- `GET /health`
- `GET /api/v1/attacks`
- `POST /api/v1/attacks/{attack_id}/generate`
- `POST /api/v1/attacks/{attack_id}/detect`
- `GET /api/v1/runs`
- `GET /api/v1/runs/{run_id}`
- `GET /api/v1/runs/{run_id}/results`
- `GET /api/v1/models`
- `GET /api/v1/models/{model_id}`
- `POST /api/v1/feedback`
- `POST /api/v1/models/retrain`

Swagger UI is available at `/docs`.

## Workflow

Generation creates deterministic synthetic records and persists a run. Detection scores those records with attack-specific interpretable features, evaluates predictions, and persists the normalized result. Feedback is recorded against a run; retraining creates an explicit model version and promotes it only when the configured improvement criterion passes.

Deepfake voice is implemented at the metadata simulation layer, not as a production audio detector. All generated data is synthetic.

## Tests

```powershell
python -m unittest backend.tests.test_core -v
```
