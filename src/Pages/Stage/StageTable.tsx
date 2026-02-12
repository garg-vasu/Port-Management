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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import { formatDisplayDate } from "@/utils/formatdate";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
// import type { FilterStateUser } from "./AdvanceUser";

import PageHeader from "@/components/ui/PageHeader";
// import AdvanceWorkOrderFilter from "../WorkOrder/AdvanceWorkOrder";
// import AdvanceUserFilter from "./AdvanceUser";

export type StageQuestion = {
  label: string;
  comment: boolean;
  fileUpload: boolean;
  type: "file" | "text" | "number" | "date";
};

export type Stage = {
  id: number;
  name: string;
  description: string;
  user_id: number;
  question: StageQuestion[];
  order: number;
};

export const columns: ColumnDef<Stage>[] = [
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
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.original.name ?? "—"}</div>,
  },

  {
    id: "description",
    header: "Description",
    accessorFn: (stage) => stage.description ?? "",
    cell: ({ row }) => <div>{row.original.description ?? "—"}</div>,
  },
  {
    id: "order",
    header: "Order",
    accessorFn: (stage) => stage.order ?? "",
    cell: ({ row }) => <div>{row.original.order ?? "—"}</div>,
  },
  {
    id: "Assigned To",
    header: "Assigned To",
    accessorFn: (stage) => stage.user_id ?? "",
    cell: ({ row }) => <div>{row.original.user_id ?? "—"}</div>,
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

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;
      const navigate = useNavigate();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              // show toast message
              onClick={() => toast.success("Stage viewed successfully")}
            >
              View Stage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast.success("Stage edited successfully")}
            >
              Edit Stage
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => toast.success("User deleted successfully")}
            >
              Delete User
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
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

export function StageTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [data, setData] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const [limit, setLimit] = useState<number>(10);
  // const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  //   filter state
  //   const [filterState, setFilterState] = useState<FilterStateUser>({
  //     selectedProject: 0,
  //     email: "",
  //     first_name: "",
  //     last_name: "",
  //     address: "",
  //     city: "",
  //     state: "",
  //     country: "",
  //     zip_code: "",
  //     phone_no: "",
  //     selectedRole: 0,
  //   });

  //   const handleFilterChange = useCallback(
  //     (filters: FilterStateUser) => {
  //       // Only update if filters actually changed
  //       if (JSON.stringify(filters) !== JSON.stringify(filterState)) {
  //         setFilterState(filters);
  //         setCurrentPage(1); // Reset to first page when filters change
  //       }
  //     },
  //     [filterState],
  //   );

  //   const handleFilterClose = useCallback(() => {
  //     setFilterOpen(false);
  //   }, []);

  //   const clearAllFilters = useCallback(() => {
  //     setFilterState({
  //       selectedProject: 0,
  //       email: "",
  //       first_name: "",
  //       last_name: "",
  //       address: "",
  //       city: "",
  //       state: "",
  //       country: "",
  //       zip_code: "",
  //       phone_no: "",
  //       selectedRole: 0,
  //     });
  //     setCurrentPage(1);
  //   }, []);

  // Check if any filters are active
  //   const hasActiveFilters = () => {
  //     return (
  //       filterState.selectedProject > 0 ||
  //       filterState.email !== "" ||
  //       filterState.first_name !== "" ||
  //       filterState.last_name !== "" ||
  //       filterState.address !== "" ||
  //       filterState.city !== "" ||
  //       filterState.state !== "" ||
  //       filterState.country !== "" ||
  //       filterState.zip_code !== "" ||
  //       filterState.phone_no !== "" ||
  //       filterState.selectedRole > 0
  //     );
  //   };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchStages = async () => {
      setIsLoading(true);
      try {
        // const params: Record<string, number | string> = {
        //   page: currentPage,
        //   page_size: limit,
        // };
        // if (filterState.selectedProject > 0) {
        //   params.project_id = filterState.selectedProject;
        // }
        // if (filterState.email !== "") {
        //   params.email = filterState.email;
        // }
        // if (filterState.first_name !== "") {
        //   params.first_name = filterState.first_name;
        // }
        // if (filterState.last_name !== "") {
        //   params.last_name = filterState.last_name;
        // }
        // if (filterState.address !== "") {
        //   params.address = filterState.address;
        // }
        // if (filterState.city !== "") {
        //   params.city = filterState.city;
        // }
        // if (filterState.state !== "") {
        //   params.state = filterState.state;
        // }
        // if (filterState.country !== "") {
        //   params.country = filterState.country;
        // }
        // if (filterState.zip_code !== "") {
        //   params.zip_code = filterState.zip_code;
        // }
        // if (filterState.phone_no !== "") {
        //   params.phone_no = filterState.phone_no;
        // }
        // if (filterState.selectedRole > 0) {
        //   params.role_id = filterState.selectedRole;
        // }

        const response = await apiClient.get("/get_stage_order", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data ?? []);

          // if (pag) {
          //   setPagination({
          //     current_page: pag.current_page ?? pag.page ?? 1,
          //     per_page: pag.per_page ?? pag.limit ?? limit,
          //     total: pag.total ?? 0,
          //     total_pages: pag.total_pages ?? 0,
          //   });
          // } else {
          //   setPagination(null);
          // }
        } else {
          toast.error(response.data?.message || "Failed to fetch stages");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stages data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();

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
      title: "Stage Report",
      headers: ["Name", "Description", "Order", "Assigned To"],
      dataMapper: (row): string[] => {
        const stage = row.original as Stage;
        return [
          stage.name || "—",
          stage.description || "—",
          stage.order.toString() || "—",
          stage.user_id.toString() || "—",
        ];
      },
      fileName: `stage-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} stage(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="w-full p-4">
      {/* header section  */}
      <div className="flex items-center justify-between">
        <PageHeader title="Stages" />
      </div>
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by  name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
            onClick={() => navigate("/add/stage")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stage
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
                      Loading stages...
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
