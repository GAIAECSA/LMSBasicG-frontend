import type { CourseRoomHook } from "../../hook";
import { BlockHeader } from "../BlockHeader";
import { CourseIndex } from "../CourseIndex";
import { GradeCard } from "../GradeCard";
import { ProgressCard } from "../ProgressCard";
import { UpcomingCard } from "../UpcomingCard";
import { EmptyBlock } from "../blocks/EmptyBlock";
import { ForumBlock } from "../blocks/ForumBlock";
import { HomeworkBlock } from "../blocks/HomeworkBlock";
import { ImageBlock } from "../blocks/ImageBlock";
import { PdfBlock } from "../blocks/PdfBlock";
import { QuizBlock } from "../blocks/QuizBlock";
import { SurveyBlock } from "../blocks/SurveyBlock";
import { TextBlock } from "../blocks/TextBlock";
import { VideoBlock } from "../blocks/VideoBlock";

type ContentTabProps = {
    room: CourseRoomHook;
};

export function ContentTab({ room }: ContentTabProps) {
    return (
        <div
            id="contenido"
            className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]"
        >
            <div className="min-w-0">
                <CourseIndex room={room} />
            </div>

            <main className="min-w-0 overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="min-w-0">
                    <BlockHeader room={room} />

                    {!room.selectedBlock ? <EmptyBlock /> : null}

                    {room.selectedBlock &&
                        room.selectedType === "video" ? (
                        <VideoBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "image" ? (
                        <ImageBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "pdf" ? (
                        <PdfBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "homework" ? (
                        <HomeworkBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "survey" ? (
                        <SurveyBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "forum" ? (
                        <ForumBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "quiz" ? (
                        <QuizBlock room={room} />
                    ) : null}

                    {room.selectedBlock &&
                        room.selectedType === "text" ? (
                        <TextBlock room={room} />
                    ) : null}
                </div>
            </main>

            <aside className="min-w-0 space-y-5">
                <ProgressCard room={room} />
                <UpcomingCard room={room} />
                <GradeCard room={room} />
            </aside>
        </div>
    );
}