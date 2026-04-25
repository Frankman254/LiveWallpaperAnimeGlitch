import { registerRenderSubsystem } from '../renderSubsystem';
import {
	logoSubsystem,
	spectrumSubsystem,
	trackTitleSubsystem
} from './audioLayers';
import {
	backgroundSubsystem,
	hudSubsystem,
	looksSubsystem,
	motionSubsystem,
	overlaysSubsystem,
	particlesSubsystem,
	rainSubsystem
} from './stubs';

let installed = false;

export function installDefaultRenderSubsystems(): void {
	if (installed) return;
	installed = true;
	registerRenderSubsystem(backgroundSubsystem);
	registerRenderSubsystem(looksSubsystem);
	registerRenderSubsystem(motionSubsystem);
	registerRenderSubsystem(particlesSubsystem);
	registerRenderSubsystem(rainSubsystem);
	registerRenderSubsystem(spectrumSubsystem);
	registerRenderSubsystem(logoSubsystem);
	registerRenderSubsystem(trackTitleSubsystem);
	registerRenderSubsystem(overlaysSubsystem);
	registerRenderSubsystem(hudSubsystem);
}
