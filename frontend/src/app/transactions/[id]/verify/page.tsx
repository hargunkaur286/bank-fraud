import { OtpVerifyClient } from "./otp-verify-client";

export default async function VerifyTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OtpVerifyClient transactionId={id} />;
}
