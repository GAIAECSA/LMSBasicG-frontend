import MdtEvidenceView from "@/components/teacher/course-evidence";

type PageProps = {
    params: Promise<{
        courseId: string;
    }>;
};

export default async function Page({
    params,
}: PageProps) {
    const {
        courseId,
    } = await params;

    return (
        <MdtEvidenceView
            courseId={courseId}
        />
    );
}