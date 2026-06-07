import type { AuthUser } from "@/types/auth";

export type ProfileAuthUser = AuthUser & {
    departament?: string | null;
};

export type ProfileFormState = {
    username: string;
    idnumber: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    departament: string;
    password: string;
};
