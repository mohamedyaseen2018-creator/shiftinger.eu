export interface WorkExperience {
  position: string;
  employer: string;
  city: string;
  startDate: string;
  endDate?: string;
}

export interface WorkerAvailability {
  lookingFor: string[];
  days: string[];
  timeSlots: string[];
  minRate: number;
  bio: string;
  visible: boolean;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  city: string;
  mainRole: string;
  mainRoleYears: number;
  subRoles: { role: string; years: number }[];
  languages: { language: string; level: string }[];
  experience: WorkExperience[];
  atividade: boolean;
  verified: boolean;
  rating: number;
  shiftsCompleted: number;
  bio: string;
  availability: WorkerAvailability | null;
  minRate: number;
  phone: string;
  nationality: string;
  avatarUrl?: string | null;
}

export interface Job {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  area: string;
  city: string;
  role: string;
  type: "single" | "parttime";
  date?: string;
  startTime?: string;
  endTime?: string;
  workingDays?: string[];
  startDate?: string;
  endDate?: string;
  rate: number;
  spots: number;
  spotsRemaining: number;
  languages: string[];
  atividade: "required" | "preferred" | "not-required";
  note?: string;
  skills: string[];
  postedAt: string;
  status: "open" | "closed";
  applicants: number;
  placeRating?: number | null;
  placeRatingCount?: number;
  businessAvatarUrl?: string | null;
}
