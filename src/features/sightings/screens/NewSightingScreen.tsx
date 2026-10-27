import { Button } from "@/components/ui/Button";
import { Footnote } from "@/components/ui/Footnote";
import { Label } from "@/components/ui/Label";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { Tag } from "@/components/ui/Tag";
import { CaptionField } from "../components/CaptionField";
import { PhotoPicker } from "../components/PhotoPicker";
import { SightingDetails } from "../components/SightingDetails";
import { VisibilityPicker } from "../components/VisibilityPicker";
import { useNewSightingViewModel } from "../viewmodels/useNewSightingViewModel";

export default function NewSightingScreen() {
  const vm = useNewSightingViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        eyebrow="Observation journal"
        title={"Keep the\nmoment."}
        subtitle="A streak of light, a precise time and your own view of the sky."
      >
        <Tag dot label={vm.saving ? "Saving" : "Draft"} tone="gold" />
      </ScreenHeader>

      <PhotoPicker
        photoUri={vm.photoUri}
        takingPhoto={vm.takingPhoto}
        choosingPhoto={vm.choosingPhoto}
        disabled={vm.busy}
        onTakePhoto={vm.takePhoto}
        onChoosePhoto={vm.choosePhoto}
      />
      <CaptionField value={vm.caption} onChange={vm.setCaption} />
      <SightingDetails
        objectName={vm.object.name}
        observedLabel={vm.observedLabel}
        location={vm.location}
        locating={vm.locating}
        disabled={vm.busy}
        onUseLocation={vm.useCurrentLocation}
      />
      <VisibilityPicker value={vm.visibility} onChange={vm.setVisibility} />

      {vm.error ? (
        <Label
          tone="danger"
          accessibilityRole="alert"
          className="mx-5 mt-5 text-center"
        >
          {vm.error}
        </Label>
      ) : null}

      <Button
        label={vm.saving ? "Saving…" : "Save sighting"}
        icon="check"
        size="lg"
        loading={vm.saving}
        disabled={vm.busy}
        onPress={vm.save}
        className="mx-5 mt-6"
      />

      <Footnote>
        Photos and sightings are saved offline on this device. Community posts
        are queued until a backend is connected.
      </Footnote>
    </StarryScreen>
  );
}
