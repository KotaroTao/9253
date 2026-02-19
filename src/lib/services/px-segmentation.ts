import "server-only"

import type { PatientSegment } from "@/types/px-value"

interface PatientAttrs {
  // New format
  insuranceType?: string
  purpose?: string
  // Legacy format
  chiefComplaint?: string
  treatmentType?: string
}

/**
 * Classify a survey response into a patient segment based on attributes.
 * Supports both new format (insuranceType + purpose) and legacy format
 * (chiefComplaint + treatmentType) for backward compatibility.
 *
 * Segments:
 * - Emergency: pain/acute patients (highest friction)
 * - Maintenance: checkup/preventive (routine retention)
 * - High-Value: self-pay elective (orthodontics, cosmetic, implant)
 * - General: everything else (default)
 */
export function classifySegment(
  attrs?: PatientAttrs | null
): PatientSegment {
  if (!attrs) return "general"

  // --- New format (insuranceType + purpose) ---
  if (attrs.insuranceType && attrs.purpose) {
    if (attrs.purpose === "emergency") return "emergency"

    if (attrs.purpose === "checkup" || attrs.purpose === "preventive") {
      return "maintenance"
    }

    if (
      attrs.insuranceType === "self_pay" &&
      ["orthodontics", "cosmetic", "implant"].includes(attrs.purpose)
    ) {
      return "highValue"
    }

    return "general"
  }

  // --- Legacy format (chiefComplaint + treatmentType) ---
  const { chiefComplaint, treatmentType } = attrs

  if (chiefComplaint === "pain") return "emergency"

  if (treatmentType === "checkup" || chiefComplaint === "prevention") {
    return "maintenance"
  }

  if (
    chiefComplaint === "orthodontics" ||
    chiefComplaint === "cosmetic" ||
    chiefComplaint === "denture_implant"
  ) {
    return "highValue"
  }

  return "general"
}
