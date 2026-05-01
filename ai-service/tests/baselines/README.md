This directory stores committed model regression baselines.

Generate/update baseline:

```bash
cd ai-service
AI_REGRESSION_UPDATE_BASELINE=true python -m unittest tests.model_regression_test -v
```

This creates `model_regression_baseline.json`.
