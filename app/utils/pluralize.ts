export const pluralize = (count: number, singular: string, plural?: string) =>
    count === 1
      ? `${count} ${singular}`
      : `${count.toLocaleString()} ${plural ?? `${singular}s`}`;
  