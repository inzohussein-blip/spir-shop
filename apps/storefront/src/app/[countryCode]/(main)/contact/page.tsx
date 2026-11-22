import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "التواصل",
  description: `How to contact ${STORE_NAME}.`,
}

export default function ContactPage() {
  return (
    <PolicyPage title="تواصل معنا">
      <PlaceholderNotice />
      <p>
        Questions about an order, shipping or returns? Contact {STORE_NAME}{" "}
        customer service and include your order number.
      </p>
    </PolicyPage>
  )
}
