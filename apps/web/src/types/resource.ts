/*
 * Shelters, hospitals and other resources for the Resources tab (phase F3). Hand-written from the
 * project brief; replace with OpenAPI-generated types once the backend exists.
 */

export type ResourceKind = "shelter" | "hospital" | "ngo" | "fire_station";

export interface Resource {
  id: string;
  kind: ResourceKind;
  name: string;
  location: { lat: number; lng: number };
  capacity?: number;
  phone?: string;
}
