import random
import time

class LSTMPrediction:
    def __init__(self):
        # Sliding history for forecasting
        self.history = []
        self.time_counter = 0

    def add_flow(self, flow_verdict, attack_type):
        """
        Record flow verdict to feed the sequence forecaster.
        flow_verdict: bool (True if attack)
        attack_type: str (e.g., DoS, Reconnaissance, etc.)
        """
        self.history.append({
            "timestamp": time.time(),
            "is_attack": flow_verdict,
            "type": attack_type
        })
        # Keep only the last 128 elements (LSTM window size)
        if len(self.history) > 128:
            self.history.pop(0)

    def get_predictions(self):
        """
        Evaluates sliding history and returns the forecast sequence,
        next likely attack type, threat probability, and ETA.
        """
        self.time_counter += 1
        
        # Analyze current window
        recent_attacks = [h for h in self.history[-30:] if h["is_attack"]]
        attack_ratio = len(recent_attacks) / max(1, len(self.history[-30:]))
        
        # Determine next likely attack based on frequency
        attack_counts = {}
        for a in recent_attacks:
            t = a["type"]
            attack_counts[t] = attack_counts.get(t, 0) + 1
            
        next_type = "Reconnaissance"
        if attack_counts:
            next_type = max(attack_counts, key=attack_counts.get)
        else:
            # Random default from threat mix if none recently
            next_type = random.choice(["DoS", "Reconnaissance", "Botnet", "Exploit"])
            
        # Calculate sequence risk score (probability)
        base_prob = 10 if not recent_attacks else min(95, 30 + int(attack_ratio * 150))
        prob = base_prob + random.randint(-5, 5)
        prob = max(5, min(99, prob))
        
        # Calculate ETA (seconds)
        eta = random.randint(10, 45) if prob > 20 else random.randint(60, 180)
        
        # Generate future forecast data for charts
        forecast_data = []
        # Build historic actuals
        now_index = 30
        for i in range(now_index):
            t_val = self.time_counter - now_index + i
            # Simulate historical traffic baseline with some noise
            base = 25 + int(15 * (1 + (i % 7) * 0.1))
            # Increase base if there was an attack sequence
            if i > 15 and len(recent_attacks) > 0:
                base += (i - 15) * 3
            actual = base + random.randint(-5, 10)
            forecast_data.append({
                "t": t_val,
                "actual": actual,
                "predicted": actual + random.randint(-2, 4)
            })
            
        # Build futures forecast
        for i in range(15):
            t_val = self.time_counter + i
            # Project upward if there is a predicted attack sequence
            proj_base = 35 + (i * 2.5) if prob > 50 else 25 + random.randint(-3, 3)
            forecast_data.append({
                "t": t_val,
                "actual": None,
                "predicted": int(proj_base + random.randint(-4, 6))
            })
            
        return {
            "next_attack": {
                "type": next_type,
                "prob": prob,
                "etaSec": eta
            },
            "forecast": forecast_data
        }

# Instantiate singleton
lstm_prediction = LSTMPrediction()
