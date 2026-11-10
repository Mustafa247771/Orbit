import { fixMultiTouch, quietPixelStorei } from "@/components/three/expoGl";
import colors from "@/theme/colors";
import { OrbitControls } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { Suspense } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { CameraRig } from "../components/CameraRig";
import { CAMERA_FOV, START_DISTANCE } from "../components/cameraSettings";
import { CatalogueModePicker } from "../components/CatalogueModePicker";
import { ConstellationMenu } from "../components/ConstellationMenu";
import { Earth } from "../components/Earth";
import { FocusedSatellite } from "../components/FocusedSatellite";
import { GlobeHeader } from "../components/GlobeHeader";
import { MenuButton } from "../components/MenuButton";
import { Moon } from "../components/Moon";
import { ObjectSearchSheet } from "../components/ObjectSearchSheet";
import { OrbitPath } from "../components/OrbitPath";
import { OrbitalViewPrompt } from "../components/OrbitalViewPrompt";
import { SatelliteCloud } from "../components/SatelliteCloud";
import { SatelliteDetailsSheet } from "../components/SatelliteDetailsSheet";
import { ShootingStar } from "../components/ShootingStar";
import { SkyDome } from "../components/SkyDome";
import { SolarSystem } from "../components/SolarSystem";
import { useEarthViewModel } from "../viewmodels/useEarthViewModel";

export default function EarthScreen() {
  const vm = useEarthViewModel();

  return (
    <View className="flex-1 bg-space">
      <Canvas
        flat
        camera={{
          position: [0, 0, START_DISTANCE],
          fov: CAMERA_FOV,
          near: 0.01,
          far: 500,
        }}
        onPointerMissed={vm.clearSelection}
        onCreated={(state) => {
          quietPixelStorei(state);
          fixMultiTouch(state);
          state.raycaster.params.Points.threshold = 0.04;
        }}
      >
        <color attach="background" args={[colors.space]} />

        <SkyDome />
        <ShootingStar firstDelay={2} />
        <ShootingStar firstDelay={7} />

        <Moon getSunDirection={vm.getSunDirection} />

        <OrbitControls makeDefault enablePan={false} />

        <CameraRig
          selectedId={vm.selectedId}
          orbitCatalogue={vm.orbitCatalogue}
          getDate={vm.getDate}
          menuOpen={vm.menuOpen}
        />

        <Suspense fallback={null}>
          <SolarSystem getDate={vm.getDate} />
        </Suspense>

        <Suspense fallback={null}>
          <Earth
            getSunDirection={vm.getSunDirection}
            getEarthRotation={vm.getEarthRotation}
          />

          {Object.entries(vm.orbitPaths).map(([id, points]) => (
            <OrbitPath key={id} points={points} />
          ))}

          <SatelliteCloud
            satellites={vm.satellites}
            hiddenId={vm.selected?.kind === "payload" ? vm.selectedId : null}
            getDate={vm.getDate}
            getState={vm.getSatelliteState}
            onSelect={vm.selectSatellite}
          />
        </Suspense>

        {vm.selected?.kind === "payload" && (
          <Suspense fallback={null}>
            <FocusedSatellite
              key={vm.selected.id}
              id={vm.selected.id}
              family={vm.selected.family}
              orbitCatalogue={vm.orbitCatalogue}
              getDate={vm.getDate}
              getSunDirection={vm.getSunDirection}
            />
          </Suspense>
        )}
      </Canvas>

      {vm.canAccessMenu && <ConstellationMenu open={vm.menuOpen} />}

      <GlobeHeader
        menuOpen={vm.menuOpen}
        trackedCount={vm.trackedIds.size}
        objectCount={vm.satellites.length}
        satelliteStatus={vm.satelliteStatus}
        satelliteError={vm.satelliteError}
        refreshing={vm.refreshing}
        onRetry={vm.retrySatellites}
      >
        {!vm.selected && (
          <>
            <CatalogueModePicker
              mode={vm.catalogueMode}
              saving={vm.savingTracking}
              loaded={vm.preferencesLoaded}
              error={vm.preferenceError}
              objectCount={vm.satellites.length}
              missingTracked={vm.missingTracked}
              refreshing={vm.refreshing}
              onChangeMode={vm.changeMode}
              onOpenSearch={() => vm.setSearchOpen(true)}
              onRetry={vm.retryTracking}
            />
            <OrbitalViewPrompt
              visible={vm.preferencesLoaded && vm.catalogueMode === null}
              saving={vm.savingTracking}
              error={vm.preferenceError}
              onChangeMode={vm.changeMode}
            />
            <ObjectSearchSheet
              visible={vm.searchOpen}
              query={vm.query}
              results={vm.searchResults}
              trackedIds={vm.trackedIds}
              loaded={vm.preferencesLoaded}
              saving={vm.savingTracking}
              refreshing={vm.refreshing}
              error={vm.preferenceError}
              onClose={() => vm.setSearchOpen(false)}
              onChangeQuery={vm.setQuery}
              onSelect={vm.selectFromSearch}
              onToggleTracked={vm.toggleTracked}
            />
          </>
        )}
      </GlobeHeader>

      {vm.details && vm.selected && (
        <SatelliteDetailsSheet
          details={vm.details}
          family={vm.selected.family}
          onClose={vm.clearSelection}
          objectLabel={vm.selectedObjectLabel}
          tracked={vm.selectedTracked}
          saving={vm.savingTracking}
          trackingError={vm.preferenceError}
          onToggleTracking={() => {
            if (vm.selected) void vm.toggleTracked(vm.selected.id);
          }}
        />
      )}

      {vm.canAccessMenu ? (
        <MenuButton
          open={vm.menuOpen}
          hidden={vm.selected !== null}
          onPress={vm.toggleMenu}
        />
      ) : vm.selected === null ? (
        <SafeAreaView
          edges={["bottom"]}
          pointerEvents="box-none"
          className="absolute inset-x-0 bottom-0 items-center"
        >
          <Button
            label="Log in"
            icon="lock"
            variant="outline"
            tone="cyan"
            onPress={vm.openLogin}
            className="mb-4"
          />
        </SafeAreaView>
      ) : null}
    </View>
  );
}
