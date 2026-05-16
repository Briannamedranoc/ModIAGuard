export type ModerationViolation = {
  ruleId: string;
  message: string;
};

export type ModerationOutcome = {
  violations: ModerationViolation[];
};

/** Tune these lists per community before publishing. */
const SPAM_PHRASES = [
  'buy now',
  'click here now',
  'limited time offer',
  'work from home',
  'make money fast',
  'viagra',
  'casino',
  '100% free money',
  'gana dinero fácil',
  'gana dinero facil',
  'oferta por tiempo limitado',
];

const TOXIC_TERMS = [
  'idiot',
  'idiota',
  'stupid',
  'estúpido',
  'estupido',
  'imbécil',
  'imbecil',
  'kill yourself',
  'kys',
  'moron',
];

const SHORTENER_HOSTS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'cutt.ly',
  'rebrand.ly',
]);

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.loan', '.gq', '.tk'];

function normalizeForWordScan(text: string): string {
  return text.toLowerCase();
}

function containsSpamPhrase(text: string): ModerationViolation | undefined {
  const lowered = normalizeForWordScan(text);
  const hit = SPAM_PHRASES.find((phrase) => lowered.includes(phrase));
  if (!hit) {
    return undefined;
  }

  return {
    ruleId: 'spam_keywords',
    message: `Matched spam phrase: "${hit}"`,
  };
}

function containsToxicLanguage(text: string): ModerationViolation | undefined {
  const lowered = normalizeForWordScan(text);
  const boundaryHit = TOXIC_TERMS.find((term) => {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
    return re.test(lowered);
  });

  if (!boundaryHit) {
    return undefined;
  }

  return {
    ruleId: 'toxic_language',
    message: `Matched toxic term: "${boundaryHit}"`,
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tryParseUrl(raw: string): URL | undefined {
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

function suspiciousLinkViolations(urls: string[]): ModerationViolation[] {
  const violations: ModerationViolation[] = [];

  for (const raw of urls) {
    const parsed = tryParseUrl(raw);
    if (!parsed) {
      violations.push({
        ruleId: 'malformed_url',
        message: `Could not parse URL: ${raw}`,
      });
      continue;
    }

    const host = parsed.hostname.toLowerCase();
    if (SHORTENER_HOSTS.has(host)) {
      violations.push({
        ruleId: 'url_shortener',
        message: `Link uses a URL shortener (${host})`,
      });
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      violations.push({
        ruleId: 'raw_ip_url',
        message: `Link targets raw IP host ${host}`,
      });
    }

    const hostLower = parsed.hostname.toLowerCase();
    const badTld = SUSPICIOUS_TLDS.find((tld) => hostLower.endsWith(tld));
    if (badTld) {
      violations.push({
        ruleId: 'suspicious_tld',
        message: `Link may use a risky TLD (${badTld})`,
      });
    }
  }

  return violations;
}

export function runModerationRules(postText: string, urls: string[]): ModerationOutcome {
  const violations: ModerationViolation[] = [];

  const spam = containsSpamPhrase(postText);
  if (spam) {
    violations.push(spam);
  }

  const toxic = containsToxicLanguage(postText);
  if (toxic) {
    violations.push(toxic);
  }

  violations.push(...suspiciousLinkViolations(urls));

  return { violations };
}
