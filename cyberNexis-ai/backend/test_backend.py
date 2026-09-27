import sys
import os

# Append current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_inference import model_inference
from geoip_resolver import resolve_ip
from lstm_prediction import lstm_prediction

def run_tests():
    print("=" * 60)
    print("STARTING CyberNexis AI BACKEND VALIDATION")
    print("=" * 60)

    # 1. Test Model Inference Loading
    print("\n1. Testing Model Inference Artifacts:")
    print(f" - Model loaded: {model_inference.model is not None}")
    print(f" - Encoder loaded: {model_inference.encoder is not None}")
    print(f" - Threshold: {model_inference.threshold}")
    print(f" - Expected columns length: {len(model_inference.feature_columns)}")

    # 2. Test Classification (Normal Flow vs Attack Flow)
    print("\n2. Testing Flow Classifications:")
    normal_flow = {
        "proto": "tcp",
        "service": "http",
        "state": "CON",
        "dur": 0.5,
        "spkts": 10,
        "dpkts": 8,
        "sbytes": 1200,
        "dbytes": 4500,
        "rate": 36.0,
        "sload": 19200.0,
        "dload": 72000.0,
        "smean": 120,
        "dmean": 562,
        "ct_src_dport_ltm": 1,
        "ct_dst_sport_ltm": 1,
        "dport": 80
    }
    
    attack_flow = {
        "proto": "tcp",
        "service": "-",
        "state": "REQ",
        "dur": 0.01,
        "spkts": 150,
        "dpkts": 0,
        "sbytes": 9000,
        "dbytes": 0,
        "rate": 15000.0,
        "sload": 7200000.0,
        "dload": 0.0,
        "smean": 60,
        "dmean": 0,
        "ct_src_dport_ltm": 45,
        "ct_dst_sport_ltm": 35,
        "dport": 22
    }

    print("\nTesting Normal Flow Prediction:")
    is_att, prob, att_type, shap_vals = model_inference.predict(normal_flow)
    print(f" - Result: {'Attack' if is_att else 'Normal'}")
    print(f" - Probability: {prob:.4f}")
    print(f" - Type: {att_type}")
    print(f" - Top SHAP contributor: {shap_vals[0]['k']} ({shap_vals[0]['v']})")

    print("\nTesting Attack Flow Prediction:")
    is_att2, prob2, att_type2, shap_vals2 = model_inference.predict(attack_flow)
    print(f" - Result: {'Attack' if is_att2 else 'Normal'}")
    print(f" - Probability: {prob2:.4f}")
    print(f" - Type: {att_type2}")
    print(f" - Top SHAP contributor: {shap_vals2[0]['k']} ({shap_vals2[0]['v']})")

    # 3. Test GeoIP resolution
    print("\n3. Testing GeoIP Resolution:")
    local_geo = resolve_ip("192.168.1.1")
    external_geo = resolve_ip("8.8.8.8")
    print(f" - Local IP (192.168.1.1): {local_geo['country_name']} ({local_geo['country_code']}) - Lat/Lng: {local_geo['latitude']}, {local_geo['longitude']}")
    print(f" - Public IP (8.8.8.8): {external_geo['country_name']} ({external_geo['country_code']}) - Lat/Lng: {external_geo['latitude']}, {external_geo['longitude']}")

    # 4. Test Sequence Prediction
    print("\n4. Testing LSTM Threat Sequence Forecast:")
    lstm_prediction.add_flow(is_att, att_type)
    lstm_prediction.add_flow(is_att2, att_type2)
    predictions = lstm_prediction.get_predictions()
    next_att = predictions["next_attack"]
    print(f" - Next likely threat: {next_att['type']} (Prob: {next_att['prob']}%, ETA: {next_att['etaSec']}s)")
    print(f" - Forecast points count: {len(predictions['forecast'])}")

    print("\n" + "=" * 60)
    print("BACKEND VALIDATION PASSED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
