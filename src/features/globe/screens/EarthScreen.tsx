import { fixMultiTouch, quietPixelStorei } from "@/components/three/expoGl";
import colors from "@/theme/colors";
import { OrbitControls } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { Suspense } from "react";
import { View } from "react-native";
import { CameraRig } from "../components/CameraRig";
import { CAMERA_FOV, START_DISTANCE } from "../components/cameraSettings";
import { ConstellationMenu } from "../components/ConstellationMenu";
import { Earth } from "../components/Earth";
import { FocusedSatellite } from "../components/FocusedSatellite";
import { GlobeHeader } from "../components/GlobeHeader";
import { MenuButton } from "../components/MenuButton";
import { Moon } from "../components/Moon";
import { OrbitPath } from "../components/OrbitPath";
import { Satellite } from "../components/Satellite";
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
          getSatellitePosition={vm.getSatellitePosition}
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
          {vm.satellites.map((satellite) => (
            <group key={satellite.id}>
              <OrbitPath points={vm.orbitPaths[satellite.id] ?? []} />
              <Satellite
                id={satellite.id}
                family={satellite.family}
                selected={satellite.id === vm.selectedId}
                getPosition={vm.getSatellitePosition}
                onSelect={vm.selectSatellite}
              />
            </group>
          ))}
        </Suspense>

        {vm.selected && (
          <Suspense fallback={null}>
            <FocusedSatellite
              key={vm.selected.id}
              id={vm.selected.id}
              family={vm.selected.family}
              getPosition={vm.getSatellitePosition}
              getVelocity={vm.getSatelliteVelocity}
              getSunDirection={vm.getSunDirection}
            />
          </Suspense>
        )}
      </Canvas>
      <ConstellationMenu open={vm.menuOpen} />
      <GlobeHeader menuOpen={vm.menuOpen} trackedCount={vm.satellites.length} />
      {vm.details && vm.selected && (
        <SatelliteDetailsSheet
          details={vm.details}
          family={vm.selected.family}
          onClose={vm.clearSelection}
        />
      )}
      <MenuButton
        open={vm.menuOpen}
        hidden={vm.selected !== null}
        onPress={vm.toggleMenu}
      />
    </View>
  );
}
