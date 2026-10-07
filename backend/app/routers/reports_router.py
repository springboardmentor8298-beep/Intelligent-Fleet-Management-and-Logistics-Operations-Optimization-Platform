from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Reports & Export Module"])

@router.get("/fleet-utilization")
def get_fleet_utilization_report(
    format: str = Query("json", description="Export format: json, csv, excel, pdf"),
    db: Session = Depends(get_db)
):
    """Generate and download Fleet Utilization report."""
    return export_report_handler("fleet_utilization", format, db)

@router.get("/fuel-consumption")
def get_fuel_consumption_report(
    format: str = Query("json", description="Export format: json, csv, excel, pdf"),
    db: Session = Depends(get_db)
):
    """Generate and download Fleet Fuel Consumption report."""
    return export_report_handler("fuel_consumption", format, db)

@router.get("/driver-performance")
def get_driver_performance_report(
    format: str = Query("json", description="Export format: json, csv, excel, pdf"),
    db: Session = Depends(get_db)
):
    """Generate and download Commercial Driver Performance report."""
    return export_report_handler("driver_performance", format, db)

@router.get("/delivery-performance")
def get_delivery_performance_report(
    format: str = Query("json", description="Export format: json, csv, excel, pdf"),
    db: Session = Depends(get_db)
):
    """Generate and download Delivery & Consignment Performance report."""
    return export_report_handler("delivery_performance", format, db)

@router.get("/maintenance")
def get_maintenance_report(
    format: str = Query("json", description="Export format: json, csv, excel, pdf"),
    db: Session = Depends(get_db)
):
    """Generate and download Vehicle Maintenance & Servicing report."""
    return export_report_handler("maintenance", format, db)

def export_report_handler(report_type: str, format: str, db: Session):
    data = ReportsService.get_report_data(report_type, db)
    fmt = format.lower().strip()

    if fmt == "json":
        return data

    filename_prefix = f"FleetFlow_{report_type.title().replace('_', '')}"

    if fmt == "csv":
        csv_content = ReportsService.generate_csv(data)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}_Report.csv"}
        )

    elif fmt in ["excel", "xlsx"]:
        excel_bytes = ReportsService.generate_excel(data)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}_Report.xlsx"}
        )

    elif fmt == "pdf":
        pdf_bytes = ReportsService.generate_pdf(data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}_Report.pdf"}
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{format}'. Supported formats: json, csv, excel, pdf"
        )
