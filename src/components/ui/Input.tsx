import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block type-label text-secondary mb-[var(--space-label-value)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-abi-text-dim">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-abi-bg border border-abi-border rounded-md
            px-3 py-2 type-body text-primary placeholder-abi-text-dim
            focus:outline-none focus:border-abi-orange focus:ring-1 focus:ring-abi-orange/25
            transition-colors duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-abi-danger' : ''}
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        />
      </div>
      {error && (
        <p className="type-caption text-negative mt-[var(--space-value-meta)]">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({
  label,
  options,
  error,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block type-label text-secondary mb-[var(--space-label-value)]">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-abi-bg border border-abi-border rounded-md
          px-3 py-2 type-body text-primary
          focus:outline-none focus:border-abi-orange focus:ring-1 focus:ring-abi-orange/25
          transition-colors duration-200 cursor-pointer
          ${error ? 'border-abi-danger' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="type-caption text-negative mt-[var(--space-value-meta)]">{error}</p>
      )}
    </div>
  );
}

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  value?: number;
  onChange: (value?: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className = '',
  ...props
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || v === null) {
      onChange(undefined);
      return;
    }
    const parsed = parseFloat(v);
    onChange(Number.isNaN(parsed) ? undefined : parsed);
  };

  return (
    <Input
      type="number"
      label={label}
      value={value !== undefined ? value : ''}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className={className}
      {...props}
    />
  );
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  className = '',
  ...props
}: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="
          w-4 h-4 rounded-sm border-abi-border bg-abi-bg
          checked:bg-abi-orange checked:border-abi-orange
          focus:ring-abi-orange/30 focus:ring-offset-0
          cursor-pointer transition-colors
        "
        {...props}
      />
      <span className="text-sm text-abi-text">{label}</span>
    </label>
  );
}
