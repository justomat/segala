import { Action, AnyAction } from 'redux';
import { delay } from 'redux-saga/effects';
import { exponential } from './backoff';

function toPredicate(regex: RegExp) {
  return (effect) =>
    effect?.type === 'PUT' && regex.test(effect.payload?.action?.type);
}

class RetryAbortedError extends Error {
  yielded;

  constructor(value, ...args) {
    super(...args);
    this.name = 'RetryAbortedError';
    this.yielded = value;
  }
}

function* execute(generator, shouldAbortFn) {
  let yielded = generator.next();

  while (!yielded.done) {
    if (shouldAbortFn(yielded.value)) {
      throw new RetryAbortedError(yielded.value);
    }

    try {
      const result = yield yielded.value;
      yielded = generator.next(result);
    } catch (e) {
      yielded = generator.throw(e);
    }
  }

  return yielded.value;
}

type Predicate<T = unknown> = (arg: unknown) => boolean;

interface options {
  retries?: number;
  delayMs?: number;
  backoff?: (retries: number) => number;
  shouldAbort?: RegExp | Predicate<Action>;
}

export function retry(
  saga: (...args: any[]) => Generator,
  {
    retries = 3,
    delayMs = 200,
    backoff = exponential(delayMs),
    shouldAbort = /_FAILURE$/,
  }: options = {}
) {
  const shouldAbortFn =
    shouldAbort instanceof RegExp ? toPredicate(shouldAbort) : shouldAbort;

  function* retryable(...args) {
    const action: AnyAction = args[args.length - 1];
    const maxRetries = action?.meta?.retries || retries;

    for (let i = 0; i <= maxRetries; i++) {
      let shouldStop = i === maxRetries ? () => false : shouldAbortFn;
      try {
        return yield* execute(saga(...args), shouldStop);
      } catch (e) {
        if (e.name !== RetryAbortedError.name) throw e;
      }

      yield delay(backoff(i));
    }
  }

  Object.defineProperty(retryable, 'name', {
    value: `retryGenerator(${saga.name})`,
  });
  return retryable;
}
