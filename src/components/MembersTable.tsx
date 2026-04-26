import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type MemberRow } from "@/lib/patreon";
import { MemberFilters } from "./MemberFilters";

function SortHeader({ column, label }: { column: any; label: string }) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </button>
  );
}

interface Props {
  data: MemberRow[];
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (val: string) => void;
  onYearChange: (val: string) => void;
  emptyLabel: string;
  onMemberSelect: (member: MemberRow) => void;
  onTogglePacked: (memberId: string) => void;
}

export function MembersTable({
  data,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  emptyLabel,
  onMemberSelect,
  onTogglePacked,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tierTitles = useMemo(
    () =>
      Array.from(
        new Set(data.map((m) => m.tier_title).filter((t) => t !== "—")),
      ).sort(),
    [data],
  );

  const rowBg = (status: MemberRow["address_status"]) => {
    if (status === "check_needed")
      return "bg-yellow-500/10 hover:bg-yellow-500/20 cursor-pointer";
    if (status === "missing") return "bg-red-500/10 hover:bg-red-500/20 cursor-pointer";
    return "cursor-pointer";
  };

  const columns = useMemo<ColumnDef<MemberRow>[]>(
    () => [
      {
        accessorKey: "packed",
        header: ({ column }) => <SortHeader column={column} label="Packed" />,
        cell: ({ row }) => (
          <input
              type="checkbox"
              checked={row.original.packed}
              onChange={(e) => {
                  e.stopPropagation(); // prevent row click opening the sheet
                  onTogglePacked(row.original.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer"
          />
      ),
      },
      {
        accessorKey: "full_name",
        header: ({ column }) => <SortHeader column={column} label="Name" />,
      },
      {
        accessorKey: "addressee",
        header: ({ column }) => (
          <SortHeader column={column} label="Addressee" />
        ),
      },
      {
        accessorKey: "tier_title",
        header: ({ column }) => <SortHeader column={column} label="Tier" />,
      },
      {
        accessorKey: "line_1",
        header: ({ column }) => <SortHeader column={column} label="Address Line 1" />,
      },
      {
        accessorKey: "line_2",
        header: ({ column }) => <SortHeader column={column} label="Address Line 2" />,
      },
      {
        accessorKey: "city",
        header: ({ column }) => <SortHeader column={column} label="City" />,
      },
      {
        accessorKey: "state",
        header: ({ column }) => <SortHeader column={column} label="State" />,
      },
      {
        accessorKey: "zip",
        header: ({ column }) => <SortHeader column={column} label="Zip" />,
      },
      {
        accessorKey: "country",
        header: ({ column }) => <SortHeader column={column} label="Country" />,
      },
    ],
    [onTogglePacked],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <MemberFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        tierTitles={tierTitles}
        table={table}
      />
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={rowBg(row.original.address_status)}
                  onClick={() => onMemberSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-8"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}