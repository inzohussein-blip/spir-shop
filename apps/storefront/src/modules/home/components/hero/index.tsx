import { Button, Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-gradient-to-b from-[#fbeeec] to-[#f6e3e1]">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-6 small:p-32 gap-6">
        <span className="flex flex-col gap-3">
          <Heading level="h1" className="text-3xl small:text-4xl leading-tight text-[#5c2733] font-semibold">
            جمالك يبدأ من العناية
          </Heading>
          <Heading level="h2" className="text-lg small:text-xl leading-8 text-[#8a3b4a] font-normal">
            منتجات عناية بالبشرة والشعر ومكياج أصلية — توصيل لكل المحافظات والدفع عند الاستلام
          </Heading>
        </span>
        <LocalizedClientLink href="/store">
          <Button variant="primary" size="large">
            تسوّقي الآن
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Hero
