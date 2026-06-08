import type {
    BulkFieldConfig,
} from "./types";

export const BULK_FIELDS: BulkFieldConfig[] = [
    {
        key: "username",
        label: "Usuario",
        placeholder: "jperez",
        required: true,
    },
    {
        key: "password",
        label: "Contraseña",
        placeholder: "123456",
        required: true,
    },
    {
        key: "firstname",
        label: "Nombres",
        placeholder: "Juan",
        required: true,
    },
    {
        key: "lastname",
        label: "Apellidos",
        placeholder: "Pérez",
        required: true,
    },
    {
        key: "idnumber",
        label: "Cédula",
        placeholder: "0102030405",
        required: true,
    },
    {
        key: "email",
        label: "Correo",
        placeholder: "juan@correo.com",
        required: true,
        className: "xl:col-span-2",
    },
    {
        key: "phone_number",
        label: "Teléfono",
        placeholder: "0999999999",
        required: false,
    },
    {
        key: "departament",
        label: "Departamento",
        placeholder: "General",
        required: false,
    },
];

export const EXCEL_HEADERS = [
    "username",
    "password",
    "firstname",
    "lastname",
    "idnumber",
    "email",
    "phone_number",
    "departament",
];

export const EXCEL_EXAMPLE_ROWS = [
    [
        "jperez",
        "123456",
        "Juan",
        "Pérez",
        "0102030405",
        "juan@correo.com",
        "0999999999",
        "General",
    ],
    [
        "mlopez",
        "123456",
        "María",
        "López",
        "1102030405",
        "maria@correo.com",
        "0988888888",
        "General",
    ],
];  

export const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
