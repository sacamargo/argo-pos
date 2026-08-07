import { Input } from "@/components";

type ListSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ListSearchInput({
  value,
  onChange,
  placeholder = "Buscar por nombre…",
}: ListSearchInputProps) {
  return (
    <Input
      className="h-11 w-full max-w-md"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label="Buscar por nombre"
      type="search"
      autoComplete="off"
    />
  );
}
