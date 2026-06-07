import AthenaLoadingBackground from "@/components/ui/AthenaLoadingBackground";

type LoadingProps = {
    label?: string;
};

export function Loading({
    label = "Cargando información...",
}: LoadingProps) {
    return (
        <AthenaLoadingBackground
            label={label}
        />
    );
}