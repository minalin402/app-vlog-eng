import { NextResponse } from "next/server"

export async function POST() {
  // 占位实现：后续对接真实 session/cookie 清除逻辑
  // 例如：清除 HttpOnly cookie、使 JWT 失效、销毁 session 等
  return NextResponse.json({ success: true }, { status: 200 })
}
