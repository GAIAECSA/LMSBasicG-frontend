/* eslint-disable @next/next/no-img-element */

import type {
    ChangeEvent,
    FormEvent,
    ReactNode,
} from "react";
import {
    Loader2,
    X,
} from "lucide-react";

import {
    COURSE_LEVEL_OPTIONS,
    type CourseLevel,
} from "@/services/courses.service";
import type {
    Category,
} from "@/services/categories.service";
import type {
    Subcategory,
} from "@/services/subcategories.service";

import {
    SwitchCard,
} from "./SwitchCard";
import type {
    CourseFormState,
} from "../types";
import {
    formatMoney,
    parseNumberInput,
} from "../utils";

type CourseFormModalProps = {
    open:
        boolean;
    editingCourseId:
        number |
        null;
    form:
        CourseFormState;
    previewSrc:
        string;
    selectedImageFile:
        File |
        null;
    categories:
        Category[];
    subcategories:
        Subcategory[];
    availableSubcategories:
        Subcategory[];
    categoriesLoading:
        boolean;
    subcategoriesLoading:
        boolean;
    isSaving:
        boolean;
    onClose:
        () => void;
    onSubmit:
        (
            event:
                FormEvent<HTMLFormElement>,
        ) => void;
    onImageChange:
        (
            event:
                ChangeEvent<HTMLInputElement>,
        ) => void;
    onCategoryChange:
        (
            categoryId:
                string,
        ) => void;
    onUpdateForm:
        <
            K extends keyof CourseFormState,
        >(
            key:
                K,
            value:
                CourseFormState[K],
        ) => void;
};

const inputClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm";

export function CourseFormModal({
    open,
    editingCourseId,
    form,
    previewSrc,
    selectedImageFile,
    categories,
    subcategories,
    availableSubcategories,
    categoriesLoading,
    subcategoriesLoading,
    isSaving,
    onClose,
    onSubmit,
    onImageChange,
    onCategoryChange,
    onUpdateForm,
}: CourseFormModalProps) {
    if (
        !open
    ) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={
                onClose
            }
        >
            <div
                className="flex max-h-[97dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[93dvh] sm:rounded-3xl [@media(max-height:760px)]:max-h-[98dvh]"
                onClick={(
                    event,
                ) =>
                    event.stopPropagation()
                }
            >
                <div className="shrink-0 bg-gradient-to-br from-[#07111F] via-[#172861] to-[#F97316] px-4 py-4 text-white sm:px-6 sm:py-5 [@media(max-height:760px)]:py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100 sm:text-xs">
                                {editingCourseId
                                    ? "Editar curso"
                                    : "Nuevo curso"}
                            </p>

                            <h2 className="mt-1.5 text-xl font-black sm:text-2xl">
                                {editingCourseId
                                    ? "Actualizar curso"
                                    : "Crear nuevo curso"}
                            </h2>

                            <p className="mt-1 hidden text-xs font-semibold text-blue-50 sm:block sm:text-sm">
                                Completa la información y selecciona primero una categoría.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                isSaving
                            }
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:gap-2 sm:px-4"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4" />

                            <span className="hidden text-sm font-black sm:inline">
                                Cerrar
                            </span>
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={
                        onSubmit
                    }
                    noValidate
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.72fr)] lg:overflow-hidden">
                        <div className="min-h-0 overflow-y-visible border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 lg:overflow-y-auto lg:border-r [@media(max-height:760px)]:py-3">
                            <div className="space-y-4 [@media(max-height:760px)]:space-y-3">
                                <div>
                                    <FieldLabel
                                        label="Nombre del curso"
                                        required
                                        value={
                                            form.name
                                        }
                                    />

                                    <input
                                        value={
                                            form.name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            onUpdateForm(
                                                "name",
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Ej. Curso de React"
                                        className={
                                            inputClass
                                        }
                                    />
                                </div>

                                <div>
                                    <FieldLabel
                                        label="Descripción"
                                        required
                                        value={
                                            form.description
                                        }
                                    />

                                    <textarea
                                        value={
                                            form.description
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            onUpdateForm(
                                                "description",
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Describe brevemente el curso"
                                        rows={
                                            4
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                                    />
                                </div>

                                <div>
                                    <FieldLabel
                                        label="Imagen del curso"
                                    />

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={
                                            onImageChange
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition file:mr-2 file:rounded-lg file:border-0 file:bg-[#172861] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white hover:file:bg-[#0B163F] sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm sm:file:rounded-xl sm:file:px-4 sm:file:py-2 sm:file:text-sm"
                                    />

                                    <p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
                                        Formatos de imagen permitidos. Tamaño máximo recomendado: 5 MB.
                                    </p>

                                    {selectedImageFile ? (
                                        <p className="mt-1 text-[11px] font-black text-slate-700 sm:text-xs">
                                            Archivo: {selectedImageFile.name}
                                        </p>
                                    ) : form.image_url ? (
                                        <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                                            Se mantiene la imagen actual si no seleccionas otra.
                                        </p>
                                    ) : null}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <div>
                                        <FieldLabel
                                            label="Categoría"
                                            required
                                            value={
                                                form.category_id
                                            }
                                        />

                                        <select
                                            value={
                                                form.category_id
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                onCategoryChange(
                                                    event.target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                categoriesLoading
                                            }
                                            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                                        >
                                            <option value="">
                                                {categoriesLoading
                                                    ? "Cargando categorías..."
                                                    : "Selecciona una categoría"}
                                            </option>

                                            {categories.map(
                                                (
                                                    category,
                                                ) => (
                                                    <option
                                                        key={
                                                            category.id
                                                        }
                                                        value={
                                                            category.id
                                                        }
                                                    >
                                                        {category.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <FieldLabel
                                            label="Subcategoría"
                                            required
                                            value={
                                                form.subcategory_id
                                            }
                                        />

                                        <select
                                            value={
                                                form.subcategory_id
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                onUpdateForm(
                                                    "subcategory_id",
                                                    event.target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                !form.category_id ||
                                                subcategoriesLoading
                                            }
                                            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                                        >
                                            <option value="">
                                                {!form.category_id
                                                    ? "Selecciona categoría"
                                                    : subcategoriesLoading
                                                      ? "Cargando..."
                                                      : "Selecciona subcategoría"}
                                            </option>

                                            {availableSubcategories.map(
                                                (
                                                    subcategory,
                                                ) => (
                                                    <option
                                                        key={
                                                            subcategory.id
                                                        }
                                                        value={
                                                            subcategory.id
                                                        }
                                                    >
                                                        {subcategory.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <FieldLabel
                                            label="Nivel"
                                        />

                                        <select
                                            value={
                                                form.level
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                onUpdateForm(
                                                    "level",
                                                    event.target
                                                        .value as CourseLevel,
                                                )
                                            }
                                            className={
                                                inputClass
                                            }
                                        >
                                            {COURSE_LEVEL_OPTIONS.map(
                                                (
                                                    option,
                                                ) => (
                                                    <option
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <FieldInput
                                        label="Moneda"
                                        required
                                        value={
                                            form.currency
                                        }
                                        placeholder="USD"
                                        className="uppercase"
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "currency",
                                                value.toUpperCase(),
                                            )
                                        }
                                    />

                                    <FieldInput
                                        label="Precio"
                                        type="number"
                                        value={
                                            form.price
                                        }
                                        disabled={
                                            form.is_free
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "price",
                                                value,
                                            )
                                        }
                                    />

                                    <FieldInput
                                        label="Precio descuento"
                                        type="number"
                                        value={
                                            form.discount_price
                                        }
                                        disabled={
                                            form.is_free
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "discount_price",
                                                value,
                                            )
                                        }
                                    />

                                    <FieldInput
                                        label="Duración horas"
                                        type="number"
                                        value={
                                            form.duration_hours
                                        }
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "duration_hours",
                                                value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                    <SwitchCard
                                        checked={
                                            form.is_free
                                        }
                                        label="Curso gratuito"
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "is_free",
                                                value,
                                            )
                                        }
                                    />

                                    <SwitchCard
                                        checked={
                                            form.is_published
                                        }
                                        label="Publicado"
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "is_published",
                                                value,
                                            )
                                        }
                                    />

                                    <SwitchCard
                                        checked={
                                            form.open_enrollment
                                        }
                                        label="Matrícula abierta"
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "open_enrollment",
                                                value,
                                            )
                                        }
                                    />

                                    <SwitchCard
                                        checked={
                                            form.is_mdt
                                        }
                                        label="Curso MDT"
                                        onChange={(
                                            value,
                                        ) =>
                                            onUpdateForm(
                                                "is_mdt",
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <CoursePreview
                            form={
                                form
                            }
                            previewSrc={
                                previewSrc
                            }
                            categories={
                                categories
                            }
                            subcategories={
                                subcategories
                            }
                        />
                    </div>

                    <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:grid-cols-2 sm:px-6">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                isSaving
                            }
                            className="h-10 rounded-xl border border-slate-200 px-5 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSaving
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#172861] px-5 text-xs font-black text-white transition hover:bg-[#0B163F] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:rounded-2xl sm:text-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}

                            {isSaving
                                ? "Guardando..."
                                : editingCourseId
                                  ? "Actualizar curso"
                                  : "Crear curso"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FieldLabel({
    label,
    required =
        false,
    value =
        "",
}: {
    label:
        string;
    required?:
        boolean;
    value?:
        string;
}) {
    const showRequiredMark =
        required &&
        !value.trim();

    return (
        <label className="mb-1.5 block text-xs font-black text-slate-700 sm:mb-2 sm:text-sm">
            {label}

            {showRequiredMark ? (
                <span className="ml-1 text-red-600">
                    *
                </span>
            ) : null}
        </label>
    );
}

function FieldInput({
    label,
    type =
        "text",
    value,
    disabled =
        false,
    placeholder,
    className =
        "",
    required =
        false,
    onChange,
}: {
    label:
        string;
    type?:
        "text" |
        "number";
    value:
        string;
    disabled?:
        boolean;
    placeholder?:
        string;
    className?:
        string;
    required?:
        boolean;
    onChange:
        (
            value:
                string,
        ) => void;
}) {
    return (
        <div>
            <FieldLabel
                label={
                    label
                }
                required={
                    required
                }
                value={
                    value
                }
            />

            <input
                type={
                    type
                }
                step={
                    type ===
                    "number"
                        ? "0.01"
                        : undefined
                }
                min={
                    type ===
                    "number"
                        ? "0"
                        : undefined
                }
                disabled={
                    disabled
                }
                value={
                    value
                }
                onChange={(
                    event,
                ) =>
                    onChange(
                        event.target
                            .value,
                    )
                }
                placeholder={
                    placeholder
                }
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
            />
        </div>
    );
}

function CoursePreview({
    form,
    previewSrc,
    categories,
    subcategories,
}: {
    form:
        CourseFormState;
    previewSrc:
        string;
    categories:
        Category[];
    subcategories:
        Subcategory[];
}) {
    return (
        <aside className="border-t border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100/70 px-4 py-4 sm:px-5 sm:py-5 lg:min-h-0 lg:overflow-y-auto lg:border-t-0 [@media(max-height:760px)]:py-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
                <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-64 lg:h-56 xl:h-64 [@media(max-height:760px)]:lg:h-48">
                    <img
                        src={
                            previewSrc
                        }
                        alt="Vista previa del curso"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />

                    <div className="absolute inset-x-0 top-3 flex items-start justify-between gap-2 px-3">
                        <div className="flex flex-wrap gap-1.5">
                            <PreviewBadge>
                                {form.level}
                            </PreviewBadge>

                            {form.is_mdt ? (
                                <PreviewBadge className="bg-purple-300 text-slate-950">
                                    MDT
                                </PreviewBadge>
                            ) : null}

                            <PreviewBadge
                                className={
                                    form.is_published
                                        ? "bg-emerald-400 text-slate-950"
                                        : "bg-orange-300 text-slate-950"
                                }
                            >
                                {form.is_published
                                    ? "Publicado"
                                    : "Borrador"}
                            </PreviewBadge>
                        </div>

                        <div className="shrink-0 rounded-xl bg-white/95 px-2.5 py-1.5 text-xs font-black text-slate-900 shadow-lg">
                            {form.is_free
                                ? "Gratis"
                                : formatMoney(
                                      parseNumberInput(
                                          form.price,
                                          0,
                                      ),
                                      form.currency,
                                  )}
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                        <h4 className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow-sm sm:text-2xl">
                            {form.name ||
                                "Nombre del curso"}
                        </h4>
                    </div>
                </div>

                <div className="space-y-3 p-4">
                    <p className="line-clamp-3 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                        {form.description ||
                            "Aquí se mostrará una vista previa breve de la descripción del curso."}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <PreviewValue
                            label="Duración"
                            value={`${parseNumberInput(
                                form.duration_hours,
                                0,
                            )} h`}
                        />

                        <PreviewValue
                            label="Categoría"
                            value={
                                form.category_id
                                    ? categories.find(
                                          (
                                              item,
                                          ) =>
                                              String(
                                                  item.id,
                                              ) ===
                                              form.category_id,
                                      )?.name ??
                                      "Sin categoría"
                                    : "Sin categoría"
                            }
                        />

                        <PreviewValue
                            label="Subcategoría"
                            value={
                                form.subcategory_id
                                    ? subcategories.find(
                                          (
                                              item,
                                          ) =>
                                              String(
                                                  item.id,
                                              ) ===
                                              form.subcategory_id,
                                      )?.name ??
                                      "Sin subcategoría"
                                    : "Sin subcategoría"
                            }
                        />

                        <PreviewValue
                            label="Matrícula"
                            value={
                                form.open_enrollment
                                    ? "Abierta"
                                    : "Cerrada"
                            }
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
}

function PreviewBadge({
    children,
    className =
        "border border-white/20 bg-white/15 text-white backdrop-blur-md",
}: {
    children:
        ReactNode;
    className?:
        string;
}) {
    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${className}`}
        >
            {children}
        </span>
    );
}

function PreviewValue({
    label,
    value,
}: {
    label:
        string;
    value:
        string;
}) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-xs font-black text-slate-900">
                {value}
            </p>
        </div>
    );
}

export default CourseFormModal;
