import { ActivityIndicator, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StarryScreen } from "@/components/ui/StarryScreen";
import { StatRow } from "@/components/ui/StatRow";
import colors from "@/theme/colors";
import { AccountActions } from "../components/AccountActions";
import { AddLocationSheet } from "../components/AddLocationSheet";
import { AppSection } from "../components/AppSection";
import { DeleteAccountSheet } from "../components/DeleteAccountSheet";
import { EditProfileSheet } from "../components/EditProfileSheet";
import { ManageLocationsSheet } from "../components/ManageLocationsSheet";
import { NotificationsSection } from "../components/NotificationsSection";
import { ObservatorySection } from "../components/ObservatorySection";
import { ProfileHero } from "../components/ProfileHero";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";

export default function ProfileScreen() {
  const vm = useProfileViewModel();

  return (
    <StarryScreen>
      <ScreenHeader
        action={{ icon: "edit", label: "Edit profile", onPress: vm.edit.open }}
      />
      <ProfileHero
        name={vm.hero.name}
        handle={vm.hero.handle}
        initials={vm.hero.initials}
        rank={vm.hero.rank}
        city={vm.hero.city}
        since={vm.hero.since}
        still={vm.deviceSettings.reduceMotion}
        photoUri={vm.avatar.photoUri}
        photoBusy={vm.avatar.busy}
        photoError={vm.avatar.error}
        onChangePhoto={vm.avatar.changePhoto}
      />

      <Card className="mx-5 mt-6 px-2">
        <StatRow stats={vm.stats} />
      </Card>

      <FormMessage className="mx-5 mt-4 text-center">
        {vm.storageError}
      </FormMessage>
      <FormMessage tone="gold" className="mx-5 mt-4 text-center">
        {vm.storageError ? null : vm.storageNotice}
      </FormMessage>

      {vm.loading ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <ObservatorySection
            locations={vm.locationManager.locations}
            canAdd={vm.locationManager.canAdd}
            error={vm.locationManager.error}
            onManage={vm.manageLocations.open}
            onAdd={vm.locationManager.openAdd}
          />
          <NotificationsSection
            settings={vm.notifications.settings}
            onToggle={vm.notifications.toggle}
            error={vm.notifications.error}
            leadMinutes={vm.settings.leadMinutes}
            onChangeLeadTime={vm.changeLeadTime}
          />
          <AppSection
            device={vm.deviceSettings}
            onDeviceChange={vm.updateDevice}
          />
        </>
      )}
      <AccountActions
        version={vm.version}
        onSignOut={() => {
          void vm.signOut();
        }}
        onDelete={vm.deleteAccount.open}
        signingOut={vm.signingOut}
        error={vm.accountError}
      />
      <EditProfileSheet
        visible={vm.edit.visible}
        name={vm.edit.name}
        email={vm.edit.email}
        fieldError={vm.edit.fieldError}
        error={vm.edit.error}
        saving={vm.edit.saving}
        onChangeName={vm.edit.setName}
        onSave={vm.edit.save}
        onClose={vm.edit.close}
      />
      <AddLocationSheet
        visible={vm.locationManager.addVisible}
        busy={vm.locationManager.busy}
        query={vm.locationManager.query}
        queryError={vm.locationManager.queryError}
        results={vm.locationManager.results}
        searched={vm.locationManager.searched}
        pickedPlace={vm.locationManager.pickedPlace}
        name={vm.locationManager.name}
        nameError={vm.locationManager.nameError}
        error={vm.locationManager.error}
        searchSource={vm.locationManager.searchSource}
        onClose={vm.locationManager.closeAdd}
        onUseCurrentLocation={vm.locationManager.useCurrentLocation}
        onChangeQuery={vm.locationManager.setQuery}
        onSearch={vm.locationManager.search}
        onPickPlace={vm.locationManager.pickPlace}
        onChangeName={vm.locationManager.setName}
        onSave={vm.locationManager.save}
      />
      <ManageLocationsSheet
        visible={vm.manageLocations.visible}
        locations={vm.manageLocations.locations}
        saving={vm.manageLocations.saving}
        renameNames={vm.manageLocations.renameNames}
        renameErrors={vm.manageLocations.renameErrors}
        error={vm.manageLocations.error}
        onClose={vm.manageLocations.close}
        onChangeName={vm.manageLocations.setRenameName}
        onRename={vm.manageLocations.rename}
        onSetDefault={vm.manageLocations.setDefault}
        onDelete={vm.manageLocations.deleteLocation}
      />
      <DeleteAccountSheet
        visible={vm.deleteAccount.visible}
        method={vm.deleteAccount.method}
        confirmText={vm.deleteAccount.confirmText}
        password={vm.deleteAccount.password}
        confirmTextError={vm.deleteAccount.fieldErrors.confirmText}
        passwordError={vm.deleteAccount.fieldErrors.password}
        busy={vm.deleteAccount.busy}
        error={vm.deleteAccount.error}
        onChangeConfirmText={vm.deleteAccount.changeConfirmText}
        onChangePassword={vm.deleteAccount.changePassword}
        onSubmit={vm.deleteAccount.submit}
        onClose={vm.deleteAccount.close}
      />
    </StarryScreen>
  );
}
