import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  /** Color per option value, from product.metadata.swatches ({ "Berry": "#8e2a4f" }) */
  swatches?: Record<string, string> | null
  "data-testid"?: string
}

const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v)

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  name,
  "data-testid": dataTestId,
  disabled,
  swatches,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const hasSwatches = filteredOptions.some((v) => isHex(swatches?.[v]))

  return (
    <fieldset className="flex flex-col gap-y-3" disabled={disabled}>
      <legend className="text-sm mb-3">
        {hasSwatches && current ? `${title}: ${current}` : `اختر ${title}`}
      </legend>
      <div
        className={clx("flex flex-wrap gap-2", { "justify-between": !hasSwatches })}
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const id = `${name}-${v}`.replace(/[^A-Za-z0-9_-]/g, "-")
          const color = swatches?.[v]
          if (isHex(color)) {
            return (
              <div key={v}>
                <input
                  type="radio"
                  id={id}
                  name={name}
                  value={v}
                  checked={v === current}
                  onChange={() => updateOption(option.id, v)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  title={v}
                  aria-label={v}
                  className={clx(
                    "flex cursor-pointer rounded-full border-2 p-0.5 peer-focus-visible:ring-2 peer-disabled:cursor-not-allowed",
                    v === current ? "border-ui-fg-base" : "border-transparent"
                  )}
                  data-testid="option-swatch"
                >
                  <span
                    className="block h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                </label>
              </div>
            )
          }
          return (
            <div key={v} className="flex-1">
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={v === current}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={clx(
                  "flex items-center justify-center cursor-pointer border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-disabled:cursor-not-allowed",
                  {
                    "border-ui-border-interactive": v === current,
                    "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                      v !== current,
                  }
                )}
                data-testid="option-button"
              >
                {v}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
