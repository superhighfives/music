import { createFileRoute, notFound } from "@tanstack/react-router";
import { ThemeView } from "~/sounds/components/ThemeView";
import { findTheme } from "~/sounds/content/themes";

export const Route = createFileRoute("/sounds/themes/$themeId/")({
  loader: ({ params }) => {
    if (!findTheme(params.themeId)) throw notFound();
  },
  head: ({ params }) => ({ meta: [{ title: `${findTheme(params.themeId)?.name ?? "Theme"} · sounds` }] }),
  component: ThemeIndex,
});

function ThemeIndex() {
  const { themeId } = Route.useParams();
  const theme = findTheme(themeId);
  return theme ? <ThemeView theme={theme} /> : null;
}
