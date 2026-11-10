import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { AuthForm } from "../components/AuthForm";
import { useAuthViewModel } from "../viewmodels/useAuthViewModel";

export default function LoginScreen() {
  const vm = useAuthViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        eyebrow="Account access"
        title={vm.title}
        subtitle={vm.subtitle}
        tone="cyan"
      />
      <AuthForm
        mode={vm.mode}
        action={vm.action}
        fields={vm.fields}
        errors={vm.errors}
        error={vm.error}
        notice={vm.notice}
        showPassword={vm.showPassword}
        busy={vm.busy}
        emailBusy={vm.emailBusy}
        googleBusy={vm.googleBusy}
        canSubmit={vm.canSubmit}
        onChangeField={vm.setField}
        onChangeMode={vm.changeMode}
        onTogglePassword={vm.togglePassword}
        onSubmit={() => void vm.submit()}
        onGoogle={() => void vm.continueWithGoogle()}
      />
      <Button
        label="Explore as guest"
        variant="ghost"
        disabled={vm.busy}
        onPress={vm.exploreGuest}
        className="mx-5 mt-5"
      />
    </StarryScreen>
  );
}
