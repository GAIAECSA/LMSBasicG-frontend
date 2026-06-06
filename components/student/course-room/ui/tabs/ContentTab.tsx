import type { CourseRoomHook } from "../../hook";
import { BlockHeader } from "../BlockHeader";
import { CourseIndex } from "../CourseIndex";
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
            className="grid min-w-0 gap-4 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]"
        >
            <div className="min-w-0">
                <CourseIndex room={room} />
            </div>

            <main className="min-w-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-[24px] sm:p-5 lg:p-5">
                <div className="min-w-0">
                    <BlockHeader room={room} />

                    {!room.selectedBlock ? <EmptyBlock /> : null}

                    {room.selectedBlock && room.selectedType === "video" ? (
                        <VideoBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "image" ? (
                        <ImageBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "pdf" ? (
                        <PdfBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "homework" ? (
                        <HomeworkBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "survey" ? (
                        <SurveyBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "forum" ? (
                        <ForumBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "quiz" ? (
                        <QuizBlock room={room} />
                    ) : null}

                    {room.selectedBlock && room.selectedType === "text" ? (
                        <TextBlock room={room} />
                    ) : null}
                </div>
            </main>
        </div>
    );
}

export default ContentTab;
