// app/demo/demo-interceptor.tsx
'use client';

export default function DemoInterceptor({ children }: { children: React.ReactNode }) {
  const handleCapture = (e: React.MouseEvent) => {
    // 1. 抓取当前点击的 DOM 元素，看看是不是按钮
    const target = e.target as HTMLElement;
    const button = target.closest('button');

    if (button) {
      // 2. 根据按钮的文字内容（或 className）进行精准狙击
      const btnText = button.textContent || '';
      
      // ⚠️ 这里填入你原来按钮上的文字内容
      const isActionBtn = 
        btnText.includes('收藏') || 
        btnText.includes('已学') || 
        btnText.includes('重置');

      // (如果你的收藏按钮只有图标没有文字，你可以用 button.className.includes('你的类名') 来判断)

      if (isActionBtn) {
        // ✨ 核心魔法：物理斩断！事件到这里直接停止，根本传不到 VideoLearningClient 内部！
        e.stopPropagation(); 
        e.preventDefault();
        alert('💡 试听版暂不支持保存数据，请登录体验完整版！');
      }
    }
  };

  // onClickCapture 会在子组件的所有 onClick 触发【之前】执行
  return (
    <div onClickCapture={handleCapture} className="h-full w-full">
      {children}
    </div>
  );
}