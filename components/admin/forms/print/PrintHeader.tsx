import Image from "next/image";

interface PrintHeaderProps {
    title: string;
}

export function PrintHeader({
    title,
}: PrintHeaderProps) {
    return (
        <div className="grid min-h-[100px] grid-cols-[220px_1fr] border-b-2 border-black">

            {/* LOGO */}
            <div className="flex items-center justify-center border-r-2 border-black p-3">
                <Image
                    src="/images/gaia2.png"
                    alt="GAIA Academic"
                    width={260}
                    height={120}
                    className="h-[85px] w-auto object-contain"
                    priority
                />
            </div>

            {/* TÍTULO */}
            <div className="flex items-center justify-center px-6">
                <h1 className="text-center text-xl font-black uppercase leading-tight">
                    {title}
                </h1>
            </div>
        </div>
    );
}