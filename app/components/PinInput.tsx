import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";

type PinInputProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  touched?: boolean;
  setTouched?: (touched: boolean) => void;
  disabled?: boolean;
};

export default function PinInput({
  value = ["", "", "", ""], // default fallback
  onChange,
  touched,
  setTouched,
  disabled,
}: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newPin = [...value];
    newPin[idx] = digit;
    onChange(newPin);

    if (setTouched) setTouched(true);

    if (digit && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const newPin = [...value];
      if (value[idx] === "" && idx > 0) {
        refs.current[idx - 1]?.focus();
        newPin[idx - 1] = "";
      } else {
        newPin[idx] = "";
      }
      onChange(newPin);
      e.preventDefault();
    }
  };

  const pinArray = Array.isArray(value) ? value : ["", "", "", ""];
  const isIncomplete = touched && pinArray.some((d) => d === "");

  useEffect(() => {
    if (!disabled && refs.current[0]) refs.current[0].focus();
  }, [disabled]);

  return (
    <div className="flex gap-2 justify-center">
      {pinArray.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={`w-12 h-12 text-center text-xl border rounded-lg transition-all 
            ${isIncomplete && !digit
              ? "border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:ring-blue-300"}
            focus:ring-2 focus:outline-none`}
        />
      ))}
    </div>
  );
}