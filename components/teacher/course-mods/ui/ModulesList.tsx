import type { CourseModsState } from "../hook";
import { ModuleCard } from "./ModuleCard";

type ModulesListProps = {
    mods: CourseModsState;
};

export function ModulesList({
    mods,
}: ModulesListProps) {
    return (
        <div className="relative min-w-0 space-y-3 pl-4 sm:space-y-4 sm:pl-5 [@media(max-height:760px)]:space-y-3">
            <div className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-gradient-to-b from-[#172861] via-blue-200 to-slate-200 sm:w-1" />

            {mods.modules.map(
                (courseModule, moduleIndex) => (
                    <ModuleCard
                        key={courseModule.id}
                        mods={mods}
                        courseModule={courseModule}
                        moduleIndex={moduleIndex}
                    />
                ),
            )}
        </div>
    );
}

export default ModulesList;
