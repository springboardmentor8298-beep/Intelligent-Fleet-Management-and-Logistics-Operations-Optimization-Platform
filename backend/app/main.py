from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth_router, vehicle_router

# Auto-generate DB schema tables if not migrating through alembic immediately
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FleetFlow Logistics Platform",
    description="Fleet Management & Logistics Tracking Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(vehicle_router.router)

@app.get("/")
def root():
    return {"status": "FleetFlow API operational", "version": "1.0.0"}