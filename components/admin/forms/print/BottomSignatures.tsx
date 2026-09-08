interface BottomSignaturesProps {
    left: string;
    right?: string;
}

export function BottomSignatures({
    left,
    right = "COORDINADOR PEDAGÓGICO",
}: BottomSignaturesProps) {
    return (
        <div className="grid min-h-[105px] grid-cols-2 border-t-2 border-black">

            {/* FIRMA IZQUIERDA */}
            <div className="flex items-end justify-center p-5">
                <div className="w-60 text-center">
                    <div className="border-t border-black pt-2 text-xs">
                        {left}
                    </div>
                </div>
            </div>

            {/* FIRMA DERECHA */}
            <div className="flex items-end justify-center p-5">
                <div className="w-72 text-center">
                    <div className="border-t border-black pt-2 text-xs">
                        {right}
                    </div>
                </div>
            </div>
        </div>
    );
}