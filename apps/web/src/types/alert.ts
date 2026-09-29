/*
 * Alert types for the responder Alert tab (phase F6). Hand-written from the project brief; replace
 * with OpenAPI-generated types once the backend exists.
 */

export type AlertStatus = "draft" | "pending_approval" | "approved" | "sent" | "rejected";

export interface Alert {
  id: string;
  eventId: string;
  status: AlertStatus;
  /** BCP 47 tag: "en", "ta", "hi". */
  language: string;
  body: string;
  /** GeoJSON polygon the alert is sent to. */
  audience?: GeoJSON.Polygon;
  channels: Array<"telegram" | "web_push" | "email">;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}
