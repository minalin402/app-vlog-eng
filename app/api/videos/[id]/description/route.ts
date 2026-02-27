import { NextResponse } from "next/server"
import { mockVideos } from "@/lib/mock-videos"

/**
 * GET /api/videos/[id]/description
 * 返回指定视频的简介字段
 * 占位实现：从 mock 数据中查找，后续替换为真实数据库查询
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const video = mockVideos.find((v) => v.id === id)

  if (!video) {
    return NextResponse.json({ error: "视频不存在" }, { status: 404 })
  }

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json({ description: video.description })
}
