"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AxiosError } from "axios";
import { getMe } from "../../services/userService";
import { getBanks, resolveAccount, updateBankDetails } from "../../services/bankService";
import toast from "react-hot-toast";
import { Landmark, Lock, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

// Reference RHF + Zod conversion — see todo doc item #6. Other manual-
// validation forms (register, KYC, PIN flows) can follow this pattern.
const bankDetailsSchema = z.object({
  bank_code: z.string().min(1, "Select a bank"),
  bank_name: z.string().min(1, "Select a bank"),
  account_number: z
    .string()
    .length(10, "Account number must be exactly 10 digits")
    .regex(/^\d+$/, "Account number must be digits only"),
  // account_name is populated by the auto-verify effect below, not typed
  // directly — this just guards against submitting before verification.
  account_name: z.string().min(1, "Verify your account before saving"),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

interface Bank {
  code: string;
  name: string;
  [key: string]: unknown;
}

// Mirrors the ApiErrorBody shape used in utils/handleApiError.ts, kept
// local since this component doesn't route through that helper.
interface ApiErrorBody {
  message?: string;
  error?: string;
}

export default function BankDetails() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const isLockedRef = useRef(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bank_code: "",
      bank_name: "",
      account_number: "",
      account_name: "",
    },
  });

  const bankCode = watch("bank_code");
  const accountNumber = watch("account_number");
  const accountName = watch("account_name");

  /* ── Fetch existing details ── */
  useEffect(() => {
    (async () => {
      try {
        const data: Record<string, any> = await getMe();
        const bank: string = data.bank_name?.trim() || "";
        const number: string = data.account_number?.trim() || "";
        const name: string = data.account_name?.trim() || "";
        setValue("bank_name", bank);
        setValue("account_number", number);
        setValue("account_name", name);
        if (bank && number && name) {
          isLockedRef.current = true;
          setIsLocked(true);
        }
      } catch {
        toast.error("Unable to load your bank details.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch bank list ── */
  useEffect(() => {
    (async () => {
      try {
        setBanks(await getBanks());
      } catch {
        toast.error("Unable to load bank list.");
      }
    })();
  }, []);

  /* ── Auto-verify account ── */
  useEffect(() => {
    if (isLockedRef.current) return;
    if (!bankCode || accountNumber.length !== 10) return;
    const verify = async () => {
      setVerifying(true);
      try {
        const res = await resolveAccount(accountNumber, bankCode);
        const name: string = res.account_name || res.data?.account_name || "";
        if (name) {
          setValue("account_name", name, { shouldValidate: true });
          toast.success("Account verified!");
        } else {
          setValue("account_name", "", { shouldValidate: true });
          toast.error("Unable to verify account.");
        }
      } catch {
        setValue("account_name", "", { shouldValidate: true });
        toast.error("Account verification failed.");
      } finally {
        setVerifying(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber]);

  /* ── Submit ── */
  const onSubmit = async (values: BankDetailsFormValues) => {
    setLoading(true);
    try {
      const res = await updateBankDetails({
        bank_code: values.bank_code,
        bank_name: values.bank_name,
        account_number: values.account_number,
        account_name: values.account_name,
      });
      isLockedRef.current = true;
      setIsLocked(true);
      toast.success(res.message || "Bank details saved!");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      toast.error(
        axiosErr.response?.data?.message || axiosErr.response?.data?.error || "Failed to save bank details"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="space-y-4">
        <ReadonlyField label="Bank Name" value={watch("bank_name")} />
        <ReadonlyField label="Account Number" value={watch("account_number")} />
        <ReadonlyField label="Account Name" value={watch("account_name")} />

        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5 mt-2">
          <Lock size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Bank details are locked after being set once. Contact support to change them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Bank selector */}
      <Field label="Bank Name" error={errors.bank_code?.message}>
        <div className="relative">
          <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={14} />
          <Controller
            name="bank_code"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => {
                  const code = e.target.value;
                  const bank = banks.find((b: Bank) => b.code === code);
                  field.onChange(code);
                  setValue("bank_name", bank?.name || "");
                }}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white pl-11 pr-10 py-3 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0D1F1A]">Select Bank</option>
                {banks.map((bank, i) => (
                  <option key={`${bank.code}-${i}`} value={bank.code} className="bg-[#0D1F1A]">
                    {bank.name}
                  </option>
                ))}
              </select>
            )}
          />
          <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
        </div>
      </Field>

      {/* Account number */}
      <Field label="Account Number" error={errors.account_number?.message}>
        <Controller
          name="account_number"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              placeholder="Enter 10-digit account number"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all tracking-widest"
            />
          )}
        />
        {/* Verifying indicator */}
        {verifying && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
            <div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
            Verifying account...
          </div>
        )}
      </Field>

      {/* Account name (readonly, populated after verify) */}
      {accountName && !verifying && (
        <Field label="Account Name">
          <div className="relative">
            <input
              type="text" value={accountName} readOnly
              className="w-full bg-white/3 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm cursor-not-allowed"
            />
            <CheckCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
          </div>
        </Field>
      )}

      <button
        type="submit"
        disabled={loading || verifying || !accountName}
        className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
            Saving...
          </span>
        ) : "Save Bank Details"}
      </button>
    </form>
  );
}

/* ── Sub-components ── */
interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}

function Field({ label, children, error }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">{label}</label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

interface ReadonlyFieldProps {
  label: string;
  value: string;
}

function ReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <Field label={label}>
      <input
        type="text" value={value} readOnly
        className="w-full bg-white/3 border border-white/8 text-white/50 px-4 py-3 rounded-xl text-sm cursor-not-allowed"
      />
    </Field>
  );
}