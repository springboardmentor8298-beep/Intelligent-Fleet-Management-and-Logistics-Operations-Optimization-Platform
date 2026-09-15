import os
from sqlalchemy import text
from app.database import engine, Base
import app.models

def migrate_schema():
    print("Running comprehensive database schema migration...")
    with engine.connect() as conn:
        Base.metadata.create_all(bind=engine)

        shipment_columns = [
            ("sender_name", "VARCHAR DEFAULT 'FleetFlow Dispatch'"),
            ("recipient_name", "VARCHAR DEFAULT 'Customer'"),
            ("recipient_phone", "VARCHAR"),
            ("weight_kg", "FLOAT DEFAULT 100.0"),
            ("origin_lat", "FLOAT DEFAULT 40.7128"),
            ("origin_lng", "FLOAT DEFAULT -74.0060"),
            ("destination_lat", "FLOAT DEFAULT 40.7484"),
            ("destination_lng", "FLOAT DEFAULT -73.9857"),
            ("speed_kmh", "FLOAT DEFAULT 0.0"),
            ("delivery_notes", "TEXT"),
            ("trip_id", "INTEGER"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("delivered_at", "TIMESTAMP")
        ]

        for col_name, col_type in shipment_columns:
            try:
                sql = f"ALTER TABLE shipments ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                conn.execute(text(sql))
                conn.commit()
            except Exception as e:
                print(f"shipments.{col_name}: {e}")

        # Ensure enum types if needed or status column type
        try:
            conn.execute(text("ALTER TABLE shipments ALTER COLUMN status TYPE VARCHAR;"))
            conn.commit()
        except Exception:
            pass

    print("Migration finished!")

if __name__ == "__main__":
    migrate_schema()
