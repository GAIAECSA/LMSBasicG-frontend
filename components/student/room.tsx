"use client";

import { CourseRoomView } from "./course-room";

type StudentMoocCourseViewProps = {
    courseId: string;
};

export function StudentMoocCourseView({ courseId }: StudentMoocCourseViewProps) {
    return <CourseRoomView courseId={courseId} />;
}

export default StudentMoocCourseView;
