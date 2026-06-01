import type { CourseModsState } from "../hook";
import { ModuleCard } from "./ModuleCard";

type ModulesListProps = {
    mods: CourseModsState;
};

export function ModulesList({ mods }: ModulesListProps) {
    return (
        <div className="relative space-y-5 pl-5">
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-[#172861] via-blue-200 to-slate-200" />

            {mods.modules.map((courseModule, moduleIndex) => (
                <ModuleCard
                    key={courseModule.id}
                    mods={mods}
                    courseModule={courseModule}
                    moduleIndex={moduleIndex}
                />
            ))}
        </div>
    );
}

export default ModulesList;