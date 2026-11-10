import { readJson, writeJson } from "@/core/storage/jsonFile";
import type { DeviceSettings } from "./Profile";
import { parseDeviceSettings } from "./profileValidation";

const FILE_NAME = "device-settings.json";

export class DeviceSettingsRepository {
  async read(): Promise<DeviceSettings> {
    return parseDeviceSettings(await readJson(FILE_NAME));
  }

  write(settings: DeviceSettings): Promise<void> {
    return writeJson(FILE_NAME, settings);
  }
}

export const deviceSettingsRepository = new DeviceSettingsRepository();
