export const formatterTypes = ["html", "markdown", "text"] as const;
export type FormatterType = (typeof formatterTypes)[number];
