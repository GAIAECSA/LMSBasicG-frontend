"use client";

import {
    useState,
} from "react";
import {
    ImageIcon,
} from "lucide-react";

type ImageWithFallbackProps = {
    src: string;
    alt: string;
    className?: string;
};

export function ImageWithFallback({
    src,
    alt,
    className,
}: ImageWithFallbackProps) {
    const [
        hasError,
        setHasError,
    ] = useState(false);

    if (!src || hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)] ${className ?? ""}`}
            >
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() =>
                setHasError(true)
            }
        />
    );
}

export default ImageWithFallback;
