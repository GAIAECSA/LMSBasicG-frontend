export interface Category {
    id: number;
    name: string;
}

export interface CategoryPayload {
    name: string;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/api/v1/categories/categories`;

function normalizeCategoryErrorMessage(message: string): string {
    if (
        /duplicate key|already exists|unique constraint|ix_categories_name/i.test(
            message,
        )
    ) {
        return "Ya existe una categoría con ese nombre.";
    }

    return message || "Ocurrió un error en la solicitud.";
}

async function parseErrorResponse(response: Response): Promise<never> {
    let rawText = "";

    try {
        rawText = await response.text();
    } catch {
        throw new Error("No se pudo procesar la respuesta del servidor.");
    }

    let message = "Ocurrió un error en la solicitud.";

    try {
        const data = rawText ? JSON.parse(rawText) : null;

        if (Array.isArray(data?.detail)) {
            message = data.detail
                .map((item: { msg?: string }) => item.msg)
                .filter(Boolean)
                .join(", ");
        } else if (typeof data?.detail === "string") {
            message = data.detail;
        } else if (typeof data?.message === "string") {
            message = data.message;
        } else if (typeof rawText === "string" && rawText.trim()) {
            message = rawText;
        }
    } catch {
        if (rawText.trim()) {
            message = rawText;
        }
    }

    throw new Error(normalizeCategoryErrorMessage(message));
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        return parseErrorResponse(response);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
}

export async function getAllCategories(): Promise<Category[]> {
    const response = await fetch(CATEGORIES_ENDPOINT, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    return parseResponse<Category[]>(response);
}

export async function getCategories(): Promise<Category[]> {
    return getAllCategories();
}

export async function getCategoryById(categoryId: number): Promise<Category> {
    const response = await fetch(`${CATEGORIES_ENDPOINT}/${categoryId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    return parseResponse<Category>(response);
}

export async function createCategory(
    payload: CategoryPayload,
): Promise<Category> {
    const response = await fetch(CATEGORIES_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseResponse<Category>(response);
}

export async function updateCategory(
    categoryId: number,
    payload: CategoryPayload,
): Promise<Category> {
    const response = await fetch(`${CATEGORIES_ENDPOINT}/${categoryId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    return parseResponse<Category>(response);
}

export async function deleteCategory(categoryId: number): Promise<string> {
    const response = await fetch(`${CATEGORIES_ENDPOINT}/${categoryId}`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
        },
    });

    return parseResponse<string>(response);
}