export type SliderRange = {
	min: number;
	max: number;
	step: number;
};

export type SliderControlProps = {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	unit?: string;
	tooltip?: string;
	effectiveValue?: number; // shown when capped/limited by external logic
};

export type ToggleControlProps = {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
	tooltip?: string;
};
