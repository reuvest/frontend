import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent, type ChangeEvent } from "react";

type OTPInputProps = {
  value?: string;
  valueLength?: number;
  onChange: (value: string) => void;
};

export default function OTPInput({ value = "", valueLength = 6, onChange }: OTPInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = value.split("").concat(Array(valueLength).fill("")).slice(0, valueLength);

  const focusInput = (index: number) => {
    const ref = inputRefs.current[index];
    if (ref) ref.focus();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;

    const newOTP = otp.map((d, i) => (i === index ? val : d)).join("");
    onChange(newOTP);

    if (index < valueLength - 1) focusInput(index + 1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOTP = otp.map((d, i) => (i === index ? "" : d)).join("");
      onChange(newOTP);
      if (index > 0) focusInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, valueLength).replace(/\D/g, "");
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, valueLength - 1));
    }
  };

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, valueLength);
  }, [valueLength]);

  return (
    <div
      className="flex justify-center gap-2"
      onPaste={handlePaste}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-10 h-12 border border-gray-300 rounded text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  );
}