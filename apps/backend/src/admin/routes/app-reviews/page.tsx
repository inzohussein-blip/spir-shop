import { defineRouteConfig } from "@medusajs/admin-sdk"
import { StarSolid } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/api"
import { TenantBar } from "../../components/tenant-bar"

type Review = {
  id: string
  rating: number
  name: string
  comment: string | null
  status: "approved" | "hidden"
  order_id: string
  created_at: string
  product: { id: string; title: string; thumbnail: string | null } | null
}

/** Product reviews from customers (verified purchases): hide, show or delete. */
const AppReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])

  const load = () => adminFetch<{ reviews: Review[] }>("/admin/app-reviews").then((r) => setReviews(r.reviews))
  useEffect(() => {
    load().catch((e) => toast.error((e as Error).message))
  }, [])

  const toggle = async (r: Review) => {
    await adminFetch(`/admin/app-reviews/${r.id}`, {
      method: "POST",
      body: { status: r.status === "approved" ? "hidden" : "approved" },
    })
    await load()
  }

  const remove = async (r: Review) => {
    if (!window.confirm("حذف هذا التقييم نهائياً؟")) return
    await adminFetch(`/admin/app-reviews/${r.id}`, { method: "DELETE" })
    await load()
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "-"

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <TenantBar />
    <Container className="flex flex-col gap-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Heading level="h1">تقييمات المنتجات</Heading>
        <Badge>{`${reviews.length} تقييم - المعدل ${avg}`}</Badge>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        يقدر يقيّم فقط الزبون اللي طلب المنتج. التقييمات تظهر مباشرة، وتقدر تخفي أي تقييم.
      </Text>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>المنتج</Table.HeaderCell>
            <Table.HeaderCell>التقييم</Table.HeaderCell>
            <Table.HeaderCell>التعليق</Table.HeaderCell>
            <Table.HeaderCell>الحالة</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {reviews.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  {r.product?.thumbnail ? (
                    <img src={r.product.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : null}
                  <Text size="small">{r.product?.title ?? r.id}</Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span style={{ color: "#e2a93b" }}>{"★".repeat(r.rating)}</span>
                <span style={{ color: "#ccc" }}>{"★".repeat(5 - r.rating)}</span>
              </Table.Cell>
              <Table.Cell>
                <Text size="small" weight="plus">{r.name}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">{r.comment ?? ""}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall" color={r.status === "approved" ? "green" : "grey"}>
                  {r.status === "approved" ? "ظاهر" : "مخفي"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => toggle(r)}>
                    {r.status === "approved" ? "إخفاء" : "إظهار"}
                  </Button>
                  <Button size="small" variant="danger" onClick={() => remove(r)}>
                    حذف
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {!reviews.length ? <Text className="text-ui-fg-subtle">لا توجد تقييمات بعد</Text> : null}
    </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "التقييمات",
  icon: StarSolid,
  rank: 6,
})

export default AppReviewsPage
