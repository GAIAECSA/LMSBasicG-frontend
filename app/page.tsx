/* import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
} */


import { PublicCoursesView } from "@/components/courses/public-courses-view";

export default function HomePage() {
  return <PublicCoursesView />;
}