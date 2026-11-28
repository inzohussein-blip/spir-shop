// Renders the demo product photos and home banners from
// apps/backend/src/scripts/demo-assets/catalog.json into demo-assets/v2/.
//
//   node tools/demo-images/render.js            (needs Playwright + Chromium)
//
// Products are drawn in CSS (bottles, jars, tubes...) with soft light and
// shadows, without brand logos. Two photos per product (3:4): the product,
// and a detail shot with its texture or shades. Banners are 2:1.
const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "../..")
const ASSETS = path.join(ROOT, "apps/backend/src/scripts/demo-assets")
const OUT = path.join(ASSETS, "v2")
const FONT = path.join(ROOT, "node_modules/@expo-google-fonts/tajawal")
const catalog = JSON.parse(fs.readFileSync(path.join(ASSETS, "catalog.json"), "utf8"))

/* ------------------------------- colours ------------------------------- */
const hex = (h) => h.replace("#", "").match(/../g).map((x) => parseInt(x, 16))
const toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")
/** lighten (+) or darken (-) by a fraction */
const shade = (h, f) => toHex(hex(h).map((v) => (f >= 0 ? v + (255 - v) * f : v * (1 + f))))
const luminance = (h) => {
  const [r, g, b] = hex(h)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
const ink = (h) => (luminance(h) > 0.6 ? "#1d1d1f" : "#ffffff")
/** horizontal light falloff of a cylinder */
const cyl = (c) =>
  `linear-gradient(90deg, ${shade(c, -0.28)} 0%, ${shade(c, -0.08)} 10%, ${shade(c, 0.35)} 26%, ${shade(c, 0.12)} 40%, ${c} 58%, ${shade(c, -0.12)} 82%, ${shade(c, -0.32)} 100%)`
const metal = (c) =>
  `linear-gradient(90deg, ${shade(c, -0.35)} 0%, ${shade(c, 0.45)} 22%, ${shade(c, 0.1)} 40%, ${shade(c, -0.15)} 65%, ${shade(c, 0.3)} 85%, ${shade(c, -0.4)} 100%)`
const gloss = `<div style="position:absolute;left:18%;top:6%;width:9%;height:80%;border-radius:40px;background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,0));filter:blur(1px)"></div>`

/* ------------------------------- labels -------------------------------- */
function label(p, { w, top, h, bg, color, size = 30 }) {
  let fg = color || p.accent
  // keep the text readable on a white label (or on the bare body when there is no label)
  const under = bg ? "#ffffff" : p.body
  if (Math.abs(luminance(fg) - luminance(under)) < 0.35) fg = luminance(under) > 0.5 ? (luminance(p.body) < 0.5 ? p.body : "#1d1d1f") : "#ffffff"
  return `<div style="position:absolute;left:50%;transform:translateX(-50%);top:${top}px;width:${w}px;height:${h}px;${bg ? `background:${bg};` : ""}display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-radius:6px">
    <div style="font:700 ${size}px/1 Tajawal;letter-spacing:${Math.round(size / 10)}px;color:${fg};text-align:center">${p.label}</div>
    <div style="width:${Math.round(w * 0.35)}px;height:2px;background:${fg};opacity:.5"></div>
    <div style="font:500 ${Math.round(size * 0.55)}px/1.1 Tajawal;letter-spacing:1px;color:${fg};opacity:.85;text-align:center">${p.sub}</div>
  </div>`
}

/* ---------------------------- product shapes ---------------------------- */
// Each returns {w, h, html}: a product standing on the floor at its bottom edge.
const SHAPES = {
  dropper(p) {
    const glass = p.body
    return {
      w: 230,
      h: 560,
      html: `
      <div style="position:absolute;left:85px;top:0;width:60px;height:110px;border-radius:30px 30px 10px 10px;background:${cyl("#2a2a2a")}"></div>
      <div style="position:absolute;left:62px;top:100px;width:106px;height:90px;border-radius:8px;background:${metal(p.accent === "#ffffff" ? "#d8c08a" : "#3a3a3a")}"></div>
      <div style="position:absolute;left:0;top:180px;width:230px;height:380px;border-radius:40px 40px 34px 34px;background:${cyl(glass)};overflow:hidden">
        ${gloss}
        <div style="position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(180deg,${shade(p.texture || glass, -0.05)}55,${shade(p.texture || glass, -0.25)}88)"></div>
        ${label(p, { w: 180, top: 120, h: 150, bg: "rgba(255,255,255,.92)", color: luminance(p.accent) > 0.9 ? shade(glass, -0.55) : p.accent, size: 26 })}
      </div>`,
    }
  },
  pump(p) {
    const b = p.body
    return {
      w: 250,
      h: 640,
      html: `
      <div style="position:absolute;left:150px;top:18px;width:90px;height:26px;border-radius:6px 14px 14px 6px;background:${cyl(p.accent === "#ffffff" ? "#e6e6e6" : shade(p.accent, 0.1))}"></div>
      <div style="position:absolute;left:95px;top:0;width:66px;height:70px;border-radius:10px;background:${cyl(p.accent === "#ffffff" ? "#ececec" : p.accent)}"></div>
      <div style="position:absolute;left:108px;top:66px;width:40px;height:50px;background:${cyl("#e9e9e9")}"></div>
      <div style="position:absolute;left:75px;top:110px;width:100px;height:56px;border-radius:10px 10px 4px 4px;background:${cyl(p.accent === "#ffffff" ? "#ececec" : p.accent)}"></div>
      <div style="position:absolute;left:0;top:160px;width:250px;height:480px;border-radius:44px 44px 30px 30px;background:${cyl(b)};overflow:hidden${p.glass ? ";opacity:.95" : ""}">
        ${gloss}
        ${label(p, { w: 200, top: 130, h: 200, bg: luminance(b) > 0.85 ? "" : "rgba(255,255,255,.9)", size: 28 })}
      </div>`,
    }
  },
  bottle(p) {
    const b = p.body
    return {
      w: 240,
      h: 620,
      html: `
      <div style="position:absolute;left:62px;top:0;width:116px;height:96px;border-radius:14px 14px 6px 6px;background:${cyl(p.accent)}"></div>
      <div style="position:absolute;left:0;top:90px;width:240px;height:530px;border-radius:70px 70px 30px 30px;background:${cyl(b)};overflow:hidden">
        ${gloss}
        ${label(p, { w: 190, top: 170, h: 210, bg: luminance(b) > 0.8 ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.9)", size: 28 })}
      </div>`,
    }
  },
  oil(p) {
    return {
      w: 200,
      h: 560,
      html: `
      <div style="position:absolute;left:66px;top:0;width:68px;height:120px;border-radius:10px;background:${cyl(p.accent)}"></div>
      <div style="position:absolute;left:78px;top:112px;width:44px;height:60px;background:${cyl(p.body)}"></div>
      <div style="position:absolute;left:0;top:160px;width:200px;height:400px;border-radius:90px 90px 26px 26px;background:${cyl(p.body)};overflow:hidden">
        ${gloss}
        ${label(p, { w: 160, top: 150, h: 160, bg: "rgba(255,248,235,.95)", color: "#5a3a12", size: 26 })}
      </div>`,
    }
  },
  jar(p) {
    const b = p.body
    return {
      w: 380,
      h: 330,
      html: `
      <div style="position:absolute;left:0;top:0;width:380px;height:110px;border-radius:22px 22px 10px 10px;background:${cyl(p.accent)}"></div>
      <div style="position:absolute;left:0;top:12px;width:380px;height:16px;background:rgba(255,255,255,.25)"></div>
      <div style="position:absolute;left:8px;top:104px;width:364px;height:226px;border-radius:12px 12px 40px 40px;background:${cyl(b)};overflow:hidden">
        ${gloss}
        ${label(p, { w: 290, top: 36, h: 150, bg: luminance(b) > 0.8 ? "" : "rgba(255,255,255,.9)", size: 34 })}
      </div>`,
    }
  },
  tin(p) {
    return {
      w: 420,
      h: 200,
      html: `
      <div style="position:absolute;left:0;top:0;width:420px;height:200px;border-radius:30px;background:${cyl(p.body)};overflow:hidden">
        <div style="position:absolute;left:0;right:0;top:0;height:34px;background:rgba(255,255,255,.18)"></div>
        ${label(p, { w: 320, top: 40, h: 130, color: "#ffffff", size: 44 })}
      </div>`,
    }
  },
  tube(p) {
    const b = p.body
    return {
      w: 220,
      h: 600,
      html: `
      <div style="position:absolute;left:0;top:0;width:220px;height:470px;clip-path:polygon(0 0,100% 0,88% 100%,12% 100%);background:${cyl(b)};overflow:hidden">
        <div style="position:absolute;left:0;right:0;top:0;height:24px;background:repeating-linear-gradient(90deg,${shade(b, -0.12)} 0 6px,${shade(b, 0.08)} 6px 12px)"></div>
        ${gloss}
        ${label(p, { w: 170, top: 120, h: 210, size: 28 })}
      </div>
      <div style="position:absolute;left:44px;top:466px;width:132px;height:134px;border-radius:10px 10px 16px 16px;background:${cyl(p.accent)}"></div>`,
    }
  },
  lipstick(p) {
    return {
      w: 140,
      h: 520,
      html: `
      <div style="position:absolute;left:30px;top:0;width:80px;height:150px;clip-path:polygon(0 32%,100% 0,100% 100%,0 100%);background:${cyl(p.accent)}"></div>
      <div style="position:absolute;left:22px;top:140px;width:96px;height:110px;background:${metal("#d4af37")}"></div>
      <div style="position:absolute;left:0;top:246px;width:140px;height:274px;border-radius:6px 6px 14px 14px;background:${cyl(p.body)}">${gloss}</div>`,
    }
  },
  mascara(p) {
    return {
      w: 120,
      h: 640,
      html: `
      <div style="position:absolute;left:12px;top:0;width:96px;height:300px;border-radius:48px 48px 8px 8px;background:${cyl(p.accent)}">${gloss}</div>
      <div style="position:absolute;left:0;top:296px;width:120px;height:344px;border-radius:8px 8px 40px 40px;background:${cyl(p.body)};overflow:hidden">${gloss}
        <div style="position:absolute;left:50%;top:60px;transform:translateX(-50%) rotate(-90deg);transform-origin:center;white-space:nowrap;font:700 30px Tajawal;letter-spacing:4px;color:${ink(p.body)}">${p.label}</div>
      </div>`,
    }
  },
  wand(p) {
    return {
      w: 120,
      h: 600,
      html: `
      <div style="position:absolute;left:14px;top:0;width:92px;height:250px;border-radius:12px 12px 6px 6px;background:${cyl(p.accent)}">${gloss}</div>
      <div style="position:absolute;left:0;top:246px;width:120px;height:354px;border-radius:6px 6px 18px 18px;background:${cyl(p.body)};overflow:hidden">${gloss}
        <div style="position:absolute;left:0;right:0;top:40px;text-align:center;font:700 22px Tajawal;letter-spacing:2px;color:${ink(p.body)};writing-mode:vertical-rl;margin:auto;height:260px">${p.label}</div>
      </div>`,
    }
  },
  pencil(p) {
    return {
      w: 70,
      h: 640,
      html: `
      <div style="position:absolute;left:15px;top:0;width:40px;height:70px;clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(180deg,#111 0 40%,#e4c9a6 40%)"></div>
      <div style="position:absolute;left:0;top:66px;width:70px;height:500px;border-radius:4px;background:${cyl(p.body)}">${gloss}
        <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font:700 20px Tajawal;letter-spacing:3px;color:${p.accent};writing-mode:vertical-rl;height:260px;margin:auto">${p.label}</div>
      </div>
      <div style="position:absolute;left:0;top:560px;width:70px;height:80px;border-radius:4px 4px 10px 10px;background:${metal(p.accent)}"></div>`,
    }
  },
  palette(p) {
    const pans = (p.pans || []).slice(0, 9)
    return {
      w: 460,
      h: 340,
      html: `
      <div style="position:absolute;left:0;top:0;width:460px;height:340px;border-radius:26px;background:${cyl(p.body)};box-shadow:inset 0 0 0 6px ${shade(p.body, 0.15)}">
        <div style="position:absolute;left:34px;top:30px;right:34px;bottom:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          ${pans.map((c) => `<div style="border-radius:12px;background:radial-gradient(circle at 35% 30%,${shade(c, 0.35)},${c} 55%,${shade(c, -0.25)});box-shadow:inset 0 2px 6px rgba(0,0,0,.35)"></div>`).join("")}
        </div>
      </div>`,
    }
  },
  compact(p) {
    const fill = p.shades ? Object.values(p.shades)[1] || Object.values(p.shades)[0] : p.accent
    return {
      w: 360,
      h: 360,
      html: `
      <div style="position:absolute;left:0;top:0;width:360px;height:360px;border-radius:50%;background:${metal(p.body === "#1d1d1f" ? "#2a2a2a" : p.body)}"></div>
      <div style="position:absolute;left:34px;top:34px;width:292px;height:292px;border-radius:50%;background:radial-gradient(circle at 38% 32%,${shade(fill, 0.4)},${fill} 50%,${shade(fill, -0.2)});box-shadow:inset 0 4px 14px rgba(0,0,0,.3)">
        <div style="position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.08) 0 3px,rgba(0,0,0,.04) 3px 7px)"></div>
      </div>`,
    }
  },
  spray(p) {
    return {
      w: 190,
      h: 640,
      html: `
      <div style="position:absolute;left:18px;top:0;width:154px;height:150px;border-radius:70px 70px 8px 8px;background:${cyl(p.accent === "#ffffff" ? "#f2f2f2" : p.accent)}">${gloss}</div>
      <div style="position:absolute;left:0;top:146px;width:190px;height:494px;border-radius:16px 16px 22px 22px;background:${cyl(p.body)};overflow:hidden">${gloss}
        ${label(p, { w: 150, top: 150, h: 170, color: ink(p.body), size: 30 })}
      </div>`,
    }
  },
  perfume(p) {
    const c = p.body
    return {
      w: 340,
      h: 520,
      html: `
      <div style="position:absolute;left:110px;top:0;width:120px;height:130px;border-radius:10px;background:${metal(p.accent)}"></div>
      <div style="position:absolute;left:140px;top:124px;width:60px;height:40px;background:${metal(p.accent)}"></div>
      <div style="position:absolute;left:0;top:160px;width:340px;height:360px;border-radius:30px;background:linear-gradient(135deg,${shade(c, 0.55)}ee,${c}dd 45%,${shade(c, -0.35)}ee);box-shadow:inset 0 0 0 10px rgba(255,255,255,.35),inset 0 0 40px rgba(255,255,255,.4);overflow:hidden">
        <div style="position:absolute;left:28px;top:20px;width:40px;height:300px;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,0))"></div>
        ${label(p, { w: 230, top: 110, h: 140, color: luminance(c) > 0.55 ? shade(c, -0.6) : "#ffffff", size: 34 })}
      </div>`,
    }
  },
  nail(p) {
    const c = p.shades ? Object.values(p.shades)[0] : p.body
    return {
      w: 200,
      h: 440,
      html: `
      <div style="position:absolute;left:60px;top:0;width:80px;height:220px;border-radius:12px 12px 4px 4px;background:${cyl(p.accent)}">${gloss}</div>
      <div style="position:absolute;left:0;top:210px;width:200px;height:230px;border-radius:36px;background:linear-gradient(135deg,${shade(c, 0.45)},${c} 45%,${shade(c, -0.35)});box-shadow:inset 0 0 0 8px rgba(255,255,255,.3);overflow:hidden">
        <div style="position:absolute;left:22px;top:18px;width:26px;height:180px;border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,0))"></div>
      </div>`,
    }
  },
  balm(p) {
    return {
      w: 110,
      h: 430,
      html: `
      <div style="position:absolute;left:0;top:0;width:110px;height:170px;border-radius:40px 40px 6px 6px;background:${cyl(p.accent)}">${gloss}</div>
      <div style="position:absolute;left:0;top:166px;width:110px;height:264px;border-radius:6px 6px 16px 16px;background:${cyl(p.body)};overflow:hidden">${gloss}
        <div style="position:absolute;left:0;right:0;top:40px;text-align:center;font:700 22px Tajawal;letter-spacing:2px;color:${ink(p.body)};writing-mode:vertical-rl;height:190px;margin:auto">${p.label}</div>
      </div>`,
    }
  },
}

/* ------------------------------- scenes -------------------------------- */
const fontFace = `@font-face{font-family:Tajawal;font-weight:400;src:url(file://${FONT}/400Regular/Tajawal_400Regular.ttf)}
@font-face{font-family:Tajawal;font-weight:500;src:url(file://${FONT}/500Medium/Tajawal_500Medium.ttf)}
@font-face{font-family:Tajawal;font-weight:700;src:url(file://${FONT}/700Bold/Tajawal_700Bold.ttf)}
@font-face{font-family:Tajawal;font-weight:800;src:url(file://${FONT}/800ExtraBold/Tajawal_800ExtraBold.ttf)}`

/** A product placed on the floor at (cx, floorY), scaled. */
function placed(p, cx, floorY, scale = 1) {
  const s = SHAPES[p.type](p)
  return `<div style="position:absolute;left:${cx - (s.w * scale) / 2}px;top:${floorY - s.h * scale}px;width:${s.w}px;height:${s.h}px;transform:scale(${scale});transform-origin:0 0">
    <div style="position:absolute;left:${-s.w * 0.15}px;right:${-s.w * 0.15}px;bottom:-26px;height:52px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.28),rgba(0,0,0,0) 70%)"></div>
    ${s.html}
  </div>`
}

function page(w, h, body, bg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontFace}*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;position:relative;${bg ? `background:${bg};` : ""}font-family:Tajawal}</style></head><body>${body}</body></html>`
}

function heroScene(p) {
  const bg = `radial-gradient(ellipse at 50% 42%, ${shade(p.bg, 0.55)} 0%, ${p.bg} 55%, ${shade(p.bg, -0.06)} 100%)`
  const s = SHAPES[p.type](p)
  const scale = Math.min(760 / s.h, 640 / s.w, 1.6)
  const deco = `<div style="position:absolute;left:150px;top:200px;width:600px;height:600px;border-radius:50%;background:${shade(p.bg, 0.35)};opacity:.7"></div>
    <div style="position:absolute;left:0;right:0;top:900px;bottom:0;background:linear-gradient(180deg,${shade(p.bg, -0.04)},${shade(p.bg, -0.1)})"></div>`
  return page(900, 1200, deco + placed(p, 450, 960, scale), bg)
}

function detailScene(p) {
  const bg = `linear-gradient(160deg, ${shade(p.bg, 0.3)}, ${shade(p.bg, -0.08)})`
  const s = SHAPES[p.type](p)
  const scale = Math.min(520 / s.h, 380 / s.w, 1)
  let feature
  if (p.shades) {
    const entries = Object.entries(p.shades)
    feature = `<div style="position:absolute;left:70px;top:250px;width:360px;display:flex;flex-direction:column;gap:34px">
      ${entries.map(([n, c]) => `<div style="display:flex;align-items:center;gap:26px;direction:ltr">
        <div style="width:110px;height:110px;border-radius:50%;background:radial-gradient(circle at 35% 30%,${shade(c, 0.35)},${c} 55%,${shade(c, -0.25)});box-shadow:0 10px 24px rgba(0,0,0,.18)"></div>
        <div style="font:700 34px Tajawal;color:#2a2a2a">${n}</div></div>`).join("")}
    </div>`
  } else if (p.type === "palette") {
    feature = `<div style="position:absolute;left:50px;top:320px;width:340px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
      ${(p.pans || []).slice(0, 9).map((c) => `<div style="height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,${shade(c, 0.35)},${c} 55%,${shade(c, -0.25)});box-shadow:0 8px 18px rgba(0,0,0,.2)"></div>`).join("")}
    </div>`
  } else {
    const t = p.texture || p.body
    feature = `<div style="position:absolute;left:40px;top:330px;width:440px;height:380px;border-radius:58% 42% 55% 45% / 50% 60% 40% 50%;background:radial-gradient(circle at 38% 34%, ${shade(t, 0.6)} 0%, ${t} 45%, ${shade(t, -0.18)} 100%);box-shadow:0 30px 60px rgba(0,0,0,.12)">
      <div style="position:absolute;left:90px;top:70px;width:140px;height:60px;border-radius:50%;background:rgba(255,255,255,.55);filter:blur(6px)"></div>
      <div style="position:absolute;left:240px;top:200px;width:90px;height:34px;border-radius:50%;background:rgba(255,255,255,.4);filter:blur(5px)"></div>
    </div>`
  }
  const caption = `<div style="position:absolute;left:0;right:0;bottom:120px;text-align:center;font:800 46px Tajawal;letter-spacing:6px;color:${shade(p.bg, -0.55)}">${p.label}</div>
    <div style="position:absolute;left:0;right:0;bottom:80px;text-align:center;font:500 28px Tajawal;letter-spacing:2px;color:${shade(p.bg, -0.45)}">${p.sub}</div>`
  return page(900, 1200, feature + placed(p, 650, 860, scale) + caption, bg)
}

/** product drawn alone on a transparent background (for banners) */
function cutoutScene(p) {
  const s = SHAPES[p.type](p)
  return page(s.w + 120, s.h + 80, placed(p, (s.w + 120) / 2, s.h + 30, 1))
}

function bannerScene(b, cutouts) {
  const imgs = b.products
    .map((h, i) => {
      const c = cutouts[h]
      const height = [380, 250, 230][i]
      const x = [150, 360, 20][i]
      return `<img src="file://${c}" style="position:absolute;left:${x}px;bottom:${[40, 50, 60][i]}px;height:${height}px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.25));z-index:${3 - i}">`
    })
    .join("")
  const body = `
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,${b.bg[0]},${b.bg[1]})"></div>
    <div style="position:absolute;left:-120px;top:-160px;width:620px;height:620px;border-radius:50%;background:rgba(255,255,255,.14)"></div>
    <div style="position:absolute;left:300px;top:330px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.1)"></div>
    ${imgs}
    <div style="position:absolute;right:60px;top:0;bottom:0;width:500px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:22px;direction:rtl;text-align:right">
      <div style="font:800 78px/1.15 Tajawal;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.15)">${b.title}</div>
      <div style="font:500 34px/1.4 Tajawal;color:rgba(255,255,255,.92)">${b.subtitle}</div>
      <div style="margin-top:14px;background:#fff;color:${b.bg[0]};font:800 32px Tajawal;padding:18px 44px;border-radius:40px">${b.cta}</div>
    </div>`
  return page(1200, 600, body)
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "demo-img-"))
  const browser = await chromium.launch()
  const pageFor = async (w, h) => browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const shoot = async (html, w, h, file, opts = {}) => {
    const pg = await pageFor(w, h)
    const src = path.join(tmp, "scene.html")
    fs.writeFileSync(src, html)
    await pg.goto("file://" + src)
    await pg.evaluate(() => document.fonts.ready)
    await pg.screenshot({ path: file, type: opts.png ? "png" : "jpeg", quality: opts.png ? undefined : 84, omitBackground: !!opts.png })
    await pg.close()
  }

  const all = [...catalog.existing, ...catalog.new]
  const cutouts = {}
  for (const p of all) {
    if (!SHAPES[p.type]) throw new Error(`No shape "${p.type}" for ${p.handle}`)
    await shoot(heroScene(p), 900, 1200, path.join(OUT, `${p.handle}-1.jpg`))
    await shoot(detailScene(p), 900, 1200, path.join(OUT, `${p.handle}-2.jpg`))
    const s = SHAPES[p.type](p)
    cutouts[p.handle] = path.join(tmp, `${p.handle}.png`)
    await shoot(cutoutScene(p), s.w + 120, s.h + 80, cutouts[p.handle], { png: true })
  }
  for (const b of catalog.banners) await shoot(bannerScene(b, cutouts), 1200, 600, path.join(OUT, b.file))
  await browser.close()
  console.log(`Rendered ${all.length * 2} product photos and ${catalog.banners.length} banners into ${path.relative(ROOT, OUT)}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
