import { useRef } from "react";
import { View, type TextInputInstance } from "react-native";

import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Label } from "@/components/ui/Label";
import { TextField } from "@/components/ui/TextField";
import type {
  AuthFieldErrors,
  AuthFields,
  AuthMode,
} from "../model/authValidation";

type AuthFormProps = {
  mode: AuthMode;
  action: string;
  fields: AuthFields;
  errors: AuthFieldErrors;
  error: string | null;
  notice: string | null;
  showPassword: boolean;
  busy: boolean;
  emailBusy: boolean;
  googleBusy: boolean;
  canSubmit: boolean;
  onChangeField: (key: keyof AuthFields, value: string) => void;
  onChangeMode: (mode: AuthMode) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onGoogle: () => void;
};

/** Email and password form with the Google button, for log in, sign up and reset. */
export function AuthForm({
  mode,
  action,
  fields,
  errors,
  error,
  notice,
  showPassword,
  busy,
  emailBusy,
  googleBusy,
  canSubmit,
  onChangeField,
  onChangeMode,
  onTogglePassword,
  onSubmit,
  onGoogle,
}: AuthFormProps) {
  const passwordInput = useRef<TextInputInstance>(null);
  const confirmationInput = useRef<TextInputInstance>(null);
  const reset = mode === "reset";
  const signup = mode === "signup";

  return (
    <View className="mx-5 mt-7 gap-5 rounded-[28px] border border-line bg-surface/95 p-6">
      {!reset ? (
        <View className="gap-4">
          <Button
            label="Continue with Google"
            variant="outline"
            tone="cyan"
            size="lg"
            loading={googleBusy}
            disabled={!canSubmit}
            onPress={onGoogle}
          />
          <Label className="text-center">Or with email</Label>
        </View>
      ) : null}

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={fields.email}
        onChangeText={(value) => onChangeField("email", value)}
        error={errors.email}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!busy}
        returnKeyType={reset ? "send" : "next"}
        submitBehavior={reset ? "blurAndSubmit" : "submit"}
        onSubmitEditing={() => {
          if (reset) onSubmit();
          else passwordInput.current?.focus();
        }}
      />

      {!reset ? (
        <TextField
          ref={passwordInput}
          label="Password"
          placeholder={signup ? "Choose a strong password" : "Your password"}
          value={fields.password}
          onChangeText={(value) => onChangeField("password", value)}
          error={errors.password}
          secureTextEntry={!showPassword}
          autoComplete={signup ? "new-password" : "current-password"}
          textContentType={signup ? "newPassword" : "password"}
          editable={!busy}
          returnKeyType={signup ? "next" : "go"}
          submitBehavior={signup ? "submit" : "blurAndSubmit"}
          onSubmitEditing={() => {
            if (signup) confirmationInput.current?.focus();
            else onSubmit();
          }}
          rightAction={
            <Button
              label={showPassword ? "Hide" : "Show"}
              variant="ghost"
              tone="cyan"
              disabled={busy}
              onPress={onTogglePassword}
            />
          }
        />
      ) : null}

      {signup ? (
        <TextField
          ref={confirmationInput}
          label="Confirm password"
          placeholder="Enter your password again"
          value={fields.confirmPassword}
          onChangeText={(value) => onChangeField("confirmPassword", value)}
          error={errors.confirmPassword}
          secureTextEntry={!showPassword}
          autoComplete="off"
          textContentType="newPassword"
          editable={!busy}
          returnKeyType="go"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={onSubmit}
        />
      ) : null}

      <FormMessage>{error}</FormMessage>
      <FormMessage tone="accent">{notice}</FormMessage>

      <Button
        label={action}
        size="lg"
        loading={emailBusy}
        disabled={!canSubmit}
        onPress={onSubmit}
      />
      {mode === "login" ? (
        <Button
          label="Forgot password?"
          variant="ghost"
          tone="cyan"
          disabled={busy}
          onPress={() => onChangeMode("reset")}
        />
      ) : null}
      <Button
        label={
          signup
            ? "Already have an account? Log in"
            : reset
              ? "Back to log in"
              : "Create an account"
        }
        variant="outline"
        tone="cyan"
        disabled={busy}
        onPress={() => onChangeMode(signup || reset ? "login" : "signup")}
      />
    </View>
  );
}
