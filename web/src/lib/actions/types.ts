export type ThemeValue = "light" | "dark" | "system";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  theme?: ThemeValue;
};

export const initialActionState: ActionState = { status: "idle" };
