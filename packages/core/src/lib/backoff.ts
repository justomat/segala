export const exponential = (ms: number) => (n: number) => ms * 2 ** (n + 1);
export const linear = (ms: number) => (n: number) => ms * 2 * (n + 1);
