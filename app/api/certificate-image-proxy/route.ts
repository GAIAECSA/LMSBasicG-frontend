import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const imageUrl = request.nextUrl.searchParams.get("url");

    if (!imageUrl) {
        return NextResponse.json(
            { message: "URL de imagen requerida." },
            { status: 400 },
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        return NextResponse.json(
            { message: "URL de imagen no válida." },
            { status: 400 },
        );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
            { message: "Protocolo no permitido." },
            { status: 400 },
        );
    }

    try {
        const response = await fetch(parsedUrl.toString(), {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: "No se pudo descargar la imagen.",
                    status: response.status,
                },
                { status: 502 },
            );
        }

        const contentType =
            response.headers.get("content-type") || "application/octet-stream";

        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return NextResponse.json(
            { message: "No se pudo procesar la imagen del certificado." },
            { status: 500 },
        );
    }
}