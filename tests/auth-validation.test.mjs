import assert from "node:assert/strict";
import test from "node:test";
import { validateAuthForm } from "../src/features/auth/model/authValidation.ts";

test("login validates email and required password without applying signup rules", () => {
  assert.deepEqual(
    validateAuthForm("login", {
      email: "  observer@example.com  ",
      password: "x",
      confirmPassword: "",
    }),
    {},
  );
  const errors = validateAuthForm("login", {
    email: "observer",
    password: "",
    confirmPassword: "",
  });
  assert.ok(errors.email);
  assert.ok(errors.password);
});

test("signup rejects short or mismatched passwords and accepts matching inputs", () => {
  const fields = {
    email: "observer@example.com",
    password: "short",
    confirmPassword: "different",
  };
  const before = { ...fields };
  const errors = validateAuthForm("signup", fields);
  assert.ok(errors.password);
  assert.ok(errors.confirmPassword);
  assert.deepEqual(fields, before);
  assert.deepEqual(
    validateAuthForm("signup", {
      ...fields,
      password: "  orbit-123  ",
      confirmPassword: "  orbit-123  ",
    }),
    {},
  );
});

test("password reset validates email without requiring password fields", () => {
  assert.deepEqual(
    validateAuthForm("reset", {
      email: "observer@example.com",
      password: "",
      confirmPassword: "",
    }),
    {},
  );
  assert.ok(
    validateAuthForm("reset", { email: "", password: "", confirmPassword: "" })
      .email,
  );
});
