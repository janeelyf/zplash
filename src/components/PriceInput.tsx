"use client";

export default function PriceInput({
  value,
  onChange,
  placeholder = "$0",
  style,
}: {
  value: string;
  onChange: (digitos: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const formateado = value ? "$" + Number(value).toLocaleString("es-CL") : "";
  return (
    <input
      inputMode="numeric"
      value={formateado}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      placeholder={placeholder}
      style={style}
    />
  );
}
