"use client";

import {
    useUserProfileForm,
} from "./hook";
import {
    Loading,
} from "./ui/Loading";
import {
    ProfileAlerts,
} from "./ui/ProfileAlerts";
import {
    ProfileFormCard,
} from "./ui/ProfileFormCard";
import {
    ProfileHero,
} from "./ui/ProfileHero";

export function UserProfileForm() {
    const profile =
        useUserProfileForm();

    if (
        profile.loading
    ) {
        return (
            <Loading />
        );
    }

    return (
        <section className="min-h-screen w-full bg-[var(--background)] px-3 py-3 text-[var(--foreground)] sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4">
                <ProfileHero
                    user={
                        profile.user
                    }
                    initials={
                        profile.initials
                    }
                />

                <ProfileAlerts
                    error={
                        profile.error
                    }
                />

                <ProfileFormCard
                    profile={
                        profile
                    }
                />
            </div>
        </section>
    );
}

export default UserProfileForm;