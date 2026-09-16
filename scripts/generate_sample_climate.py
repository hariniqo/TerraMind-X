import os
import random

def generate_sample_data():
    models = ["ACCESS-CM2", "EC-Earth3", "MRI-ESM2-0"]
    scenarios = ["historical", "ssp126", "ssp245", "ssp370", "ssp585"]
    variables = ["PrecipData", "TasmaxData", "TasminData"]
    
    # We will generate a grid of coordinates around South India (including Tamil Nadu and Kerala)
    # Lats: 8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0
    # Lons: 75.0, 75.5, 76.0, 76.5, 77.0, 77.5, 78.0, 78.5, 79.0, 79.5, 80.0
    lats = [8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0]
    lons = [75.0, 75.5, 76.0, 76.5, 77.0, 77.5, 78.0, 78.5, 79.0, 79.5, 80.0]
    
    # Generate coordinates grid (Row 1 is lon, Row 2 is lat)
    coords = []
    for lat in lats:
        for lon in lons:
            coords.append((lon, lat))
            
    # Selected years to keep file size small but cover historical & projection targets
    years_by_scen = {
        "historical": [2014, 2015],
        "ssp126": [2030, 2050, 2080],
        "ssp245": [2030, 2050, 2080],
        "ssp370": [2030, 2050, 2080],
        "ssp585": [2030, 2050, 2080]
    }
    
    output_base = os.path.join("data", "climate_raw")
    os.makedirs(output_base, exist_ok=True)
    
    print(f"Generating sample raw climate files under {output_base}...")
    
    for model in models:
        for scenario in scenarios:
            scen_dir = os.path.join(output_base, model, scenario)
            os.makedirs(scen_dir, exist_ok=True)
            
            years = years_by_scen[scenario]
            
            for var in variables:
                file_path = os.path.join(scen_dir, var)
                
                # Write the header rows
                # Row 1: empty empty empty lons...
                # Row 2: empty empty empty lats...
                lon_row = ["", "", ""] + [f"{c[0]:.4f}" for c in coords]
                lat_row = ["", "", ""] + [f"{c[1]:.4f}" for c in coords]
                
                rows = [
                    " ".join(lon_row),
                    " ".join(lat_row)
                ]
                
                # Write the daily values
                # Row 3 onwards: Year Month Day values...
                # Generate a few days per month to keep it extremely small
                for year in years:
                    for month in [1, 5, 8, 11]:  # representative months for seasons
                        for day in [1, 15]:      # representative days
                            val_row = [str(year), str(month), str(day)]
                            for lon, lat in coords:
                                # Generate realistic values based on coordinate, season, and scenario
                                if var == "PrecipData":
                                    # Monsoonal rainfall in summer/monsoon months
                                    base_rain = 15.0 if month in [5, 8] else 2.0
                                    # Add some variation based on location (coastal vs dry inland)
                                    loc_factor = 2.0 if lon < 77.0 else 0.5
                                    # Climate change shifts (ssp585 has more heavy rain days)
                                    scen_factor = 1.2 if scenario == "ssp585" and year > 2050 else 1.0
                                    val = max(0.0, random.gauss(base_rain * loc_factor * scen_factor, 5.0))
                                    val_row.append(f"{val:.4f}")
                                elif var == "TasmaxData":
                                    # Temperature
                                    base_temp = 34.0 if month in [5, 8] else 29.0
                                    # Cool hills (Wayanad etc) vs plains
                                    loc_factor = -5.0 if (lon < 76.5 and lat > 11.0) else 0.0
                                    # Climate change heating
                                    heat_anomaly = 0.0
                                    if year == 2030:
                                        heat_anomaly = 0.6 if scenario == "ssp245" else 0.8
                                    elif year == 2050:
                                        heat_anomaly = 1.2 if scenario == "ssp245" else 2.2
                                    elif year == 2080:
                                        heat_anomaly = 1.9 if scenario == "ssp245" else 3.8
                                    val = base_temp + loc_factor + heat_anomaly + random.uniform(-2.0, 2.0)
                                    val_row.append(f"{val:.2f}")
                                else:  # TasminData
                                    base_temp = 24.0 if month in [5, 8] else 20.0
                                    loc_factor = -5.0 if (lon < 76.5 and lat > 11.0) else 0.0
                                    heat_anomaly = 0.0
                                    if year == 2030:
                                        heat_anomaly = 0.5 if scenario == "ssp245" else 0.7
                                    elif year == 2050:
                                        heat_anomaly = 1.0 if scenario == "ssp245" else 1.9
                                    elif year == 2080:
                                        heat_anomaly = 1.6 if scenario == "ssp245" else 3.3
                                    val = base_temp + loc_factor + heat_anomaly + random.uniform(-2.0, 2.0)
                                    val_row.append(f"{val:.2f}")
                                    
                            rows.append(" ".join(val_row))
                
                with open(file_path, "w") as f:
                    f.write("\n".join(rows) + "\n")
                    
    print("Sample climate projections generated successfully.")

if __name__ == "__main__":
    generate_sample_data()
