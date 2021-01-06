/* eslint-disable @typescript-eslint/no-empty-function */
import test, { ExecutionContext } from 'ava';

import toCompatibility from '../src/interactions/compatibility';
import { InteractionOptionType } from '../src/types';

type Context = ExecutionContext<unknown>;

test('extract compatibility for: () => boolean', (t: Context): void => {
  const code = 'function yes(): boolean { return true; }';

  const compatibility = toCompatibility(code);

  t.deepEqual(compatibility, {
    name: 'yes',
    parameters: {},
    type: InteractionOptionType.Boolean,
  });
});

test('extract compatibility for: () => void', (t: Context): void => {
  const code = 'function noop(): void { return; }';

  const compatibility = toCompatibility(code);

  t.deepEqual(compatibility, {
    name: 'noop',
    parameters: {},
    type: InteractionOptionType.Void,
  });
});

test('extract compatibility for: ({ event, price, quantity }: { event: Event, price: number, quantity: number }) => number', (t: Context): void => {
  const code = `
    function subtotal({ event, price, quantity }: { event: Event, price: number, quantity: number }): number { 
      return price * quantity;
    }
  `;

  const compatibility = toCompatibility(code);

  t.deepEqual(compatibility, {
    name: 'subtotal',
    parameters: {
      price: InteractionOptionType.Number,
      quantity: InteractionOptionType.Number,
    },
    type: InteractionOptionType.Number,
  });
});

test('fail extraction when passing no interaction', (t: Context): void => {
  const code = ``;

  t.throws(() => toCompatibility(code), {
    name: 'RangeError',
    message: 'file does not contain an interaction',
  });
});

test('fail when passing an arrow function instead of a function', (t: Context): void => {
  const code = `const interaction = ({ event, price, quantity }: { event: Event, price: number, quantity: number }): number => quantity * price`;

  t.throws(() => toCompatibility(code), {
    name: 'TypeError',
    message: `
expected expression of the kind
  function interaction({ event, argument }: { event: Event, argument: ArgumentType }): ReturnType {
    // body
  }
`,
  });
});

test('fail extraction when passing incompatible type for: subtotal({ event, price }: { event: Event, price: PriceType }): number => number', (t: Context): void => {
  const code = `
    function subtotal({ event, price }: { event: Event, price: PriceType }): number {
      return price * 1;
    }
  `;

  t.throws(() => toCompatibility(code), {
    name: 'TypeError',
    message: 'unsupported type: PriceType',
  });
});

test('fail extraction with multiple function statements', (t: Context): void => {
  const code = `
    function yes(): boolean { return true }
    function no(): boolean { reutrn false }
  `;

  t.throws(() => toCompatibility(code), {
    name: 'RangeError',
    message: 'file contains multiple statements',
  });
});

test('fail extraction without function statement', (t: Context): void => {
  t.throws(() => toCompatibility(''), {
    name: 'RangeError',
    message: 'file does not contain an interaction',
  });
});
