import { Badge } from "@modules/common/components/ui"

/** Shown next to test payment providers. Cash on delivery is a real method, so nothing is shown. */
const PaymentTest = ({ className }: { className?: string }) => {
  if (process.env.NEXT_PUBLIC_SHOW_PAYMENT_TEST_BADGE !== "true") {
    return null
  }
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">تنبيه:</span> للاختبار فقط.
    </Badge>
  )
}

export default PaymentTest
