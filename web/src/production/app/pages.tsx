/** @jsxImportSource ~/content */
import { island, type Node } from "~/content/jsx-runtime";
import { CHORDS_URL, KeyBox, Logo } from "~/production/content/kit";
import { RECIPES, findRecipe, type Recipe } from "~/production/content/recipes";
import { THEMES, findTheme, lessonKey, type LessonContext, type Theme } from "~/production/content/themes";

/*
 * Production's pages, as content: markup that follows the course's progress. The controls are islands
 * the Production component fills in: key, mode and tempo, the light or dark switch, sign-in, and the
 * button that marks a lesson done. Links between pages are plain links, so each page renders on the server.
 */

/** Which page a path asks for. */
export type Route =
  | { readonly _tag: "Home" }
  | { readonly _tag: "Theme"; readonly theme: Theme; readonly lessonId: string | undefined }
  | { readonly _tag: "Recipe"; readonly recipe: Recipe }
  | { readonly _tag: "NotFound" };

export function routeOf(path: string): Route {
  const parts = path.replace(/\/+$/, "").split("/").slice(2);
  if (parts.length === 0) return { _tag: "Home" };
  if (parts[0] === "themes" && parts[1] && parts.length <= 3) {
    const theme = findTheme(parts[1]);
    if (theme && (!parts[2] || theme.lessons.some((l) => l.id === parts[2]))) return { _tag: "Theme", theme, lessonId: parts[2] };
  }
  if (parts[0] === "recipes" && parts[1] && parts.length === 2) {
    const recipe = findRecipe(parts[1]);
    if (recipe) return { _tag: "Recipe", recipe };
  }
  return { _tag: "NotFound" };
}

/** The lesson a theme page shows: the one in the path, or its first. */
export function lessonOf(theme: Theme, lessonId: string | undefined) {
  const index = Math.max(0, theme.lessons.findIndex((l) => l.id === lessonId));
  const lesson = theme.lessons[index];
  return { index, lesson, key: lesson ? lessonKey(theme, lesson) : null };
}

/** The page's title, for the document head. */
export function titleOf(route: Route): string {
  if (route._tag === "Theme") {
    const { lesson } = lessonOf(route.theme, route.lessonId);
    return route.lessonId && lesson ? `${lesson.title} · ${route.theme.name} · Production` : `${route.theme.name} · Production`;
  }
  if (route._tag === "Recipe") return `${route.recipe.title} · Production`;
  return "Production";
}

type Done = Readonly<Record<string, true>>;

const themeHref = (theme: Theme, lessonId?: string) => `/production/themes/${theme.id}${lessonId ? `/${lessonId}` : ""}`;

export function Masthead() {
  return (
    <header className="mast">
      <a className="brand" href="/production">
        <Logo />
        Production
      </a>
      {island("Controls")}
      {island("ThemeToggle")}
      {island("Account")}
    </header>
  );
}

function Crumbs({ section }: { section: string }) {
  return (
    <nav className="crumbs">
      <a href="/production">Production</a>
      <span>/</span>
      <span>{section}</span>
    </nav>
  );
}

/** Edition log, newest first. Add a line when a theme or recipe lands. */
const LOG: [string, string, string][] = [
  ["2026-11-28", "Edition 8.", "Rebuilt on Effect UI: every page renders on the server, with no React."],
  ["2026-11-27", "Edition 7.", "Every tool in the studio, with exercises and links back to these lessons, at music.charliegleason.com/tools."],
  ["2026-11-26", "Edition 6.", "sounds is now Production, at music.charliegleason.com/production."],
  ["2026-11-26", "Edition 5.", "Fog & Pulse is now just sounds, with the same footer as the rest of music."],
  ["2026-11-25", "Edition 4.", "Moves to music.charliegleason.com/sounds, beside chords and the Ableton Extensions."],
  ["2026-11-25", "Edition 3.", "Moves to sounds.charliegleason.com, built from the music repo and deployed on every push to main."],
  ["2026-11-25", "Edition 2.", "A course: six themes and recipes. The Sound quality theme, the “The Peace” vocoder recipe, and the in-this-key panel."],
  ["2026-11-24", "Edition 1.", "Fog & Pulse handbook: map, drums, textures, low end, space, arrangement, live rig."],
];

function findLesson(key: string) {
  const [themeId, lessonId] = key.split(".");
  const theme = THEMES.find((t) => t.id === themeId);
  const lesson = theme?.lessons.find((l) => l.id === lessonId);
  return theme && lesson ? { theme, lesson } : null;
}

function ThemeCard({ theme, index, done }: { theme: Theme; index: number; done: Done }) {
  const total = theme.lessons.length;
  const complete = theme.lessons.filter((l) => done[lessonKey(theme, l)]).length;
  const status =
    total === 0 ? <span className="chip">Planned</span> : complete === total ? <span className="chip lit">Done</span> : <span className="chip">{total} {total === 1 ? "lesson" : "lessons"}</span>;
  return (
    <a className="card" href={themeHref(theme)}>
      <div className="top">
        <span className="num">{String(index + 1).padStart(2, "0")}</span>
        {status}
      </div>
      <div className="name">{theme.name}</div>
      <div className="blurb">{theme.blurb}</div>
      <div className="meta">
        {total === 0 ? (
          <span className="src">{theme.planned.length} lessons planned</span>
        ) : (
          <>
            <div className="bar" role="img" aria-label={`${complete} of ${total} done`}>
              <i style={{ width: `${(complete / total) * 100}%` }} />
            </div>
            <span className="src">
              {complete} of {total} done
            </span>
          </>
        )}
      </div>
    </a>
  );
}

export function HomePage({ done, last }: { done: Done; last: string | null }) {
  const resume = last ? findLesson(last) : null;
  return (
    <>
      <section className="hero">
        <Logo big />
        <h1>Production</h1>
        <p className="lede">
          A step-by-step course in music production with Ableton Live 12: high-quality audio, soundscapes, melody and pop songwriting. Big themes you work through in order, and short recipes that rebuild one sound from a real record.
        </p>
      </section>
      <div className="home">
        {resume ? (
          <a className="continue" href={themeHref(resume.theme, resume.lesson.id)}>
            <span className="lab">Continue</span>
            <b>
              {resume.theme.name} · {resume.lesson.title}
            </b>
            <span className="dim">→</span>
          </a>
        ) : null}
        <section className="block">
          <h2>
            Themes <span className="dim">Longer courses, in order. Each lesson ends with something to make.</span>
          </h2>
          <div className="cards">
            {THEMES.map((t, i) => (
              <ThemeCard theme={t} index={i} done={done} />
            ))}
          </div>
        </section>
        <section className="block">
          <h2>
            Recipes <span className="dim">One sound, rebuilt from a real record.</span>
          </h2>
          <div className="list">
            {RECIPES.map((r) => (
              <a href={`/production/recipes/${r.id}`}>
                <span className="t">{r.title}</span>
                <span className={done[`recipe.${r.id}`] ? "chip lit" : "chip cool"}>{done[`recipe.${r.id}`] ? "Done" : "Recipe"}</span>
                <span className="s">
                  {r.artist} · {r.track} · {r.summary}
                </span>
              </a>
            ))}
          </div>
        </section>
        <section className="block">
          <h2>
            In this key{" "}
            <span className="dim">
              Follows the key and mode above. Harmony in depth lives in <a href={CHORDS_URL}>Chords</a>.
            </span>
          </h2>
          <KeyBox />
        </section>
        <section className="block">
          <h2>
            Tools <span className="dim">The plugins and gear these lessons use, with exercises for each.</span>
          </h2>
          <p>
            <a href="/tools">See every tool →</a>
          </p>
        </section>
        <section className="block">
          <h2>Edition log</h2>
          <div className="log">
            {LOG.map(([date, title, text]) => (
              <div>
                <time dateTime={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time>
                <span>
                  <b>{title}</b> {text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

const DoneButton = (key: string, label: string) => island("DoneButton", { key, label });

export function ThemePage({ theme, lessonId, done, lesson: context }: { theme: Theme; lessonId: string | undefined; done: Done; lesson: LessonContext }) {
  const { index, lesson, key } = lessonOf(theme, lessonId);
  const complete = theme.lessons.filter((l) => done[lessonKey(theme, l)]).length;
  const prev = theme.lessons[index - 1];
  const next = theme.lessons[index + 1];
  return (
    <>
      <Crumbs section="Themes" />
      <header className="themehead">
        <h1>{theme.name}</h1>
        <p className="lede dim">{theme.blurb}</p>
        {theme.lessons.length ? (
          <span className="src">
            {complete} of {theme.lessons.length} lessons done
            {theme.planned.length ? ` · ${theme.planned.length} planned` : ""}
          </span>
        ) : null}
      </header>
      <div className="reader">
        <nav className="rail" aria-label="Lessons">
          {theme.lessons.map((l, i) => {
            const isDone = !!done[lessonKey(theme, l)];
            return (
              <a href={themeHref(theme, l.id)} className={isDone ? "done" : undefined} aria-current={i === index ? "page" : undefined}>
                <span className="n">{isDone ? "✓" : String(i + 1).padStart(2, "0")}</span>
                <span>{l.title}</span>
              </a>
            );
          })}
          {theme.planned.map((p) => (
            <span className="planned">
              <span className="n">··</span>
              <span>{p}</span>
            </span>
          ))}
        </nav>
        {lesson && key ? (
          <article className="lesson">
            <div>
              <span className="lab">
                Lesson {index + 1} of {theme.lessons.length}
              </span>
              <h2>{lesson.title}</h2>
            </div>
            {lesson.Body(context)}
            <div className="lessonfoot">
              {DoneButton(key, "Mark lesson done")}
              <div className="navbtns">
                {prev ? (
                  <a className="btn" href={themeHref(theme, prev.id)}>
                    ← {prev.title}
                  </a>
                ) : null}
                {next ? (
                  <a className="btn" href={themeHref(theme, next.id)}>
                    {next.title} →
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ) : (
          <div className="lesson">
            <p>This theme is planned. Its lessons are listed alongside; ask Claude to write the first one and it lands here.</p>
            {theme.Extra ? theme.Extra() : null}
          </div>
        )}
      </div>
    </>
  );
}

export function RecipePage({ recipe, done, lesson }: { recipe: Recipe; done: Done; lesson: LessonContext }) {
  const key = `recipe.${recipe.id}`;
  return (
    <>
      <Crumbs section="Recipes" />
      <header className="themehead">
        <span className="lab">
          {recipe.artist} · {recipe.track} · {recipe.album}
        </span>
        <h1>{recipe.title}</h1>
        <p className="lede dim">{recipe.summary}</p>
      </header>
      <div className="reader">
        <nav className="rail" aria-label="Recipes">
          {RECIPES.map((r) => (
            <a href={`/production/recipes/${r.id}`} aria-current={r.id === recipe.id ? "page" : undefined}>
              <span className="n">{done[`recipe.${r.id}`] ? "✓" : "··"}</span>
              <span>{r.title}</span>
            </a>
          ))}
        </nav>
        <article className="lesson">
          {recipe.Body(lesson)}
          <div className="lessonfoot">
            {DoneButton(key, "Mark recipe done")}
            <a className="btn" href="/production">
              All themes and recipes
            </a>
          </div>
        </article>
      </div>
    </>
  );
}

export function NotFoundPage(): Node {
  return (
    <div className="home">
      <h1>Not found</h1>
      <p>
        <a href="/production">Back to Production</a>
      </p>
    </div>
  );
}
