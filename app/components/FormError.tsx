type FormErrorProps = {
  error?: string | string[] | null;
  message?: string | string[] | null;
};

export default function FormError({ error, message }: FormErrorProps) {
  const text = error || message;
  if (!text) return null;

  const display = Array.isArray(text) ? text[0] : text;

  return (
    <p className="text-red-500 text-xs mt-1" role="alert">
      {display}
    </p>
  );
}