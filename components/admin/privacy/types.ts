import type { Dispatch, SetStateAction } from "react";
import type { PrivacyPolicy } from "@/services/privacy-policy.service";

export type PolicyFormState = {
    title: string;
    version: string;
    is_active: boolean;
    mandatory: boolean;
    effective_date: string;
    file: File | null;
};

export type PolicyFormSetter = Dispatch<
    SetStateAction<PolicyFormState>
>;

export type PrivacySummary = {
    total: number;
    active: number;
    mandatory: number;
};

export type PolicyListItem = PrivacyPolicy;
