import Image from "next/image";
import type {
    ReactNode,
} from "react";

type AthenaLoadingBackgroundProps = {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export function AthenaLoadingBackground({
    children,
    className = "",
    contentClassName = "",
}: AthenaLoadingBackgroundProps) {
    return (
        <div
            className={`relative mx-auto min-h-[calc(100dvh-80px)] w-full max-w-7xl overflow-hidden px-3 py-5 sm:px-4 sm:py-7 md:py-8 [@media(max-height:760px)]:min-h-[calc(100dvh-66px)] [@media(max-height:760px)]:py-3 ${className}`}
        >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Image
                    src="/images/athena.png"
                    alt=""
                    width={600}
                    height={600}
                    priority
                    aria-hidden="true"
                    className="h-auto w-[260px] select-none object-contain opacity-[0.055] sm:w-[340px] md:w-[430px] lg:w-[520px] [@media(max-height:760px)]:w-[360px]"
                />
            </div>

            <div
                className={`relative z-10 w-full ${contentClassName}`}
            >
                {children}
            </div>
        </div>
    );
}

export default AthenaLoadingBackground;