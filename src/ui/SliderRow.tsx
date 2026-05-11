import type { ComponentProps } from 'react';
import Slider from './Slider';

export type SliderRowProps = ComponentProps<typeof Slider>;

export default function SliderRow(props: SliderRowProps) {
	return <Slider {...props} />;
}
