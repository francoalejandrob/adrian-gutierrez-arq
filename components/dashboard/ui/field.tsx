import { labelClass, inputClass, textareaClass } from "./styles";

type BaseProps = {
  label: string;
  name: string;
  required?: boolean;
};

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
  min,
  max,
}: BaseProps & {
  type?: string;
  defaultValue?: string | number | null;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      />
    </div>
  );
}

export function TextareaField({
  label,
  name,
  required,
  rows = 3,
  defaultValue,
}: BaseProps & { rows?: number; defaultValue?: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={textareaClass}
      />
    </div>
  );
}
