import { InterfaceSchema, BSSIDSchema, ChannelSchema, TimeoutSchema } from '../types.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateInterface(iface: string): void {
  try {
    InterfaceSchema.parse(iface);
  } catch (error) {
    throw new ValidationError(`Invalid interface name: ${iface}. Must contain only alphanumeric characters.`);
  }
}

export function validateBSSID(bssid: string): void {
  try {
    BSSIDSchema.parse(bssid);
  } catch (error) {
    throw new ValidationError(`Invalid BSSID format: ${bssid}. Expected format: XX:XX:XX:XX:XX:XX`);
  }
}

export function validateChannel(channel: number): void {
  try {
    ChannelSchema.parse(channel);
  } catch (error) {
    throw new ValidationError(`Invalid channel: ${channel}. Must be between 1 and 14.`);
  }
}

export function validateTimeout(timeout: number): void {
  try {
    TimeoutSchema.parse(timeout);
  } catch (error) {
    throw new ValidationError(`Invalid timeout: ${timeout}. Must be between 1 and 3600 seconds.`);
  }
}

export function validateChannelList(channels: number[]): void {
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new ValidationError('Channel list must be a non-empty array');
  }
  
  channels.forEach(channel => validateChannel(channel));
}

export function validateAttackMode(mode: string): void {
  const validModes = ['wpa', 'wps', 'wep', 'all'];
  if (!validModes.includes(mode)) {
    throw new ValidationError(`Invalid attack mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
  }
}

export function validateExportFormat(format: string): void {
  const validFormats = ['json', 'pcap', 'csv'];
  if (!validFormats.includes(format)) {
    throw new ValidationError(`Invalid export format: ${format}. Must be one of: ${validFormats.join(', ')}`);
  }
}