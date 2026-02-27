"use client"

import { useMemo } from "react"
import { Filter, ChevronDown } from "lucide-react"
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
import { useState } from "react"
import type { Video } from "@/lib/mock-videos"

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export type StatusFilter = "all" | "learned" | "unlearned"

export interface AdvancedFilters {
  difficulty: string[]
  duration: string[]
  creator: string[]
  topic: string[]
}

export interface FilterBarProps {
  /** 所有视频数据（用于动态提取博主 / 话题选项） */
  videos: Video[]
  /** 当前学习状态筛选 */
  statusFilter: StatusFilter
  /** 高级筛选状态 */
  advancedFilters: AdvancedFilters
  /** 学习状态变更回调 */
  onStatusChange: (status: StatusFilter) => void
  /** 高级筛选变更回调 */
  onAdvancedChange: (filters: AdvancedFilters) => void
}

// ─── 固定选项（硬编码） ───────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"]
const DURATION_OPTIONS = ["1分钟内", "2分钟内", "5分钟内", "10分钟以上"]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "learned", label: "已学习" },
  { value: "unlearned", label: "未学习" },
]

// ─── 子组件：多选下拉 ─────────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const isAllSelected = selected.length === options.length

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const toggleAll = () => {
    onChange(isAllSelected ? [] : [...options])
  }

  const displayText =
    selected.length === 0
      ? `选择${label}`
      : isAllSelected
      ? "已全选"
      : `已选 ${selected.length} 项`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {displayText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`搜索${label}...`} />
          <CommandEmpty>未找到结果</CommandEmpty>
          <CommandGroup>
            <div
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
              onClick={toggleAll}
            >
              <Checkbox
                checked={isAllSelected}
                className="pointer-events-none h-4 w-4"
              />
              <span className="text-sm font-medium">全选</span>
            </div>
            {options.map((opt) => (
              <CommandItem
                key={opt}
                onSelect={() => toggle(opt)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={selected.includes(opt)}
                  className="pointer-events-none h-4 w-4"
                />
                <span>{opt}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function FilterBar({
  videos,
  statusFilter,
  advancedFilters,
  onStatusChange,
  onAdvancedChange,
}: FilterBarProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedMobileFilters, setExpandedMobileFilters] = useState<
    Record<string, boolean>
  >({})

  // 动态提取博主 / 话题选项（去重）
  const creatorOptions = useMemo(
    () => Array.from(new Set(videos.map((v) => v.creator))).sort(),
    [videos]
  )
  const topicOptions = useMemo(
    () => Array.from(new Set(videos.map((v) => v.topic))).sort(),
    [videos]
  )

  // 筛选维度配置（固定 + 动态）
  const filterConfigs = useMemo(
    () => [
      { key: "difficulty" as const, label: "视频难度", options: DIFFICULTY_OPTIONS },
      { key: "duration" as const, label: "视频时长", options: DURATION_OPTIONS },
      { key: "creator" as const, label: "视频博主", options: creatorOptions },
      { key: "topic" as const, label: "视频分类", options: topicOptions },
    ],
    [creatorOptions, topicOptions]
  )

  const handleAdvancedChange = (
    key: keyof AdvancedFilters,
    selected: string[]
  ) => {
    onAdvancedChange({ ...advancedFilters, [key]: selected })
  }

  const handleReset = () => {
    onStatusChange("all")
    onAdvancedChange({ difficulty: [], duration: [], creator: [], topic: [] })
    setIsSheetOpen(false)
  }

  const toggleMobileFilter = (key: string) => {
    setExpandedMobileFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* ── 桌面端 ─────────────────────────────────────────────────────── */}
      <Card className="hidden border-border shadow-sm md:block">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              筛选条件
            </CardTitle>
            <div className="flex items-center gap-2">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  variant={statusFilter === s.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onStatusChange(s.value)}
                  className={
                    statusFilter === s.value
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : ""
                  }
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-6">
            {filterConfigs.map(({ key, label, options }) => (
              <div key={key} className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
                <MultiSelect
                  label={label}
                  options={options}
                  selected={advancedFilters[key]}
                  onChange={(selected) => handleAdvancedChange(key, selected)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 移动端 ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%] rounded-t-xl px-4">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-sm font-semibold text-foreground">
                筛选条件
              </SheetTitle>
            </SheetHeader>
            <div className="max-h-[calc(80vh-180px)] space-y-1 overflow-y-auto px-2">
              {filterConfigs.map(({ key, label, options }) => (
                <div
                  key={key}
                  className="border-b border-border/50 pb-2 pt-2 last:border-0"
                >
                  <div
                    className="-mx-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
                    onClick={() => toggleMobileFilter(key)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                      {advancedFilters[key].length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-600">
                          {advancedFilters[key].length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        expandedMobileFilters[key] && "rotate-180"
                      )}
                    />
                  </div>
                  {expandedMobileFilters[key] && (
                    <div className="animate-in slide-in-from-top-1 fade-in mb-4 mt-2 duration-200">
                      <Command className="rounded-lg border shadow-sm">
                        <CommandInput placeholder={`搜索${label}...`} />
                        <CommandEmpty>未找到结果</CommandEmpty>
                        <CommandGroup>
                          <div
                            className="mb-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                            onClick={() =>
                              handleAdvancedChange(
                                key,
                                advancedFilters[key].length === options.length
                                  ? []
                                  : [...options]
                              )
                            }
                          >
                            <Checkbox
                              checked={
                                advancedFilters[key].length === options.length
                              }
                              className="pointer-events-none h-4 w-4"
                            />
                            <span className="text-sm font-medium">全选</span>
                          </div>
                          {options.map((opt) => (
                            <CommandItem
                              key={opt}
                              onSelect={() => {
                                const cur = advancedFilters[key]
                                handleAdvancedChange(
                                  key,
                                  cur.includes(opt)
                                    ? cur.filter((v) => v !== opt)
                                    : [...cur, opt]
                                )
                              }}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Checkbox
                                checked={advancedFilters[key].includes(opt)}
                                className="pointer-events-none h-4 w-4"
                              />
                              <span>{opt}</span>
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
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                重置
              </Button>
              <Button className="flex-1" onClick={() => setIsSheetOpen(false)}>
                确定
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
