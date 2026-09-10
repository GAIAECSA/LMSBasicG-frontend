import TeacherSurveyAnswerPage from "../../../../../../../../components/teacher/lesson-item-survey-answer/view";

type PageProps = {
    params: Promise<{
        courseId: string;
        itemId: string;
    }>;
};

export default async function Page({
    params,
}: PageProps) {
    const {
        courseId,
        itemId,
    } = await params;

    return (
        <TeacherSurveyAnswerPage
            courseId={courseId}
            itemId={itemId}
        />
    );
}