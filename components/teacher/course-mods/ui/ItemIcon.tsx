import {
    ClipboardList,
    FileText,
    ImageIcon,
    ListChecks,
    MessageSquare,
    PlayCircle,
} from "lucide-react";
import type { LessonItemType } from "../types";

type ItemIconProps = {
    type: LessonItemType;
    className: string;
};

export function ItemIcon({ type, className }: ItemIconProps) {
    if (type === "video") return <PlayCircle className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    if (type === "pdf") return <FileText className={className} />;
    if (type === "homework") return <FileText className={className} />;
    if (type === "survey") return <ListChecks className={className} />;
    if (type === "forum") return <MessageSquare className={className} />;

    return <FileText className={className} />;
}