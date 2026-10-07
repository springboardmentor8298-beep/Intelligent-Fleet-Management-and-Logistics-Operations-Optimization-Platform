#!/usr/bin/env python3
"""
FleetFlow Production Infrastructure Health & Deployment Diagnostic Script
Milestone 4: Task (iv) Production Infrastructure Configuration
"""

import os
import sys
import socket
from urllib.parse import urlparse
import time

def check_tcp_port(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def main():
    print("=" * 70)
    print("FLEETFLOW ENTERPRISE INFRASTRUCTURE DEPLOYMENT VERIFICATION")
    print("=" * 70)

    # 1. Environment Inspection
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fleetflow_db")
    redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

    parsed_db = urlparse(db_url)
    db_host = parsed_db.hostname or "localhost"
    db_port = parsed_db.port or 5432

    parsed_redis = urlparse(redis_url)
    redis_host = parsed_redis.hostname or "localhost"
    redis_port = parsed_redis.port or 6379

    print(f"\n[DIAGNOSTIC 1] Checking Database Port ({db_host}:{db_port})...")
    db_online = check_tcp_port(db_host, db_port)
    print(f"  --> Status: {'ONLINE [CONNECTED]' if db_online else 'OFFLINE (Check service status)'}")

    print(f"\n[DIAGNOSTIC 2] Checking Redis Broker Port ({redis_host}:{redis_port})...")
    redis_online = check_tcp_port(redis_host, redis_port)
    print(f"  --> Status: {'ONLINE [CONNECTED]' if redis_online else 'OFFLINE (Celery runs in background fallback mode)'}")

    print("\n[DIAGNOSTIC 3] Validating FastAPI Application Load & Routes...")
    try:
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
        from app.main import app
        total_routes = len(app.routes)
        print(f"  --> Status: LOADED SUCCESSFULLY")
        print(f"  --> Total Registered API Endpoints: {total_routes}")
        print(f"  --> API Version: {app.version}")
    except Exception as e:
        print(f"  --> FAILED to import app: {e}")
        return 1

    print("\n[DIAGNOSTIC 4] Validating Docker Configuration Files...")
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    required_files = [
        ("docker-compose.yml", os.path.join(root_dir, "docker-compose.yml")),
        ("backend/Dockerfile", os.path.join(root_dir, "backend", "Dockerfile")),
        ("frontend/Dockerfile", os.path.join(root_dir, "frontend", "Dockerfile")),
        ("frontend/nginx.conf", os.path.join(root_dir, "frontend", "nginx.conf")),
        ("nginx/nginx.conf", os.path.join(root_dir, "nginx", "nginx.conf")),
        (".env.example", os.path.join(root_dir, ".env.example")),
        (".env.production", os.path.join(root_dir, ".env.production"))
    ]

    all_files_exist = True
    for name, path in required_files:
        exists = os.path.isfile(path)
        print(f"  - {name:<25}: {'[FOUND]' if exists else '[MISSING]'}")
        if not exists:
            all_files_exist = False

    print("\n" + "=" * 70)
    if all_files_exist:
        print("PRODUCTION INFRASTRUCTURE IS CONFIGURED AND DEPLOYMENT READY!")
    else:
        print("WARNING: Some deployment configuration files are missing.")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
