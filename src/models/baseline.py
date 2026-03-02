import os
import logging
from typing import Dict, Any, Optional
import pandas as pd
import xgboost as xgb

logger = logging.getLogger(__name__)

class BaselineModel:
    """
    XGBoost Regressor model to predict CPU usage based on server metrics.
    """
    def __init__(self, params: Optional[Dict[str, Any]] = None):
        """
        Initialize the XGBoost model with hyperparameters.
        """
        default_params = {
            'objective': 'reg:squarederror',
            'learning_rate': 0.1,
            'max_depth': 5,
            'n_estimators': 100,
            'random_state': 42
        }
        self.params = params if params is not None else default_params
        self.model = xgb.XGBRegressor(**self.params)
        self.is_trained = False

    def train(self, X: pd.DataFrame, y: pd.Series) -> None:
        """
        Train the XGBoost Regressor on the provided features and target.
        """
        logger.info(f"Training XGBoost model on {len(X)} samples with {len(X.columns)} features.")
        try:
            self.model.fit(X, y)
            self.is_trained = True
            logger.info("Model training completed successfully.")
        except Exception as e:
            logger.error(f"Failed to train the model: {e}")
            raise e

    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Predict CPU usage using the trained model.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling predict().")
        
        logger.debug(f"Predicting on {len(X)} samples.")
        try:
            predictions = self.model.predict(X)
            return pd.Series(predictions, index=X.index, name="predicted_cpu_usage")
        except Exception as e:
            logger.error(f"Failed to generate predictions: {e}")
            raise e

    def save_model(self, filepath: str) -> None:
        """
        Save the trained model to disk in native XGBoost JSON format.
        """
        if not self.is_trained:
            raise ValueError("Cannot save an untrained model.")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        
        try:
            self.model.save_model(filepath)
            logger.info(f"Model successfully saved to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save the model to {filepath}: {e}")
            raise e

    def load_model(self, filepath: str) -> None:
        """
        Load a previously saved XGBoost model from disk.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
            
        try:
            self.model.load_model(filepath)
            self.is_trained = True
            logger.info(f"Model successfully loaded from {filepath}")
        except Exception as e:
            logger.error(f"Failed to load the model from {filepath}: {e}")
            raise e
