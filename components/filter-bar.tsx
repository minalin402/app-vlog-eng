"use client"
import { useState } from "react"
import { Filter, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  placeholder: string
  options: FilterOption[]
}

interface FilterConfigs {
  [key: string]: FilterConfig
}

type FilterType = "all" | "completed" | "pending"

const statusFilters = [
  { value: "all", label: "全部" },
  { value: "completed", label: "已学习" },
  { value: "pending", label: "未学习" },
]

const advancedFilters: FilterConfigs = {
  difficulty: {
    label: "视频难度",
    placeholder: "选择难度",
    options: [
      { value: "beginner", label: "入门" },
      { value: "elementary", label: "初级" },
      { value: "intermediate", label: "中级" },
      { value: "advanced", label: "高级" },
    ],
  },
  duration: {
    label: "视频时长",
    placeholder: "选择时长",
    options: [
      { value: "1min", label: "1分钟" },
      { value: "2min", label: "2分钟" },
      { value: "5min", label: "5分钟" },
      { value: "10min", label: "10分钟以上" },
    ],
  },
  creator: {
    label: "视频博主",
    placeholder: "选择博主",
    options: [
      { value: "ailing", label: "谷爱凌" },
      { value: "traveler", label: "旅行博主" },
      { value: "teacher", label: "英语老师" },
    ],
  },
  topic: {
    label: "视频分类",
    placeholder: "选择分类",
    options: [
      { value: "sports", label: "体育" },
      { value: "travel", label: "旅行" },
      { value: "daily", label: "日常生活" },
      { value: "tech", label: "科技" },
      { value: "culture", label: "文化" },
    ],
  },
}

interface AdvancedFilter {
  [key: string]: string[]
}

interface FilterBarProps {
  filter?: FilterType
  onFilterChange?: (type: FilterType) => void
}

export function FilterBar({ filter = "all", onFilterChange }: FilterBarProps) {
  const [mobileFilter, setMobileFilter] = useState<FilterType>("all")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<AdvancedFilter>({})
  
  // 新增：专门用来控制手机端哪些筛选项被展开了
  const [expandedMobileFilters, setExpandedMobileFilters] = useState<Record<string, boolean>>({})

  const handleFilterChange = (type: FilterType) => {
    onFilterChange?.(type)
    setMobileFilter(type)
  }

  const handleSelectFilter = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || []
      if (current.includes(value)) {
        return {
          ...prev,
          [filterType]: current.filter(v => v !== value)
        }
      } else {
        return {
          ...prev,
          [filterType]: [...current, value]
        }
      }
    })
  }

  const handleSelectAll = (filterType: string) => {
    setSelectedFilters(prev => {
      const allValues = advancedFilters[filterType].options.map(o => o.value)
      const current = prev[filterType] || []
      
      if (current.length === allValues.length) {
        const newFilters = { ...prev }
        delete newFilters[filterType]
        return newFilters
      }
      
      return { ...prev, [filterType]: allValues }
    })
  }

  const handleReset = () => {
    setSelectedFilters({})
    handleFilterChange("all")
    setIsOpen(false)
  }

  const handleApply = () => {
    setIsOpen(false)
  }

  const isSelected = (filterType: string, value: string) => {
    return (selectedFilters[filterType] || []).includes(value)
  }

  const isAllSelected = (filterType: string) => {
    const allValues = advancedFilters[filterType].options.map(o => o.value)
    const current = selectedFilters[filterType] || []
    return current.length === allValues.length
  }

  const getSelectedText = (filterType: string) => {
    const selected = selectedFilters[filterType] || []
    if (selected.length === 0) return advancedFilters[filterType].placeholder
    if (selected.length === advancedFilters[filterType].options.length) return "已全选"
    return `已选 ${selected.length} 项`
  }

  // 新增：切换手机端折叠状态的函数
  const toggleMobileFilter = (key: string) => {
    setExpandedMobileFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <>
      {/* Desktop view (保持原样) */}
      <Card className="hidden border-border shadow-sm md:block">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              筛选条件
            </CardTitle>
            <div className="flex items-center gap-2">
              {statusFilters.map((status) => (
                <Button
                  key={status.value}
                  variant={filter === status.value ? "default" : "ghost"}
                  onClick={() => handleFilterChange(status.value as FilterType)}
                  size="sm"
                  className={filter === status.value ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : ""}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-6">
            {Object.entries(advancedFilters).map(([key, filter]) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {filter.label}
                  </label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {getSelectedText(key)}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={`搜索${filter.label}...`} />
                      <CommandEmpty>未找到结果</CommandEmpty>
                      <CommandGroup>
                        <div 
                          className="mb-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                          onClick={() => handleSelectAll(key)}
                        >
                          <Checkbox
                            checked={isAllSelected(key)}
                            className="h-4 w-4 pointer-events-none"
                          />
                          <span className="text-sm font-medium">全选</span>
                        </div>
                        {filter.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleSelectFilter(key, option.value)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={isSelected(key, option.value)}
                              className="h-4 w-4 pointer-events-none"
                            />
                            <span>{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view (重构成折叠手风琴效果) */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <Button
              key={status.value}
              variant={mobileFilter === status.value ? "default" : "outline"}
              onClick={() => handleFilterChange(status.value as FilterType)}
              size="sm"
            >
              {status.label}
            </Button>
          ))}
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%] rounded-t-xl px-4">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-sm font-semibold text-foreground">筛选条件</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 px-2 overflow-y-auto max-h-[calc(80vh-180px)]">
              {Object.entries(advancedFilters).map(([key, filter]) => (
                <div key={key} className="border-b border-border/50 pb-2 pt-2 last:border-0">
                  {/* 点击这个区域切换折叠状态 */}
                  <div 
                    className="flex items-center justify-between py-2 cursor-pointer hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
                    onClick={() => toggleMobileFilter(key)}
                  >
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground cursor-pointer pointer-events-none">
                        {filter.label}
                      </label>
                      {/* 如果有选中的项，在标题旁边显示一个蓝色小圆点提示数量 */}
                      {(selectedFilters[key]?.length || 0) > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-600">
                          {selectedFilters[key].length}
                        </span>
                      )}
                    </div>
                    {/* 箭头动画：展开时旋转 180 度 */}
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200", 
                      expandedMobileFilters[key] && "rotate-180"
                    )} />
                  </div>
                  
                  {/* 展开的具体内容 */}
                  {expandedMobileFilters[key] && (
                    <div className="mt-2 mb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                      <Command className="rounded-lg border shadow-sm">
                        <CommandInput placeholder={`搜索${filter.label}...`} />
                        <CommandEmpty>未找到结果</CommandEmpty>
                        <CommandGroup>
                          <div 
                            className="mb-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                            onClick={() => handleSelectAll(key)}
                          >
                            <Checkbox
                              checked={isAllSelected(key)}
                              className="h-4 w-4 pointer-events-none"
                            />
                            <span className="text-sm font-medium">全选</span>
                          </div>
                          {filter.options.map((option) => (
                            <CommandItem
                              key={option.value}
                              onSelect={() => handleSelectFilter(key, option.value)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected(key, option.value)}
                                className="h-4 w-4 pointer-events-none"
                              />
                              <span>{option.label}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <SheetFooter className="absolute bottom-0 left-0 right-0 flex gap-2 border-t bg-background p-4 pb-8">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                重置
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                确定
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}