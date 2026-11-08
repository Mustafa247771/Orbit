export type AuthMode = "login" | "signup" | "reset";
export type AuthFields = {
  email: string;
  password: string;
  confirmPassword: string;
};
export type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;

export function validateAuthForm(
  mode: AuthMode,
  fields: AuthFields,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = fields.email.trim();

  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (mode !== "reset" && !fields.password) {
    errors.password = "Enter your password.";
  }

  if (mode === "signup") {
    if (fields.password && fields.password.length < 6) {
      errors.password = "Use at least 6 characters.";
    }
    if (fields.password.length > 4096) {
      errors.password = "Use no more than 4096 characters.";
    }
    if (!fields.confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (fields.confirmPassword !== fields.password) {
      errors.confirmPassword = "Your passwords do not match.";
    }
  }

  return errors;
}
