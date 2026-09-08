export interface PersonDirectoryItem {
    identification: string;
    name: string;
    profession: string;
    workplace: string;
    email: string;
}

/*
 * DATOS ESTÁTICOS TEMPORALES.
 *
 * Más adelante este archivo se reemplazará
 * por una consulta a tu API / base de datos.
 */
export const PEOPLE_DIRECTORY: PersonDirectoryItem[] = [
    {
        identification: "1800000001",
        name: "Juan Pérez",
        profession: "Ingeniero",
        workplace: "Empresa ABC",
        email: "juan@email.com",
    },
    {
        identification: "1800000002",
        name: "María López",
        profession: "Contadora",
        workplace: "Empresa XYZ",
        email: "maria@email.com",
    },
    {
        identification: "1800000003",
        name: "Carlos Sánchez",
        profession: "Estudiante",
        workplace: "Universidad",
        email: "carlos@email.com",
    },
    {
        identification: "1800000004",
        name: "Andrea Torres",
        profession: "Administradora",
        workplace: "Comercial Torres",
        email: "andrea@email.com",
    },
    {
        identification: "1800000005",
        name: "Pedro Ramírez",
        profession: "Ingeniero en Sistemas",
        workplace: "GAIA Academic",
        email: "pedro@email.com",
    },
];