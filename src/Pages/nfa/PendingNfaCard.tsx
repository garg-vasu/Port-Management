import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StatusBadge, getStatusBorderClass } from "@/components/ui/StatusBadge";
import { CheckCircle2 } from "lucide-react";

export type PendingNfa = {
  current_stage_id: number;
  current_stage_name: string;
  description: string;
  files: string[];
  id: number;
  name: string;
  nfa_code: string;
  status: string;
  stage_user?: StageUser;
};

export type StageUser = {
  address: string;
  email: string;
  employee_id: string;
  id: number;
  name: string;
  phone_no: string;
};

export function PendingNfaCard({ nfa }: { nfa: PendingNfa }) {
  return (
    <Card
      className={cn(
        "h-full min-w-0 flex flex-col gap-3 border-l-4 text-[11px] sm:text-xs overflow-hidden",
        getStatusBorderClass(nfa.status),
      )}
    >
      <CardHeader className="px-3 py-2 pb-2 relative">
        {nfa.status === "Pending" && (
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Link to={`/working-nfa/${nfa.id}/${nfa.current_stage_id}`}>
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <div className="flex min-w-0 items-start justify-between gap-2 pr-8">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base font-semibold">
              {nfa.name}
            </CardTitle>
            {nfa.description && (
              <CardDescription className="line-clamp-2 text-xs">
                {nfa.description}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={nfa.status} />
        </div>
        {nfa.current_stage_name && (
          <p className="text-[11px] font-medium text-muted-foreground mt-1">
            Stage:{" "}
            <span className="text-foreground">{nfa.current_stage_name}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-2 space-y-2 text-xs">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Pending on
            </p>
            <p className="font-medium truncate">
              {nfa.stage_user?.name ?? "NFA Completed"}
            </p>
            <p className="flex min-w-0 flex-col gap-0.5 overflow-hidden text-[11px] text-muted-foreground">
              <span className="truncate">
                {nfa.stage_user?.email ?? "NFA Completed"}
              </span>
              <span className="truncate">
                {nfa.stage_user?.phone_no ?? "NFA Completed"}
              </span>
            </p>
          </div>
        </div>

        {nfa.files && nfa.files.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Files
            </p>
            <p className="text-[11px] text-muted-foreground">
              {nfa.files.length} file(s) attached
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
