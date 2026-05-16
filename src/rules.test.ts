import { describe, expect, it } from 'vitest';
import { runModerationRules } from './rules';

describe('runModerationRules', () => {
  it('detects spam phrases', () => {
    const { violations } = runModerationRules('BUY NOW limited time offer!!!', []);
    expect(violations.some((v) => v.ruleId === 'spam_keywords')).toBe(true);
  });

  it('detects toxic language', () => {
    const { violations } = runModerationRules('You are such an idiot', []);
    expect(violations.some((v) => v.ruleId === 'toxic_language')).toBe(true);
  });

  it('flags URL shorteners', () => {
    const { violations } = runModerationRules('check https://bit.ly/fake', [
      'https://bit.ly/fake',
    ]);
    expect(violations.some((v) => v.ruleId === 'url_shortener')).toBe(true);
  });
});
