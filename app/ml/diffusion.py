import os
import json
import networkx as nx
import numpy as np

class CropDiffusionModel:
    def __init__(self, num_nodes: int = 100, seed: int = 42) -> None:
        self.num_nodes = num_nodes
        self.graph = nx.barabasi_albert_graph(n=num_nodes, m=3, seed=seed)
        
        # Load calibrated parameters
        self.beta = 0.35
        self.gamma = 0.05
        self.r_critical = 0.55
        self.calibration_status = "experimental fallback"
        
        calib_path = "models/diffusion_calibration.json"
        if os.path.exists(calib_path):
            try:
                with open(calib_path, "r") as f:
                    cal = json.load(f)
                params = cal.get("parameters", {})
                if params:
                    self.beta = float(params.get("beta", self.beta))
                    self.gamma = float(params.get("gamma", self.gamma))
                    self.r_critical = float(params.get("r_critical", self.r_critical))
                    self.calibration_status = cal.get("calibration_status", self.calibration_status)
            except Exception:
                pass
        
    def run_sis_simulation(
        self, 
        initial_adoption: float = 0.42, 
        beta: float | None = None, 
        gamma: float | None = None, 
        steps: int = 20
    ) -> list[float]:
        """
        Runs an SIS (Susceptible-Infectious-Susceptible) crop diffusion simulation on the network.
        """
        states = np.zeros(self.num_nodes)
        b_val = beta if beta is not None else self.beta
        g_val = gamma if gamma is not None else self.gamma
        
        np.random.seed(42)
        initial_adopter_count = int(self.num_nodes * initial_adoption)
        adopters = np.random.choice(self.num_nodes, size=initial_adopter_count, replace=False)
        states[adopters] = 1
        
        history = [float(np.mean(states))]
        
        for _ in range(steps):
            new_states = states.copy()
            for node in self.graph.nodes():
                if states[node] == 0:
                    neighbors = list(self.graph.neighbors(node))
                    infected_neighbors = sum(states[nbr] == 1 for nbr in neighbors)
                    p_infect = 1 - (1 - b_val) ** infected_neighbors
                    if np.random.rand() < p_infect:
                        new_states[node] = 1
                else:
                    if np.random.rand() < g_val:
                        new_states[node] = 0
            states = new_states
            history.append(float(np.mean(states)))
            
        return history

    def evaluate_market_risk(
        self, 
        crop: str, 
        initial_adoption: float = 0.42, 
        beta: float | None = None, 
        gamma: float | None = None, 
        r_critical: float | None = None
    ) -> dict:
        b_val = beta if beta is not None else self.beta
        g_val = gamma if gamma is not None else self.gamma
        r_val = r_critical if r_critical is not None else self.r_critical
        
        history = self.run_sis_simulation(initial_adoption, b_val, g_val)
        peak_adoption = max(history)
        
        crop_clean = crop.lower()
        
        if "tomato" in crop_clean:
            oversupply_prob = min(max((peak_adoption - 0.2) / (r_val - 0.2) * 0.8, 0.1), 0.95)
            crash_prob = oversupply_prob * 0.9
        elif "chilli" in crop_clean:
            oversupply_prob = min(max((peak_adoption - 0.2) / (r_val - 0.2) * 0.4, 0.05), 0.5)
            crash_prob = oversupply_prob * 0.6
        else:
            oversupply_prob = min(max((peak_adoption - 0.2) / (r_val - 0.2) * 0.2, 0.05), 0.3)
            crash_prob = oversupply_prob * 0.3
            
        return {
            "peak_adoption_rate": round(peak_adoption, 4),
            "oversupply_risk_pct": round(oversupply_prob * 100, 2),
            "price_crash_prob_pct": round(crash_prob * 100, 2),
            "history": [round(h, 4) for h in history]
        }

    def simulate_what_if(
        self, 
        crop: str, 
        initial_adoption: float = 0.78, 
        shift_percent: float = 0.20,
        beta: float | None = None, 
        gamma: float | None = None, 
        r_critical: float | None = None,
        current_price: float | None = None
    ) -> dict:
        b_val = beta if beta is not None else self.beta
        g_val = gamma if gamma is not None else self.gamma
        r_val = r_critical if r_critical is not None else self.r_critical
        
        base_results = self.evaluate_market_risk(crop, initial_adoption, b_val, g_val, r_val)
        
        new_adoption = max(0.01, initial_adoption - shift_percent)
        shifted_results = self.evaluate_market_risk(crop, new_adoption, b_val, g_val, r_val)
        
        if current_price is not None:
            base_price = float(current_price)
            restored_price = float(base_price * (1.0 + (shift_percent * 0.5)))
            price_status = "simulated"
        else:
            base_price = None
            restored_price = None
            price_status = "unavailable"
            
        return {
            "model_type": "SIS-inspired diffusion simulation",
            "status": "simulation",
            "price_status": price_status,
            "base_case": {
                "initial_adoption_pct": round(initial_adoption * 100, 2),
                "peak_adoption_pct": round(base_results["peak_adoption_rate"] * 100, 2),
                "oversupply_risk_pct": base_results["oversupply_risk_pct"],
                "price_crash_prob_pct": base_results["price_crash_prob_pct"],
                "expected_price": base_price,
            },
            "what_if": {
                "shifted_adoption_pct": round(new_adoption * 100, 2),
                "peak_adoption_pct": round(shifted_results["peak_adoption_rate"] * 100, 2),
                "oversupply_risk_pct": shifted_results["oversupply_risk_pct"],
                "price_crash_prob_pct": shifted_results["price_crash_prob_pct"],
                "expected_price": restored_price,
            },
            "parameters": {
                "beta": b_val,
                "gamma": g_val,
                "r_critical": r_val,
                "calibration_status": self.calibration_status
            }
        }

# Module level helper exports
def simulate_diffusion(
    initial_adoption: float = 0.42, 
    beta: float | None = None, 
    gamma: float | None = None, 
    steps: int = 20
) -> list[float]:
    model = CropDiffusionModel()
    return model.run_sis_simulation(initial_adoption, beta, gamma, steps)

def calculate_saturation_risk(
    crop: str, 
    initial_adoption: float = 0.42, 
    beta: float | None = None, 
    gamma: float | None = None, 
    r_critical: float | None = None
) -> dict:
    model = CropDiffusionModel()
    b_val = beta if beta is not None else model.beta
    g_val = gamma if gamma is not None else model.gamma
    r_val = r_critical if r_critical is not None else model.r_critical
    
    results = model.evaluate_market_risk(crop, initial_adoption, b_val, g_val, r_val)
    
    history = results["history"]
    saturation_time = -1
    for t, val in enumerate(history):
        if val >= r_val:
            saturation_time = t
            break

    return {
        "model_type": "SIS-inspired diffusion simulation",
        "status": "simulation",
        "adoption_rate": results["peak_adoption_rate"],
        "saturation_time": saturation_time,
        "oversupply_risk": results["oversupply_risk_pct"] / 100.0,
        "parameters": {
            "beta": b_val,
            "gamma": g_val,
            "r_critical": r_val,
            "calibration_status": model.calibration_status
        }
    }
