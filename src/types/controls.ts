export type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export type ToggleControlProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};
