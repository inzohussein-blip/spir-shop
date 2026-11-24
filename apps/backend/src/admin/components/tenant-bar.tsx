import { Badge, Select, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, currentTenantId, TENANT_KEY } from "../lib/api"

type Tenant = { id: string; name: string; slug: string; is_default: boolean; status: string }

/**
 * Store switcher shown on top of every app page (builder, stories,
 * notifications, settings, reviews). Changing it reloads the page so
 * everything below works on the chosen store.
 */
export const TenantBar = () => {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [current, setCurrent] = useState(currentTenantId())

  useEffect(() => {
    adminFetch<{ tenants: Tenant[] }>("/admin/app-tenants")
      .then((r) => {
        setTenants(r.tenants)
        setCurrent((cur) => {
          if (cur && r.tenants.some((t) => t.id === cur)) return cur
          const def = r.tenants.find((t) => t.is_default) ?? r.tenants[0]
          return def?.id ?? ""
        })
      })
      .catch(() => undefined)
  }, [])

  if (tenants.length < 2) return null
  const t = tenants.find((x) => x.id === current)
  return (
    <div className="bg-ui-bg-base flex items-center gap-3 rounded-lg border p-3" dir="rtl">
      <Text weight="plus">المتجر:</Text>
      <div className="w-64">
        <Select
          value={current}
          onValueChange={(v) => {
            window.localStorage.setItem(TENANT_KEY, v)
            window.location.reload()
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="اختر المتجر" />
          </Select.Trigger>
          <Select.Content>
            {tenants.map((x) => (
              <Select.Item key={x.id} value={x.id}>
                {x.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      {t?.status === "suspended" ? <Badge color="red">متوقف</Badge> : null}
      <Text size="small" className="text-ui-fg-subtle">كل الإعدادات بهذه الصفحة تخص هذا المتجر فقط.</Text>
    </div>
  )
}
