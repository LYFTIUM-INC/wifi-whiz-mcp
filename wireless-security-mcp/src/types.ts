import { z } from 'zod';

// Common types for wireless security operations
export interface NetworkInfo {
  bssid: string;
  ssid: string;
  channel: number;
  power: number;
  encryption: string;
  clients?: ClientInfo[];
}

export interface ClientInfo {
  mac: string;
  power: number;
  packets: number;
}

export interface ScanResult {
  networks: NetworkInfo[];
  timestamp: Date;
  interface: string;
}

// Validation schemas
export const InterfaceSchema = z.string().regex(/^[a-zA-Z0-9]+$/);
export const ChannelSchema = z.number().int().min(1).max(14);
export const BSSIDSchema = z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
export const TimeoutSchema = z.number().int().min(1).max(3600);

// Tool-specific configurations
export interface AircrackConfig {
  interface: string;
  monitorMode?: boolean;
  channel?: number;
  bssid?: string;
  timeout?: number;
}

export interface KismetConfig {
  interface: string;
  channels?: number[];
  gpsEnabled?: boolean;
  exportFormat?: 'json' | 'pcap' | 'csv';
}

export interface WifiteConfig {
  interface: string;
  targetBssid?: string;
  attackMode?: 'wpa' | 'wps' | 'wep' | 'all';
  timeout?: number;
  verbose?: boolean;
}

// Process execution result
export interface ProcessResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
}