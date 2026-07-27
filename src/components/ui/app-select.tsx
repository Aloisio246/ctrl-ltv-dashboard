import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_VALUE = "__ctrl_ltv_empty__";

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className,
  disabled,
  required,
}: AppSelectProps) {
  const internalValue = value || (placeholder ? EMPTY_VALUE : options[0]?.value);

  return (
    <Select
      value={internalValue}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? "" : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        aria-required={required || undefined}
        className={className}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {placeholder && <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
