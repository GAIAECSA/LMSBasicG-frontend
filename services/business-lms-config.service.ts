import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "./api-client.service";

export type BusinessLmsPlanConfig =
    Record<
        string,
        unknown
    >;

export type BusinessLmsPlan = {
    id:
    number;
    name:
    string;
    description?:
    string |
    null;
    config?:
    BusinessLmsPlanConfig |
    null;
};

const BUSINESS_NOT_FOUND_MESSAGE =
    "empresa no encontrada para este dominio";

/*
 * Los nombres se normalizan internamente:
 *
 * corporate_plan -> corporate-plan
 *
 * Agrega aquí futuros planes que deban tener
 * acceso completo a todas las funciones.
 */
const FULL_ACCESS_PLAN_NAMES =
    new Set(
        [
            "corporate-plan",
        ],
    );

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        "object" &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function normalizeKey(
    value: string,
): string {
    return value
        .trim()
        .toLowerCase()
        .replace(
            /[\s_]+/g,
            "-",
        )
        .replace(
            /-+/g,
            "-",
        );
}

function textAllowsMdt(
    value: string,
): boolean {
    const normalizedValue =
        normalizeKey(
            value,
        );

    const explicitlyDisabled =
        normalizedValue.includes(
            "disabled",
        ) ||
        normalizedValue.includes(
            "false",
        ) ||
        normalizedValue.includes(
            "inactive",
        ) ||
        normalizedValue.includes(
            "off",
        ) ||
        normalizedValue.includes(
            "no-mdt",
        );

    if (
        explicitlyDisabled
    ) {
        return false;
    }

    return normalizedValue.includes(
        "mdt",
    );
}

function configAllowsMdt(
    value: unknown,
): boolean {
    if (
        value === null ||
        value === undefined
    ) {
        return false;
    }

    if (
        typeof value ===
        "string"
    ) {
        return textAllowsMdt(
            value,
        );
    }

    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    if (
        typeof value ===
        "number"
    ) {
        return value > 0;
    }

    if (
        Array.isArray(
            value,
        )
    ) {
        return value.some(
            (
                item,
            ) =>
                configAllowsMdt(
                    item,
                ),
        );
    }

    if (
        !isRecord(
            value,
        )
    ) {
        return false;
    }

    for (
        const [
            rawKey,
            nestedValue,
        ]
        of Object.entries(
            value,
        )
    ) {
        const key =
            normalizeKey(
                rawKey,
            );

        /*
         * Admite configuraciones como:
         *
         * {
         *     "mdt": true
         * }
         *
         * {
         *     "mdt_enabled": true
         * }
         *
         * {
         *     "modules": [
         *         "courses",
         *         "mdt"
         *     ]
         * }
         */
        if (
            key.includes(
                "mdt",
            )
        ) {
            if (
                nestedValue ===
                true
            ) {
                return true;
            }

            if (
                typeof nestedValue ===
                "number" &&
                nestedValue > 0
            ) {
                return true;
            }

            if (
                typeof nestedValue ===
                "string" &&
                textAllowsMdt(
                    nestedValue,
                )
            ) {
                return true;
            }

            if (
                Array.isArray(
                    nestedValue,
                ) &&
                configAllowsMdt(
                    nestedValue,
                )
            ) {
                return true;
            }

            if (
                isRecord(
                    nestedValue,
                ) &&
                configAllowsMdt(
                    nestedValue,
                )
            ) {
                return true;
            }

            continue;
        }

        if (
            key ===
            "modules" ||
            key ===
            "features" ||
            key ===
            "enabled-modules" ||
            key ===
            "permissions"
        ) {
            if (
                configAllowsMdt(
                    nestedValue,
                )
            ) {
                return true;
            }
        }
    }

    return false;
}

function planAllowsMdt(
    plan: BusinessLmsPlan,
): boolean {
    const normalizedPlanName =
        normalizeKey(
            plan.name,
        );

    /*
     * El plan empresarial tiene acceso completo,
     * aunque config venga como un objeto vacío.
     */
    if (
        FULL_ACCESS_PLAN_NAMES.has(
            normalizedPlanName,
        )
    ) {
        return true;
    }

    /*
     * También admite planes futuros con nombres como:
     *
     * mdt_plan
     * premium_mdt
     * plan_mdt
     */
    if (
        textAllowsMdt(
            normalizedPlanName,
        )
    ) {
        return true;
    }

    return configAllowsMdt(
        plan.config,
    );
}

function normalizePlans(
    payload: unknown,
): BusinessLmsPlan[] {
    let rawPlans:
        unknown[] = [];

    if (
        Array.isArray(
            payload,
        )
    ) {
        rawPlans =
            payload;
    } else if (
        isRecord(
            payload,
        )
    ) {
        const possiblePlans =
            payload.plans ??
            payload.modules ??
            payload.data ??
            payload.items ??
            payload.results;

        if (
            Array.isArray(
                possiblePlans,
            )
        ) {
            rawPlans =
                possiblePlans;
        }
    }

    return rawPlans.filter(
        (
            item,
        ): item is BusinessLmsPlan => {
            if (
                !isRecord(
                    item,
                )
            ) {
                return false;
            }

            return (
                typeof item.id ===
                "number" &&
                typeof item.name ===
                "string"
            );
        },
    );
}

function isBusinessNotFoundResponse(
    rawText: string,
): boolean {
    return rawText
        .toLowerCase()
        .includes(
            BUSINESS_NOT_FOUND_MESSAGE,
        );
}

/**
 * Consulta los planes habilitados para la empresa
 * asociada al dominio del usuario autenticado.
 *
 * Endpoint:
 * GET /api/v1/business-lms-config/me/modules
 */
export async function getMyModules():
    Promise<
        BusinessLmsPlan[]
    > {
    const response =
        await fetch(
            `${API_URL}/api/v1/business-lms-config/me/modules`,
            {
                method:
                    "GET",
                headers:
                    getJsonHeaders(),
                cache:
                    "no-store",
            },
        );

    /*
     * Si el dominio todavía no está configurado,
     * se devuelve una lista vacía y MDT permanece oculto.
     */
    if (
        !response.ok
    ) {
        const rawErrorText =
            await response
                .clone()
                .text();

        if (
            isBusinessNotFoundResponse(
                rawErrorText,
            )
        ) {
            return [];
        }
    }

    const payload =
        await handleApiResponse<unknown>(
            response,
        );

    return normalizePlans(
        payload,
    );
}

/**
 * Valida si una característica debe mostrarse.
 *
 * Regla actual:
 *
 * - Todo lo que no sea MDT siempre permanece visible.
 * - MDT se habilita para corporate_plan.
 * - MDT también se habilita si un plan futuro o su config
 *   lo permiten explícitamente.
 * - Si todavía no cargaron los planes, MDT permanece oculto.
 */
export function hasBusinessLmsModule(
    plans:
        BusinessLmsPlan[] |
        null,
    requiredModule?:
        string |
        null,
): boolean {
    if (
        !requiredModule
    ) {
        return true;
    }

    const normalizedRequiredModule =
        normalizeKey(
            requiredModule,
        );

    const isMdtModule =
        normalizedRequiredModule.includes(
            "mdt",
        );

    /*
     * Usuarios, cursos normales, reportes,
     * matrículas y otros módulos permanecen visibles.
     */
    if (
        !isMdtModule
    ) {
        return true;
    }

    /*
     * Mientras la petición carga o no existe una
     * configuración válida, MDT permanece oculto.
     */
    if (
        !plans ||
        plans.length ===
        0
    ) {
        return false;
    }

    return plans.some(
        (
            plan,
        ) =>
            planAllowsMdt(
                plan,
            ),
    );
}