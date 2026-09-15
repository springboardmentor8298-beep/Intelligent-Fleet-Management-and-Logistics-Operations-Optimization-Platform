// frontend/src/utils/driverStore.js

export const DEFAULT_DRIVERS = [
  { id: 'DRV-101', name: 'Marcus Vance', license: 'CDL-A (Commercial Master)', vehicle: 'FL-001', trips: 142, rating: 4.9, status: 'On Trip', attendance: 'Present' },
  { id: 'DRV-102', name: 'Elena Rostova', license: 'CDL-A (Hazmat Endorsed)', vehicle: 'FL-002', trips: 98, rating: 4.8, status: 'Available', attendance: 'Present' },
  { id: 'DRV-103', name: 'James K. Cooper', license: 'CDL-B (Heavy Rigid)', vehicle: 'FL-003', trips: 215, rating: 5.0, status: 'On Trip', attendance: 'Present' },
  { id: 'DRV-104', name: 'Samantha Lee', license: 'CDL-A (Tanker & Air Brakes)', vehicle: 'FL-004', trips: 64, rating: 4.7, status: 'Available', attendance: 'Present' },
  { id: 'DRV-105', name: 'Devon Miller', license: 'CDL-B (Urban Dispatch)', vehicle: 'FL-005', trips: 89, rating: 4.6, status: 'Off Duty', attendance: 'Off Shift' }
];

const STORAGE_KEY = 'fleetflow_drivers';

/**
 * Retrieves drivers from localStorage, initializing with DEFAULT_DRIVERS if empty.
 */
export function getStoredDrivers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing stored drivers', e);
    return DEFAULT_DRIVERS;
  }
}

/**
 * Persists drivers to localStorage and emits an update event.
 */
export function saveStoredDrivers(drivers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
    window.dispatchEvent(new CustomEvent('fleetflow_drivers_updated', { detail: drivers }));
  } catch (e) {
    console.error('Error saving drivers to storage', e);
  }
}

/**
 * Finds the driver currently assigned to the given vehicle ID.
 */
export function getDriverForVehicle(vehicleId) {
  if (!vehicleId) return null;
  const drivers = getStoredDrivers();
  return drivers.find(d => d.vehicle && d.vehicle.toUpperCase() === vehicleId.trim().toUpperCase()) || null;
}

/**
 * Validates whether a shipment can be assigned to the vehicle based on driver presence & duty status.
 */
export function canAssignShipmentToVehicle(vehicleId) {
  if (!vehicleId) {
    return { allowed: false, reason: 'No vehicle selected.' };
  }
  const driver = getDriverForVehicle(vehicleId);
  if (!driver) {
    return {
      allowed: false,
      reason: `Vehicle ${vehicleId} has no assigned driver in Driver Roster. Please assign a driver in Driver Management first.`,
      driver: null
    };
  }
  if (driver.status === 'Off Duty') {
    return {
      allowed: false,
      reason: `Cannot assign shipment to ${vehicleId}: Assigned driver ${driver.name} (${driver.id}) is currently OFF DUTY. You cannot assign any shipment to this fleet until the driver assigned is changed or set to On Duty.`,
      driver
    };
  }
  return {
    allowed: true,
    driver
  };
}

/**
 * Automatically updates the driver's duty status to "On Duty" upon shipment assignment.
 */
export function onShipmentAssignedToVehicle(vehicleId, shipmentInfo = {}) {
  const drivers = getStoredDrivers();
  let updated = false;
  const nextDrivers = drivers.map(d => {
    if (d.vehicle && d.vehicle.toUpperCase() === vehicleId.trim().toUpperCase()) {
      updated = true;
      return {
        ...d,
        status: 'On Duty',
        attendance: 'Present',
        trips: (d.trips || 0) + 1,
        lastAssignedShipment: shipmentInfo.tracking_number || (shipmentInfo.shipment_ids ? `${shipmentInfo.shipment_ids.length} Consignments` : 'Active Dispatch')
      };
    }
    return d;
  });

  if (updated) {
    saveStoredDrivers(nextDrivers);
  }
  return nextDrivers;
}

/**
 * Assigns a registered fleet asset to a driver. Only authorized for 'Fleet Manager'.
 */
export function assignFleetToDriver(driverId, newVehicleId, userRole) {
  const isFleetManager = userRole === 'Fleet Manager' || userRole === 'Administrator';
  if (!isFleetManager) {
    return {
      success: false,
      error: 'Permission Denied: Only users with the Fleet Manager role are authorized to assign or reassign fleet vehicles to drivers.'
    };
  }

  const drivers = getStoredDrivers();
  const nextDrivers = drivers.map(d => {
    // If another driver had this vehicle, unassign them to prevent duplicate assignments
    if (newVehicleId && newVehicleId !== 'None' && d.vehicle && d.vehicle.toUpperCase() === newVehicleId.toUpperCase() && d.id !== driverId) {
      return { ...d, vehicle: 'None' };
    }
    if (d.id === driverId) {
      return { ...d, vehicle: newVehicleId || 'None' };
    }
    return d;
  });

  saveStoredDrivers(nextDrivers);
  return { success: true, drivers: nextDrivers };
}

/**
 * Updates duty status for a driver.
 */
export function updateDriverDutyStatus(driverId, newStatus) {
  const drivers = getStoredDrivers();
  const nextDrivers = drivers.map(d => {
    if (d.id === driverId) {
      const attendance = newStatus === 'Off Duty' ? 'Off Shift' : 'Present';
      return { ...d, status: newStatus, attendance };
    }
    return d;
  });
  saveStoredDrivers(nextDrivers);
  return nextDrivers;
}

/**
 * Registers a new driver.
 */
export function registerNewDriver(driverData) {
  const drivers = getStoredDrivers();
  const id = `DRV-${Math.floor(100 + Math.random() * 900)}`;
  const newD = {
    ...driverData,
    id,
    trips: 0,
    rating: 5.0,
    status: driverData.status || 'Available',
    attendance: 'Present'
  };
  const next = [...drivers, newD];
  saveStoredDrivers(next);
  return next;
}
