"use client"

interface ResetDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ResetDialog({ open, onConfirm, onCancel }: ResetDialogProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#000000]/30" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-2xl w-[90vw] max-w-sm p-6 text-center">
        <p className="text-xs text-muted-foreground mb-2">speakvlog.com 显示</p>
        <p className="text-sm text-foreground mb-6 leading-relaxed">
          确定要重置这个视频的学习进度吗？这将清除完成状态和观看记录。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg bg-[#3b82f6] text-[#ffffff] text-sm font-medium hover:bg-[#2563eb] transition-colors"
          >
            确定
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </>
  )
}
