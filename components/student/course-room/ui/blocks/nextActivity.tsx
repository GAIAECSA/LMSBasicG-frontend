import type { CourseRoomHook } from "../../hook";

/**
 * Adaptador: conecta el botón con la navegación expuesta por CourseRoomHook.
 * Para habilitar navegación implementa goToNextActivity() en el hook.
 * No inventa un enlace que pudiera abrir una actividad equivocada.
 */
export function getNextActivityAction(
    room: CourseRoomHook,
): (() => void | Promise<void>) | undefined {
    const navigation = room as CourseRoomHook & {
        goToNextActivity?: () => void | Promise<void>;
    };
    return navigation.goToNextActivity;
}
