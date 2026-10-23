import Constants from "expo-constants";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { Stat } from "@/components/ui/Stat";
import { Tag } from "@/components/ui/Tag";
import { Toggle } from "@/components/ui/Toggle";
import colors from "@/theme/colors";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { RangeSetting } from "../components/RangeSetting";
import { SettingRow } from "../components/SettingRow";
import { Stepper } from "../components/Stepper";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";

const MODES = [
  { value: "naked-eye", label: "Naked eye" },
  { value: "telescope", label: "Telescope" },
] as const;

const UNITS = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
] as const;

const VISIBILITY = [
  { value: "private", label: "Private" },
  { value: "community", label: "Community" },
] as const;

const NOTIFICATIONS = [
  { key: "passAlerts", label: "Visible pass alerts" },
  { key: "launchReminders", label: "Launch reminders" },
  { key: "communityReplies", label: "Community replies" },
  { key: "dailyPicture", label: "NASA picture each morning" },
] as const;

const noop = () => {};

export default function ProfileScreen() {
  const vm = useProfileViewModel();
  const { profile, settings } = vm;

  return (
    <StarryScreen>
      <ScreenHeader
        eyebrow="Profile"
        title="Mission control"
        action={{ icon: "edit", label: "Edit profile", onPress: noop }}
      />

      <View className="mt-5 items-center gap-3 px-5">
        <ProfileAvatar
          initials={vm.initials}
          still={settings.reduceMotion}
          onChangePhoto={noop}
        />
        <ScrambleText
          text={profile.name}
          className="font-display text-[30px] leading-[34px] text-ink"
        />
        <Text className="font-mono text-[11px] uppercase tracking-[2px] text-muted">
          @{profile.handle}
        </Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          <Tag label={`${profile.rank} · Lv ${profile.level}`} tone="gold" />
          <Tag label={profile.city} />
          <Tag label={`Since ${profile.memberSince}`} />
        </View>
      </View>

      <View className="mx-5 mt-6 flex-row gap-2.5">
        {vm.stats.map((stat) => (
          <Card key={stat.label} className="flex-1 px-4 py-2">
            <Stat label={stat.label} value={stat.value} />
          </Card>
        ))}
      </View>

      <View className="mx-5 mt-8">
        <SectionLabel
          title="Observatory"
          action={{ label: "Manage", onPress: noop }}
        />
        <Card>
          {vm.locations.map((location) => (
            <SettingRow
              key={location.id}
              label={location.name}
              hint={location.coordinates}
              monoHint
            >
              {location.isDefault ? (
                <Tag label="Default" tone="accent" />
              ) : (
                <Icon name="chevron" color={colors.muted} />
              )}
            </SettingRow>
          ))}
          <Pressable
            onPress={noop}
            accessibilityRole="button"
            className="min-h-[56px] flex-row items-center gap-3 px-4 active:opacity-60"
          >
            <Icon name="add" color={colors.cyan} />
            <Text className="text-[15px] font-semibold text-cyan">
              Add a location
            </Text>
          </Pressable>
        </Card>
      </View>

      <View className="mx-5 mt-8">
        <SectionLabel title="Observation" />
        <Card>
          <View className="gap-3 border-b border-line p-4">
            <View className="gap-1">
              <Text className="text-[15px] font-semibold text-ink">
                Observation mode
              </Text>
              <Text className="text-[13px] leading-[18px] text-muted">
                Telescope also alerts you for satellites you track.
              </Text>
            </View>
            <SegmentedControl
              label="Observation mode"
              options={MODES}
              value={settings.mode}
              onChange={(mode) => vm.update("mode", mode)}
            />
          </View>
          <SettingRow label="Alert before a pass" hint="Lead time for alerts">
            <Stepper
              label="lead time"
              value={`${settings.alertLeadMinutes} min`}
              onDecrease={() => vm.changeLeadTime(-1)}
              onIncrease={() => vm.changeLeadTime(1)}
            />
          </SettingRow>
          <RangeSetting
            label="Minimum elevation"
            value={settings.minElevation}
            unit="°"
            min={0}
            max={45}
            step={5}
            minLabel="Horizon"
            maxLabel="45°"
            onChange={(value) => vm.update("minElevation", value)}
          />
          <RangeSetting
            label="Maximum cloud cover"
            value={settings.maxCloudCover}
            unit="%"
            min={0}
            max={100}
            step={10}
            minLabel="Clear"
            maxLabel="Overcast"
            last
            onChange={(value) => vm.update("maxCloudCover", value)}
          />
        </Card>
      </View>

      <View className="mx-5 mt-8">
        <SectionLabel title="Notifications" />
        <Card>
          {NOTIFICATIONS.map(({ key, label }, index) => (
            <SettingRow
              key={key}
              label={label}
              last={index === NOTIFICATIONS.length - 1}
            >
              <Toggle
                label={label}
                value={settings[key]}
                onChange={(value) => vm.update(key, value)}
              />
            </SettingRow>
          ))}
        </Card>
      </View>

      <View className="mx-5 mt-8">
        <SectionLabel title="App" />
        <Card>
          <SettingRow label="Units">
            <View className="w-44">
              <SegmentedControl
                label="Units"
                options={UNITS}
                value={settings.units}
                onChange={(units) => vm.update("units", units)}
              />
            </View>
          </SettingRow>
          <SettingRow label="Haptics">
            <Toggle
              label="Haptics"
              value={settings.haptics}
              onChange={(value) => vm.update("haptics", value)}
            />
          </SettingRow>
          <SettingRow label="Reduce motion" hint="Stops the orbit animations">
            <Toggle
              label="Reduce motion"
              value={settings.reduceMotion}
              onChange={(value) => vm.update("reduceMotion", value)}
            />
          </SettingRow>
          <SettingRow label="New sightings" last>
            <View className="w-48">
              <SegmentedControl
                label="New sightings visibility"
                options={VISIBILITY}
                value={settings.sightingVisibility}
                onChange={(visibility) =>
                  vm.update("sightingVisibility", visibility)
                }
              />
            </View>
          </SettingRow>
        </Card>
      </View>

      <View className="mx-5 mt-10 gap-1.5">
        <Pressable
          onPress={noop}
          accessibilityRole="button"
          className="h-[52px] flex-row items-center justify-center gap-2 rounded-full border border-danger/50 active:opacity-60"
        >
          <Icon name="logout" color={colors.danger} />
          <Text className="text-[15px] font-semibold text-danger">
            Sign out
          </Text>
        </Pressable>
        <Pressable
          onPress={noop}
          accessibilityRole="button"
          className="h-11 items-center justify-center active:opacity-60"
        >
          <Text className="text-[13px] text-danger/80">Delete account</Text>
        </Pressable>
        <Text className="mt-2.5 text-center font-mono text-[11px] uppercase tracking-[2px] text-muted">
          Orbit {Constants.expoConfig?.version}
        </Text>
      </View>
    </StarryScreen>
  );
}
