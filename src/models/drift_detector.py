import logging
from typing import Dict, Tuple, Any
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)

class DriftMonitor:
    """
    Statistical Drift Detector using the Two-Sample Kolmogorov-Smirnov (KS) test.
    """
    
    @staticmethod
    def detect_drift(reference_data: pd.DataFrame, 
                     current_data: pd.DataFrame, 
                     threshold: float = 0.05) -> Tuple[bool, Dict[str, Any]]:
        """
        Compare current_data features against reference_data to detect statistical drift.
        
        Returns:
            Tuple containing:
            - A boolean indicating if global drift was detected.
            - A dictionary detailing the p-values for each feature and whether it drifted.
        """
        if reference_data.empty or current_data.empty:
            raise ValueError("Both reference and current data must be non-empty DataFrames.")
            
        common_features = set(reference_data.columns).intersection(set(current_data.columns))
        
        if not common_features:
            raise ValueError("No common features found between reference and current data.")
            
        global_drift_detected = False
        drift_report = {}

        logger.info(f"Running KS-test for data drift on {len(common_features)} features with threshold {threshold}.")

        for feature in common_features:
            # Skip non-numeric columns
            if not pd.api.types.is_numeric_dtype(reference_data[feature]):
                continue

            ref_series = reference_data[feature].dropna()
            cur_series = current_data[feature].dropna()

            if len(ref_series) < 2 or len(cur_series) < 2:
                logger.warning(f"Not enough valid data points for feature '{feature}' to perform KS test. Skipping.")
                continue

            # Perform the Two-Sample Kolmogorov-Smirnov test
            try:
                statistic, p_value = stats.ks_2samp(ref_series, cur_series)
                
                # If p_value is less than our threshold, we reject the null hypothesis 
                # that the two samples were drawn from the same distribution.
                drifted = p_value < threshold
                
                drift_report[feature] = {
                    "p_value": float(p_value),
                    "statistic": float(statistic),
                    "drift_detected": bool(drifted)
                }
                
                if drifted:
                    logger.warning(f"Data drift detected in feature '{feature}'! (p-value: {p_value:.5f} < {threshold})")
                    global_drift_detected = True

            except Exception as e:
                logger.error(f"Error performing KS test on feature '{feature}': {e}")
                
        return global_drift_detected, drift_report
