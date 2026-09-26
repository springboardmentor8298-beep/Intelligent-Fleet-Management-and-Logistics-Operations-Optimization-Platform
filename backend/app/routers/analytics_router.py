from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    OperationalOverviewResponse, FleetUtilizationResponse,
    FleetPerformanceResponse, FuelAnalyticsResponse, FuelLogCreate, FuelLogResponse
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Operational Analytics & Dashboards"])

@router.get("/overview", response_model=OperationalOverviewResponse)
def get_operational_overview(db: Session = Depends(get_db)):
    """Retrieve top-level logistics operational metrics and fleet KPIs."""
    return AnalyticsService.get_operational_overview(db)

@router.get("/fleet-utilization", response_model=FleetUtilizationResponse)
def get_fleet_utilization(db: Session = Depends(get_db)):
    """Retrieve operational fleet utilization breakdown across asset classes and statuses."""
    return AnalyticsService.get_fleet_utilization(db)

@router.get("/performance", response_model=FleetPerformanceResponse)
def get_fleet_performance(db: Session = Depends(get_db)):
    """Retrieve performance dashboard data: reliability index, transit times, top drivers, and cost leaders."""
    return AnalyticsService.get_fleet_performance(db)

@router.get("/fuel", response_model=FuelAnalyticsResponse)
def get_fuel_analytics(db: Session = Depends(get_db)):
    """Retrieve dynamic fuel consumption monitoring, efficiency metrics, eco-routing savings, and anomaly alerts."""
    return AnalyticsService.get_fuel_analytics(db)

@router.post("/fuel/log", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
def log_fuel_consumption(payload: FuelLogCreate, db: Session = Depends(get_db)):
    """Record a fuel intake event with automated anomaly detection for leaks, sensor failures, or theft."""
    try:
        return AnalyticsService.log_fuel_consumption(db, payload)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record fuel log: {str(e)}")

@router.get("/export")
def export_operations_report(
    format: str = Query("csv", description="Export format ('csv' or 'json')"),
    db: Session = Depends(get_db)
):
    """Generate and download comprehensive operations and logistics executive report."""
    if format.lower() == "json":
        data = {
            "overview": AnalyticsService.get_operational_overview(db),
            "utilization": AnalyticsService.get_fleet_utilization(db),
            "performance": AnalyticsService.get_fleet_performance(db),
            "fuel": AnalyticsService.get_fuel_analytics(db)
        }
        return data

    csv_data = AnalyticsService.export_operations_report(db, format="csv")
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=FleetFlow_Logistics_Operations_Report.csv"}
    )
