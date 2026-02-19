import "server-only"

import type { PatientSegment } from "@/types/px-value"

interface PatientAttrs {
  chiefComplaint?: string
  treatmentType?: string
}

/**
 * Classify a survey response into a patient segment based on attributes.
 *
 * - Emergency: chief complaint is pain
 * - Maintenance: checkup or prevention
 * - High-Value: orthodontics, cosmetic, or denture/implant
 * - General: everything else
 */
export function classifySegment(
  attrs?: PatientAttrs | null
): PatientSegment {
  if (!attrs) return "general"

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
