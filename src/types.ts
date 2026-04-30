import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  email: string;
  displayName: string;
  role: "admin" | "operator" | "viewer" | "super_admin" | "unit_admin" | "data_entry" | "maintenance";
  status: "active" | "disabled";
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
