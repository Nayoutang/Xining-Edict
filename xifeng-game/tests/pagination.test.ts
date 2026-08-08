import { describe, expect, it } from 'vitest';
import { paginate } from '../src/ui/pagination';

describe('dilemma pagination', () => {
  const dilemmas = Array.from({ length: 8 }, (_, index) => `dilemma-${index + 1}`);

  it('keeps five independent items on the first page and the remainder on the second', () => {
    expect(paginate(dilemmas, 0, 5)).toEqual({
      page: 0,
      pageCount: 2,
      items: dilemmas.slice(0, 5),
    });
    expect(paginate(dilemmas, 1, 5)).toEqual({
      page: 1,
      pageCount: 2,
      items: dilemmas.slice(5),
    });
  });

  it('clamps the selected page after the dilemma count shrinks', () => {
    expect(paginate(dilemmas.slice(0, 3), 4, 5)).toEqual({
      page: 0,
      pageCount: 1,
      items: dilemmas.slice(0, 3),
    });
  });
});
