"use client";

import { toast } from "sonner";

type ToastId =
    | string
    | number;

export const notify = {
    success(
        message: string,
        description?: string,
    ) {
        return toast.success(message, {
            description,
        });
    },

    error(
        message: string,
        description?: string,
    ) {
        return toast.error(message, {
            description,
        });
    },

    warning(
        message: string,
        description?: string,
    ) {
        return toast.warning(message, {
            description,
        });
    },

    info(
        message: string,
        description?: string,
    ) {
        return toast.info(message, {
            description,
        });
    },

    loading(
        message: string,
        description?: string,
    ) {
        return toast.loading(message, {
            description,
        });
    },

    promise<T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        },
    ) {
        return toast.promise(
            promise,
            messages,
        );
    },

    dismiss(
        toastId?: ToastId,
    ) {
        toast.dismiss(toastId);
    },
};