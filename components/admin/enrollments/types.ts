export type StatusFilter =
    | "all"
    | "approved"
    | "pending"
    | "rejected";

export type EnrollmentStats = {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
};
