import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThemeView } from "~/production/components/ThemeView";
import { findTheme } from "~/production/content/themes";

export const Route = createFileRoute("/production/themes/$themeId/")({
  loader: ({ params }) => {
    if (!findTheme(params.themeId)) throw notFound();
  },
  head: ({ params }) => ({ meta: [{ title: `${findTheme(params.themeId)?.name ?? "Theme"} · Production` }] }),
  component: ThemeIndex,
});

function ThemeIndex() {
  const { themeId } = Route.useParams();
  const theme = findTheme(themeId);
  return theme ? <ThemeView theme={theme} /> : null;
}
