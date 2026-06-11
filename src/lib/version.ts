export const APP_VERSION = '0.3.0-alpha';

export const SETTINGS_FORMAT = 'lwag-settings';
export const SETTINGS_SCHEMA_VERSION = 1;

export const PROJECT_FORMAT = 'lwag-project';
export const PROJECT_SCHEMA_VERSION = 1;

// v85: added lightsProfileSlots + cameraFxProfileSlots; SceneSlot gained
// lightsSlotIndex/cameraFxSlotIndex and the 3-state 'off' binding ref.
// v86: spectrumInstances replace spectrumClone* keys; low-energy inversion
// controls for spectrum rotation and particle audio drift.
// v87: low-energy spectrum rotation hold plus Depth Flow focus inversion.
export const STORE_PERSIST_VERSION = 87;
