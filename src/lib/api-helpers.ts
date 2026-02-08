import { NextResponse } from "next/server"

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  const body: Record<string, unknown> = { error: message }
  if (details) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}
