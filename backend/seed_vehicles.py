from app.database import engine
from sqlalchemy import text

def check_and_seed():
    with engine.connect() as conn:
        enum_res = conn.execute(text("""
            SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'vehiclestatus'
        """)).fetchall()
        labels = [r[0] for r in enum_res]
        print("PG vehiclestatus enum values:", labels)

        sample_vehicle = conn.execute(text("SELECT status FROM vehicles LIMIT 1")).fetchone()
        print("Sample existing vehicle status:", sample_vehicle[0] if sample_vehicle else "None")

        status_val = labels[0] if labels else "AVAILABLE"

        vehicles = [
            ("FL-002", "NY-2245", "Delivery Van", 5.0, "Electric", 40.7128, -74.0060),
            ("FL-003", "NY-3367", "Heavy Duty Truck", 18.0, "Diesel", 12.9716, 77.5946),
            ("FL-004", "NY-4489", "Container Carrier", 25.0, "Hybrid", 18.9220, 72.8347),
        ]

        for vid, reg, vtype, cap, fuel, lat, lng in vehicles:
            exists = conn.execute(text("SELECT id FROM vehicles WHERE vehicle_id = :vid"), {"vid": vid}).fetchone()
            if not exists:
                conn.execute(text(f"""
                    INSERT INTO vehicles (vehicle_id, registration_number, vehicle_type, capacity, fuel_type, status, current_lat, current_lng)
                    VALUES (:vid, :reg, :vtype, :cap, :fuel, '{status_val}', :lat, :lng)
                """), {"vid": vid, "reg": reg, "vtype": vtype, "cap": cap, "fuel": fuel, "lat": lat, "lng": lng})
                conn.commit()
                print(f"Inserted {vid}")
            else:
                print(f"{vid} already exists")

        rows = conn.execute(text("SELECT vehicle_id, registration_number, vehicle_type, status FROM vehicles ORDER BY vehicle_id")).fetchall()
        print("\nAll Vehicles in Fleet Registry:")
        for r in rows:
            print(f" - {r[0]}: {r[1]} ({r[2]}) -> {r[3]}")

if __name__ == "__main__":
    check_and_seed()
