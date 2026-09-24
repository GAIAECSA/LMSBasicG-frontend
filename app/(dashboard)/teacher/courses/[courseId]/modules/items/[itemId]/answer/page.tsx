import TeacherSurveyAnswerPage from "../../../../../../../../../components/teacher/lesson-item-survey-answer/view";

type Props = {
    params: Promise<{
        courseId: string;
        itemId: string;
    }>;
};

export default async function Page({ params }: Props) {
    const { courseId, itemId } = await params;

    return (
        <TeacherSurveyAnswerPage
            courseId={courseId}
            itemId={itemId}
        />
    );
}