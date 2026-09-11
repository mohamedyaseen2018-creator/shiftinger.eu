import { createContext, useContext, type ReactNode } from "react";
import { useDeviceTypeValue, type DeviceType } from "@/hooks/useDeviceType";

const DeviceTypeContext = createContext<DeviceType>("desktop");

export function DeviceTypeProvider({ children }: { children: ReactNode }) {
  const deviceType = useDeviceTypeValue();
  return (
    <DeviceTypeContext.Provider value={deviceType}>{children}</DeviceTypeContext.Provider>
  );
}

/** Read the current device type anywhere below <DeviceTypeProvider />. */
export function useDeviceType(): DeviceType {
  return useContext(DeviceTypeContext);
}

export function useIsMobileDevice(): boolean {
  return useDeviceType() === "mobile";
}

export type { DeviceType };
