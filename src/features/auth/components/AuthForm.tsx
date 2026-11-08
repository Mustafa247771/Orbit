import { useRef, useState, type ReactNode, type RefObject } from "react";
import {
    Pressable,
    Text,
    TextInput,
    View,
    type TextInputInstance,
    type TextInputProps,
} from "react-native";

import { Button } from "@/components/ui/Button";
import colors from "@/theme/colors";
import type { useAuthViewModel } from "../viewmodels/useAuthViewModel";

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  inputRef?: RefObject<TextInputInstance | null>;
  rightAction?: ReactNode;
};

function Field({
  label,
  error,
  inputRef,
  rightAction,
  onFocus,
  onBlur,
  ...props
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-pale">{label}</Text>
        {rightAction}
      </View>
      <TextInput
        {...props}
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.muted}
        selectionColor={colors.cyan}
        underlineColorAndroid="transparent"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={
          "h-14 rounded-2xl border bg-space/80 px-4 text-base text-ink " +
          (error ? "border-danger" : focused ? "border-cyan" : "border-line")
        }
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-xs leading-5 text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AuthForm({ vm }: { vm: ReturnType<typeof useAuthViewModel> }) {
  const passwordInput = useRef<TextInputInstance>(null);
  const confirmationInput = useRef<TextInputInstance>(null);
  const reset = vm.mode === "reset";
  const signup = vm.mode === "signup";

  return (
    <View className="gap-5 rounded-[28px] border border-line bg-surface/95 p-6">
      {!reset ? (
        <View className="gap-4">
          <Button
            label="Continue with Google"
            variant="outline"
            tone="cyan"
            size="lg"
            loading={vm.googleBusy}
            disabled={!vm.canSubmit}
            onPress={() => {
              void vm.continueWithGoogle();
            }}
          />
          <Text className="text-center font-mono text-[10px] tracking-[2px] text-muted">
            OR WITH EMAIL
          </Text>
        </View>
      ) : null}
      <Field
        label="Email"
        placeholder="you@example.com"
        value={vm.fields.email}
        onChangeText={(value) => vm.setField("email", value)}
        error={vm.errors.email}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!vm.busy && vm.ready}
        returnKeyType={reset ? "send" : "next"}
        submitBehavior={reset ? "blurAndSubmit" : "submit"}
        onSubmitEditing={() => {
          if (reset) void vm.submit();
          else passwordInput.current?.focus();
        }}
      />

      {!reset ? (
        <Field
          inputRef={passwordInput}
          label="Password"
          placeholder={signup ? "Choose a strong password" : "Your password"}
          value={vm.fields.password}
          onChangeText={(value) => vm.setField("password", value)}
          error={vm.errors.password}
          secureTextEntry={!vm.showPassword}
          autoComplete={signup ? "new-password" : "current-password"}
          textContentType={signup ? "newPassword" : "password"}
          editable={!vm.busy && vm.ready}
          returnKeyType={signup ? "next" : "go"}
          submitBehavior={signup ? "submit" : "blurAndSubmit"}
          onSubmitEditing={() => {
            if (signup) confirmationInput.current?.focus();
            else void vm.submit();
          }}
          rightAction={
            <Pressable
              onPress={vm.togglePassword}
              disabled={vm.busy}
              accessibilityRole="button"
              accessibilityLabel={
                vm.showPassword ? "Hide passwords" : "Show passwords"
              }
              className="h-11 min-w-[60px] items-center justify-center px-2 active:opacity-60"
            >
              <Text className="text-xs text-cyan">
                {vm.showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          }
        />
      ) : null}

      {signup ? (
        <Field
          inputRef={confirmationInput}
          label="Confirm password"
          placeholder="Enter your password again"
          value={vm.fields.confirmPassword}
          onChangeText={(value) => vm.setField("confirmPassword", value)}
          error={vm.errors.confirmPassword}
          secureTextEntry={!vm.showPassword}
          autoComplete="off"
          textContentType="newPassword"
          editable={!vm.busy && vm.ready}
          returnKeyType="go"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => {
            void vm.submit();
          }}
        />
      ) : null}

      {vm.error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm leading-6 text-danger"
        >
          {vm.error}
        </Text>
      ) : null}
      {vm.notice ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm leading-6 text-accent"
        >
          {vm.notice}
        </Text>
      ) : null}
      {!vm.ready ? (
        <Text accessibilityLiveRegion="polite" className="text-sm text-muted">
          Restoring your session…
        </Text>
      ) : null}
      {vm.setupError ? (
        <Button
          label="Try connection again"
          onPress={vm.retry}
          variant="outline"
          tone="cyan"
        />
      ) : null}

      <Button
        label={vm.action}
        onPress={() => {
          void vm.submit();
        }}
        size="lg"
        loading={vm.emailBusy}
        disabled={!vm.canSubmit}
      />
      {vm.mode === "login" ? (
        <Button
          label="Forgot password?"
          onPress={() => vm.changeMode("reset")}
          variant="ghost"
          tone="cyan"
          disabled={vm.busy}
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
        onPress={() => vm.changeMode(signup || reset ? "login" : "signup")}
        variant="outline"
        tone="cyan"
        disabled={vm.busy}
      />
    </View>
  );
}
