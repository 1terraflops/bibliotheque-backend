export const findAvg = (arr: (number | null)[]) => {
  const valid = arr.filter((n): n is number => n !== null);
  return Math.round(valid.reduce((sum, n) => sum + n, 0) / valid.length);
};
