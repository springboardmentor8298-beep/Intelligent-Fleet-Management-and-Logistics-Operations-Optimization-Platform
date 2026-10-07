import sys, os, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.database import engine
from sqlalchemy import text, inspect

def sync_data():
    insp = inspect(engine)
    tables = [
        'users',
        'vehicles',
        'drivers',
        'trips',
        'shipments',
        'shipment_events',
        'gps_breadcrumbs',
        'maintenance_logs',
        'maintenance_alerts',
        'fuel_logs',
        'driver_assignment_history',
        'notifications'
    ]

    sql_statements = []
    # Disable foreign key checks / truncate
    sql_statements.append("BEGIN;")
    for t in reversed(tables):
        sql_statements.append(f"TRUNCATE TABLE {t} CASCADE;")

    with engine.connect() as conn:
        for t in tables:
            cols = [c['name'] for c in insp.get_columns(t)]
            rows = conn.execute(text(f"SELECT * FROM {t}")).fetchall()
            print(f"Table '{t}': {len(rows)} rows")
            if not rows:
                continue

            col_names_str = ", ".join([f'"{c}"' for c in cols])
            for r in rows:
                val_strs = []
                for v in r:
                    if v is None:
                        val_strs.append("NULL")
                    elif isinstance(v, (int, float)):
                        val_strs.append(str(v))
                    elif isinstance(v, bool):
                        val_strs.append("TRUE" if v else "FALSE")
                    else:
                        escaped = str(v).replace("'", "''")
                        val_strs.append(f"'{escaped}'")
                vals_str = ", ".join(val_strs)
                sql_statements.append(f"INSERT INTO {t} ({col_names_str}) VALUES ({vals_str});")

    sql_statements.append("COMMIT;")
    full_sql = "\n".join(sql_statements)

    sql_file = os.path.join(os.path.dirname(__file__), "sync_dump.sql")
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(full_sql)

    print("\nPiping UTF-8 SQL into Docker container 'fleetflow-postgres'...")
    with open(sql_file, "rb") as f:
        proc = subprocess.run(
            ["docker", "exec", "-i", "fleetflow-postgres", "psql", "-U", "postgres", "-d", "fleetflow_db"],
            stdin=f,
            capture_output=True
        )

    if proc.returncode == 0:
        print("SUCCESS! All data synchronized into Docker database.")
        if os.path.exists(sql_file):
            os.remove(sql_file)
    else:
        print(f"Error executing SQL in container:\n{proc.stderr.decode('utf-8', errors='replace')}")

if __name__ == "__main__":
    sync_data()
