import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Download,
  Plus,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import { generatePDFFromTable } from "@/utils/pdfGenerator";
// import type { FilterStateUser } from "./AdvanceUser";

// import AdvanceWorkOrderFilter from "../WorkOrder/AdvanceWorkOrder";
// import AdvanceUserFilter from "./AdvanceUser";

export type PendingNfa = {
  current_stage_id: number;
  current_stage_name: string;
  description: string;
  files: string[];
  id: number;
  name: string;
  nfa_code: string;
  status: string;
  stage_user: StageUser;
};

export type StageUser = {
  address: string;
  email: string;
  employee_id: string;
  id: number;
  name: string;
  phone_no: string;
};

export const columns: ColumnDef<PendingNfa>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // NFA CODE
  {
    id: "nfa_code",
    header: "Consignment Code",
    accessorFn: (pendingNfa) => pendingNfa.nfa_code ?? "",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/nfa-detail/${row.original.id}`)}
        >
          <div className="flex flex-col">
            <span className="capitalize">{row.original.nfa_code ?? "—"}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const { name } = row.original;
      const navigate = useNavigate();
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/nfa-detail/${row.original.id}`)}
        >
          <div className="flex flex-col">
            <span className="capitalize">{name}</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "current_stage_name",
    header: "Current Stage Name",
    accessorFn: (pendingNfa) => pendingNfa.current_stage_name ?? "",
    cell: ({ row }) => <div>{row.original.current_stage_name ?? "—"}</div>,
  },
  {
    id: "description",
    header: "Description",
    accessorFn: (pendingNfa) => pendingNfa.description ?? "",
    cell: ({ row }) => <div>{row.original.description}</div>,
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (pendingNfa) => pendingNfa.status ?? "",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  //   add button for approve
  {
    id: "approve",
    header: "Approve",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        // make it green
        <Button
          variant="default"
          className="bg-green-400 text-white hover:bg-green-500"
          size="sm"
          onClick={() =>
            navigate(
              `/working-nfa/${row.original.id}/${row.original.current_stage_id}`,
            )
          }
        >
          Approve
        </Button>
      );
    },
  },
  {
    id: "stage_user",
    header: "Stage User",
    accessorFn: (pendingNfa) => pendingNfa.stage_user ?? "",
    cell: ({ row }) => <div>{row.original.stage_user?.name ?? "—"}</div>,
  },
  {
    id: "stage_user_email",
    header: "Stage User Email",
    accessorFn: (pendingNfa) => pendingNfa.stage_user?.email ?? "",
    cell: ({ row }) => <div>{row.original.stage_user?.email ?? "—"}</div>,
  },
  {
    id: "stage_user_phone",
    header: "Stage User Phone",
    accessorFn: (pendingNfa) => pendingNfa.stage_user?.phone_no ?? "",
    cell: ({ row }) => <div>{row.original.stage_user?.phone_no ?? "—"}</div>,
  },

  // CREATED AT
  //   {
  //     accessorKey: "created_at",
  //     header: ({ column }) => (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Created At
  //         <ArrowUpDown className="ml-1 h-4 w-4" />
  //       </Button>
  //     ),
  //     cell: ({ row }) => {
  //       const raw = row.getValue("created_at") as string | undefined;
  //       return <div>{formatDisplayDate(raw)}</div>;
  //     },
  //   },
  //   {
  //     accessorKey: "updated_at",
  //     header: ({ column }) => (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Updated At
  //         <ArrowUpDown className="ml-1 h-4 w-4" />
  //       </Button>
  //     ),
  //     cell: ({ row }) => {
  //       const raw = row.getValue("updated_at") as string | undefined;
  //       return <div>{formatDisplayDate(raw)}</div>;
  //     },
  //   },

  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const payment = row.original;
  //     const navigate = useNavigate();

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem
  //             // show toast message
  //             onClick={() => toast.success("User viewed successfully")}
  //           >
  //             View User
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem
  //             onClick={() => toast.success("User edited successfully")}
  //           >
  //             Edit User
  //           </DropdownMenuItem>
  //           <DropdownMenuItem
  //             onClick={() => toast.success("User deleted successfully")}
  //           >
  //             Delete User
  //           </DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function PendingNfa() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [data, setData] = useState<PendingNfa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/nfa/pending", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch users");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "users data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();

    return () => {
      source.cancel();
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDownloadPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    generatePDFFromTable({
      selectedRows,
      title: "Pending Consignment Report",
      headers: ["Name", "NFA Code", "Current Stage Name", "Description"],
      dataMapper: (row): string[] => {
        const pendingNfa = row.original as PendingNfa;
        return [
          pendingNfa.name || "—",
          pendingNfa.nfa_code || "—",
          pendingNfa.current_stage_name || "—",
          pendingNfa.description || "—",
        ];
      },
      fileName: `pending-consignment-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} pending Consignment(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="w-full p-4">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by nfa code "
          value={
            (table.getColumn("nfa_code")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("nfa_code")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          {/* <Button
            variant={hasActiveFilters() ? "default" : "outline"}
            className="w-full sm:w-auto"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            Advance Filter
          </Button>
          {hasActiveFilters() && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )} */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/add/nfa")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Consignment
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Columns <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* {filterOpen && (
        <AdvanceUserFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )} */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center py-8"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading users...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-8"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="h-12">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center py-2"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
