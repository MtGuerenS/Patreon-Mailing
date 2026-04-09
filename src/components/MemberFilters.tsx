import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MONTHS, YEARS } from '@/lib/patreon'
import { type Table } from '@tanstack/react-table'
import { type MemberRow } from '@/lib/patreon'

interface Props {
  selectedMonth: string
  selectedYear: string
  onMonthChange: (val: string) => void
  onYearChange: (val: string) => void
  tierTitles: string[]
  table: Table<MemberRow>
}

export function MemberFilters({
  selectedMonth, selectedYear,
  onMonthChange, onYearChange,
  tierTitles, table,
}: Props) {
  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map(m => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map(y => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search by name..."
        value={(table.getColumn('full_name')?.getFilterValue() as string) ?? ''}
        onChange={e => table.getColumn('full_name')?.setFilterValue(e.target.value)}
        className="w-48"
      />

      <Select
        value={(table.getColumn('tier_title')?.getFilterValue() as string) ?? 'all'}
        onValueChange={val =>
          table.getColumn('tier_title')?.setFilterValue(val === 'all' ? '' : val)
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All tiers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tiers</SelectItem>
          {tierTitles.map(t => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} members found
      </p>
    </div>
  )
}