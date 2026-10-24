"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Fees and delivery rules from the database settings, loaded once in the layout. */
export type Config = {
  deliveryFee: number;
  platformFee: number;
  /** Each restaurant's bill must reach this for delivery; below it the customer picks up in person. */
  deliveryMinimum: number;
  /** Belgrade and its surrounding municipalities; anywhere else is pickup only. */
  deliveryCities: string[];
};

const ConfigContext = createContext<Config | null>(null);

export function ConfigProvider({ config, children }: { config: Config; children: ReactNode }) {
  return <ConfigContext value={config}>{children}</ConfigContext>;
}

export function useConfig() {
  const value = useContext(ConfigContext);
  if (!value) throw new Error("useConfig must be used inside ConfigProvider");
  return value;
}
