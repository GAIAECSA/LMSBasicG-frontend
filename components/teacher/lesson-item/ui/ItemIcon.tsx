import {
    ClipboardList,
    FileText,
    ImageIcon,
    MessageSquare,
    Star,
    Video,
} from "lucide-react";
import type { LessonItemType } from "../types";

type ItemIconProps = {
    type: LessonItemType;
    className: string;
};

export function ItemIcon({ type, className }: ItemIconProps) {
    if (type === "video") return <Video className={className} />;
    if (type === "quiz") return <ClipboardList className={className} />;
    if (type === "survey") return <Star className={className} />;
    if (type === "forum") return <MessageSquare className={className} />;
    if (type === "image") return <ImageIcon className={className} />;
    if (type === "pdf") return <FileText className={className} />;

    return <FileText className={className} />;
}