"use client"

import { useMemo, useState } from "react"
import { Filter, ChevronDown, X, Check } from "lucide-react"
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
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"

// ─── 筛选配置 ───────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = ["1", "2", "3", "4", "5"]
const DURATION_OPTIONS = ["1分钟内", "2分钟内", "5分钟内", "10分钟内", "10分钟以上"]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "learned", label: "已学习" },
  { value: "unlearned", label: "未学习" },
]

// ─── 桌面端子组件：多选下拉 ─────────────────────────────────────────────────

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const isAllSelected = selected.length === options.length

  const displayText =
    selected.length === 0
      ? `选择${label}`
      : isAllSelected
      ? "已全选"
      : `已选 ${selected.length} 项`

  return (
    <div className="relative group flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between font-normal h-9 pr-8">
            <span className="truncate">{displayText}</span>
            <ChevronDown className="absolute right-3 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`搜索${label}...`} />
            <CommandList>
              <CommandEmpty>未找到结果</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => onChange(isAllSelected ? [] : [...options])}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isAllSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {isAllSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span>全选</span>
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => {
                      const isSelected = selected.includes(option)
                      onChange(isSelected ? selected.filter(v => v !== option) : [...selected, option])
                    }}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {selected.includes(option) && <Check className="h-3 w-3" />}
                    </div>
                    <span>
                      {label === "视频难度" ? "⭐".repeat(Number(option)) : option}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange([])
          }}
        >
          <X className="size-3" />
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function FilterBar({
  videos,
  statusFilter,
  advancedFilters,
  onStatusChange,
  onAdvancedChange,
}: any) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedMobileFilters, setExpandedMobileFilters] = useState<Record<string, boolean>>({})

  const creatorOptions = useMemo(() => Array.from(new Set(videos.map((v: any) => v.creator))).sort(), [videos])
  const topicOptions = useMemo(() => Array.from(new Set(videos.flatMap((v: any) => v.topics || []))).sort(), [videos])

  const filterConfigs = useMemo(() => [
    { key: "difficulty" as const, label: "视频难度", options: DIFFICULTY_OPTIONS },
    { key: "duration" as const, label: "视频时长", options: DURATION_OPTIONS },
    { key: "creator" as const, label: "视频博主", options: creatorOptions },
    { key: "topic" as const, label: "视频分类", options: topicOptions },
  ], [creatorOptions, topicOptions])

  const handleReset = () => {
    onStatusChange("all")
    onAdvancedChange({ difficulty: [], duration: [], creator: [], topic: [] })
    setIsSheetOpen(false)
  }

  const toggleMobileFilter = (key: string) => {
    setExpandedMobileFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const hasAnyFilter = useMemo(() => {
    return Object.values(advancedFilters).some((arr: any) => arr.length > 0)
  }, [advancedFilters])

  return (
    <>
      {/* ── 桌面端 (保持完美状态) ── */}
      <Card className="hidden md:block border-border shadow-sm mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-bold">筛选条件</CardTitle>
              {hasAnyFilter && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-[10px] text-muted-foreground hover:text-destructive">
                  <X className="mr-1 size-3" /> 重置全部
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  variant={statusFilter === s.value ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-7 px-3 text-xs", statusFilter === s.value && "bg-white shadow-sm")}
                  onClick={() => onStatusChange(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-4 gap-4">
          {filterConfigs.map(({ key, label, options }) => (
            <div key={key} className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
              <MultiSelect
                label={label}
                options={options as any}
                selected={advancedFilters[key]}
                onChange={(selected) => onAdvancedChange({ ...advancedFilters, [key]: selected })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 移动端 (完美复刻截图样式) ── */}
      <div className="flex items-center justify-between md:hidden mb-4">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(s.value)}
              className={cn(
                "rounded-md px-4 text-sm font-medium",
                statusFilter === s.value ? "bg-blue-600 text-white hover:bg-blue-700" : "text-muted-foreground bg-card"
              )}
            >
              {s.label}
            </Button>
          ))}
        </div>
        
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 relative bg-card">
              <Filter className="size-4" />
              {hasAnyFilter && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0 pb-0 flex flex-col">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle className="text-left text-base font-bold">筛选条件</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {filterConfigs.map(({ key, label, options }) => (
                <div key={key} className="border border-border rounded-lg overflow-hidden bg-card">
                  <button
                    className="flex w-full items-center justify-between p-3 text-sm font-medium transition-colors hover:bg-accent/50"
                    onClick={() => toggleMobileFilter(key)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{label}</span>
                      {advancedFilters[key].length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                          {advancedFilters[key].length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expandedMobileFilters[key] && "rotate-180")}
                    />
                  </button>
                  
                  {expandedMobileFilters[key] && (
                    <div className="border-t bg-muted/30 p-2">
                      <Command className="bg-transparent">
                        <CommandInput placeholder={`搜索${label}...`} className="h-9" />
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty>未找到结果</CommandEmpty>
                          <CommandGroup>
                            <div
                              className="mb-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-accent"
                              onClick={() => onAdvancedChange({
                                ...advancedFilters,
                                [key]: advancedFilters[key].length === options.length ? [] : [...options]
                              })}
                            >
                              <Checkbox checked={advancedFilters[key].length === options.length} className="pointer-events-none h-4 w-4" />
                              <span className="text-sm font-medium">全选</span>
                            </div>
                            {options.map((opt: any) => {
                              const isSelected = advancedFilters[key].includes(opt)
                              return (
                                <CommandItem
                                  key={opt}
                                  onSelect={() => {
                                    const cur = advancedFilters[key]
                                    onAdvancedChange({
                                      ...advancedFilters,
                                      [key]: isSelected ? cur.filter((v: any) => v !== opt) : [...cur, opt]
                                    })
                                  }}
                                  className="flex cursor-pointer items-center gap-2 py-2"
                                >
                                  <Checkbox checked={isSelected} className="pointer-events-none h-4 w-4" />
                                  <span>{label === "视频难度" ? "⭐".repeat(Number(opt)) : opt}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <SheetFooter className="p-4 border-t bg-background flex flex-row gap-3 sm:justify-between pb-8">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                重置
              </Button>
              <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsSheetOpen(false)}>
                确定
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}