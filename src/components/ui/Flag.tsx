import { Globe } from "lucide-react";
import { LANGUAGE_FLAG_CODES, NATIONALITY_OPTIONS } from "@/data/utils";

/**
 * Renders a real flag image instead of an emoji flag.
 *
 * Emoji flags (🇵🇹) are not supported by the system fonts on Windows/Chrome and
 * several Android builds, where they degrade into the raw two-letter regional
 * indicators ("PT") or tofu boxes. Using image assets makes flags render
 * identically on every platform.
 */
export function Flag({
  code,
  title,
  size = 14,
  className = "",
}: {
  code?: string | null;
  title?: string;
  size?: number;
  className?: string;
}) {
  if (!code) {
    return (
      <Globe
        size={size}
        aria-hidden={!title}
        className={`inline-block shrink-0 align-[-2px] text-ink/40 ${className}`}
      />
    );
  }
  const c = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${c}.svg`}
      alt={title ? `${title} flag` : ""}
      title={title}
      width={size * 1.4}
      height={size}
      loading="lazy"
      className={`inline-block shrink-0 rounded-[2px] object-cover align-[-2px] ring-1 ring-ink/10 ${className}`}
      style={{ width: size * 1.4, height: size }}
    />
  );
}

/** Flag for a language name from the shared language list. */
export function LanguageFlag(props: { language: string; size?: number; className?: string }) {
  const { language, ...rest } = props;
  return <Flag code={LANGUAGE_FLAG_CODES[language]} title={language} {...rest} />;
}

/** Flag for a nationality name from the shared nationality list. */
export function NationalityFlag(props: { nationality: string; size?: number; className?: string }) {
  const { nationality, ...rest } = props;
  const match = NATIONALITY_OPTIONS.find((n) => n.name === nationality);
  return <Flag code={match?.code} title={nationality} {...rest} />;
}

export default Flag;
