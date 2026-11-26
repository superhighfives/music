import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThemeView } from "~/sounds/components/ThemeView";
import { findTheme } from "~/sounds/content/themes";

export const Route = createFileRoute("/sounds/themes/$themeId/$lessonId")({
  loader: ({ params }) => {
    const theme = findTheme(params.themeId);
    if (!theme?.lessons.some((l) => l.id === params.lessonId)) throw notFound();
  },
  head: ({ params }) => {
    const theme = findTheme(params.themeId);
    const lesson = theme?.lessons.find((l) => l.id === params.lessonId);
    return { meta: [{ title: `${lesson?.title ?? "Lesson"} · ${theme?.name ?? ""} · sounds` }] };
  },
  component: Lesson,
});

function Lesson() {
  const { themeId, lessonId } = Route.useParams();
  const theme = findTheme(themeId);
  return theme ? <ThemeView theme={theme} lessonId={lessonId} /> : null;
}
