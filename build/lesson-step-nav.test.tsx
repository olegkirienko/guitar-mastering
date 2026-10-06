import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from '../src/components/base/buttons/button.tsx';
import { LessonStepNav } from '../src/components/lesson/lesson-step-nav/lesson-step-nav.tsx';
import { ArrowLeft, ArrowRight } from '@untitledui/icons';

const back = { label: 'До вступу', onClick: () => {} };
const next = { label: 'Далі', onClick: () => {} };

// The labels sit in a nested span, so the markup is read for the text of each button in order.
function buttonLabels(markup: string): string[] {
  return [...markup.matchAll(/<button[\s\S]*?<\/button>/g)].map((match) => match[0].replace(/<[^>]*>/g, '').trim());
}

function buttonClasses(markup: string): string[] {
  return [...markup.matchAll(/<button class="([^"]*)"/g)].map((match) => match[1]);
}

describe('LessonStepNav', () => {
  it('renders back before next', () => {
    expect(buttonLabels(renderToStaticMarkup(<LessonStepNav back={back} next={next} />))).toEqual(['До вступу', 'Далі']);
  });

  it('omits the back button on the first step', () => {
    expect(buttonLabels(renderToStaticMarkup(<LessonStepNav next={next} />))).toEqual(['Далі']);
  });

  it('omits the next button while the step is not complete', () => {
    expect(buttonLabels(renderToStaticMarkup(<LessonStepNav back={back} />))).toEqual(['До вступу']);
  });

  it('renders nothing when the step has neither', () => {
    expect(renderToStaticMarkup(<LessonStepNav />)).toBe('');
  });

  it('sizes both buttons lg, so they share a baseline', () => {
    const classes = buttonClasses(renderToStaticMarkup(<LessonStepNav back={back} next={next} />));
    expect(classes[0]).toBe(buttonClasses(renderToStaticMarkup(<Button color="link-gray" size="lg" iconLeading={ArrowLeft}>x</Button>))[0]);
    expect(classes[1]).toBe(buttonClasses(renderToStaticMarkup(<Button size="lg" iconTrailing={ArrowRight}>x</Button>))[0]);
  });
});
