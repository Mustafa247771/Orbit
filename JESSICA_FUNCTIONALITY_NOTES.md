# Orbit — Jessica branch integration notes

These commits adapt to the actual `jessica` snapshot exported after its first three commits.
They are intentionally separated by **functionality**, not by screen.

## Setup

After the commits are applied, run in the Orbit repository:

```bash
npm install
npx expo install --check
npx expo start --clear
```

For native calendar support, create and install an updated **development build** (Expo Go does not bundle `expo-calendar`). Do not upgrade Expo or overwrite another contributor's changes without checking first.

## Functional behavior

- **Passes:** CelesTrak TLE is fetched by NORAD ID and cached; SGP4 propagation predicts passes over seven days. Open-Meteo clouds, twilight and satellite shadow decide whether a pass qualifies as potentially visible. Cloud/weather outages must show unknown visibility, never good.
- **Locations:** GPS is requested when the Passes screen opens. If permission is denied, the UI clearly labels fallback city locations as samples.
- **Reminders:** Only passes marked optically visible are scheduled as local notifications. Notification permission is requested when toggled on; first visit does not automatically enable reminders. Current implementation only covers ISS naked-eye mode. It does not yet synchronize preferences from Profile.
- **Sky Finder:** Uses GPS and CelesTrak, updates target bearings, uses device heading/motion and graded haptics. Pointing accuracy must be tested on real hardware; compass calibration, case magnets and phone orientation can reduce accuracy.
- **Sighting:** Camera/gallery and local storage were already implemented. It now supports ISS/satellite/other selection and attempts GPS capture automatically after a new photo. Community visibility means a **local preview/pending upload only**; it does not publish to other users without the planned Firebase/Cloudinary backend.
- **Launches:** Existing Launch Library 2 API and cache are retained. Requests time out, launch details open, and Calendar opens the device editor for the user to confirm. The calendar function requires an iOS/Android development build.

## Test on a real iPhone

1. Open Visible Passes, allow location, verify the location label is GPS; switch to a sample city and ensure predictions change.
2. Turn Filter on/off. Confirm only optically visible passes qualify for reminders. If clouds are unavailable, do not show them as visible.
3. Open a pass row for details; set a reminder after allowing notifications; verify scheduled local notifications on the device. Predictions are approximate and may vary.
4. Open Sky Finder, allow motion and location, rotate and tilt the phone and compare the displayed bearings with actual sky visibility.
5. Capture a sighting, change its object type, verify timestamp/location. Save as Community and verify a **local** post appears in the Community feed.
6. Open Launch Calendar, pull to refresh, open a mission, and use Add to phone calendar. Confirm the event in the native editor.
7. Test denied permissions, offline launches, poor connectivity and app restart.

## Limits

No backend credentials were supplied; public community upload, cross-device syncing, remote reminders, and shared account settings are not claimed to be implemented. Full device testing must be completed on your machine. No code in `master` or remote GitHub branches is modified by the patch archive.
