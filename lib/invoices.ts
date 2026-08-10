// lib/invoices.ts
import { SupabaseClient } from "@supabase/supabase-js";

export async function getNextInvoiceNumber(supabaseClient: SupabaseClient): Promise<string> {
  const { data } = await supabaseClient
    .from("invoices")
    .select("invoice_number");

  let maxNum = 0;
  if (data && data.length > 0) {
    data.forEach((inv: { invoice_number?: string }) => {
      if (inv.invoice_number) {
        const num = parseInt(inv.invoice_number.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  return `INV-${String(nextNum).padStart(4, "0")}`;
}