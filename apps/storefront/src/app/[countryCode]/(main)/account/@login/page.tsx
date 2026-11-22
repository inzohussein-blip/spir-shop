import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "Sign in to your Spir Shop account.",
}

export default function Login() {
  return <LoginTemplate />
}
