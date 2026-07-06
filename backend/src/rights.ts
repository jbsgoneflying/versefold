import { translations, type Translation, type TranslationRights } from "./config.js";

export class RightsError extends Error {
  statusCode = 451; // Unavailable For Legal Reasons
  constructor(message: string) {
    super(message);
    this.name = "RightsError";
  }
}

export function getTranslation(key: string): Translation {
  const t = translations[key];
  if (!t) throw Object.assign(new Error(`Unknown translation '${key}'`), { statusCode: 404 });
  return t;
}

/** Throws RightsError unless the capability is granted for this translation. */
export function assertRight(key: string, capability: keyof TranslationRights): Translation {
  const t = getTranslation(key);
  const allowed = t.rights[capability];
  if (allowed !== true) {
    throw new RightsError(
      `Translation '${t.abbreviation}' does not permit '${String(capability)}'. ` +
        `This feature is available on public-domain translations (e.g. KJV).`
    );
  }
  return t;
}

/** True only when the translation's text may be included in an LLM prompt. */
export function mayLlmSend(key: string): boolean {
  return getTranslation(key).rights.llmSend === true;
}

/** Rights-filtered view of the config, safe to send to the app for UI gating. */
export function publicTranslationConfig() {
  return Object.fromEntries(
    Object.entries(translations)
      .filter(([, t]) => !t.bibleId.startsWith("TODO"))
      .map(([slug, t]) => [
        slug,
        {
          name: t.name,
          abbreviation: t.abbreviation,
          publicDomain: t.publicDomain,
          rights: t.rights,
        },
      ])
  );
}
