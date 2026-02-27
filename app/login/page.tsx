import { Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center rounded-xl bg-primary p-3">
            <Youtube className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">油管英语语料库</h1>
          <p className="text-sm text-muted-foreground">登录你的账号，继续学习之旅</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">登录</CardTitle>
            <CardDescription>请输入你的账号和密码</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  忘记密码？
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button className="w-full" size="lg">
              登录
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              还没有账号？{" "}
              <a href="#" className="text-primary hover:underline">
                立即注册
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
