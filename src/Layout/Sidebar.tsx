import {
  Home,
  Users,
  TextSelectionIcon,
  Settings,
  FileText,
  Calendar,
  Menu,
  X,
  ChevronDown,
  ChevronsUpDown,
  Warehouse,
  Building2,
  UserCircle,
  Receipt,
  ClipboardList,
  PieChart,
  CalendarCheck,
  Award,
  Building,
  LayoutTemplate,
  ScrollText,
  BarChart,
  FolderKanban,
  Shield,
  Bell,
  Calculator,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
// import { UserContext } from "@/Provider/UserProvider";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

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

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

export interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
}

// Navigation items organized by user role
const menuItemsByRole: Record<string, NavigationItem[]> = {
  superadmin: [
    { name: "All NFA", icon: ClipboardList, href: "/" },
    { name: "Add NFA", icon: ScrollText, href: "/add/nfa" },
    { name: "Stages", icon: FolderKanban, href: "/stages" },
    { name: "Stage Creation", icon: LayoutTemplate, href: "/add/stage" },
    {
      name: "Order Selection",
      icon: TextSelectionIcon,
      href: "/order-selection",
    },
    { name: "Users", icon: Users, href: "/users" },
    { name: "User Creation", icon: UserCircle, href: "/user-creation" },
  ],
};

// Helper function to get navigation items based on role
// const getNavigationItems = (role: string | undefined): NavigationItem[] => {
//   if (!role) return menuItemsByRole.other;

//   const normalizedRole = role.toLowerCase();

//   if (normalizedRole === "superadmin" || normalizedRole === "super_admin") {
//     return menuItemsByRole.superadmin;
//   }
//   if (normalizedRole === "admin") {
//     return menuItemsByRole.admin;
//   }

//   return menuItemsByRole.other;
// };

function NavigationItemComponent({
  item,
  isCollapsed,
  level = 0,
}: {
  item: NavigationItem;
  isCollapsed: boolean;
  level?: number;
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isActive = item.href ? location.pathname === item.href : false;
  const hasActiveChild =
    hasChildren && item.children
      ? item.children.some((child) => child.href === location.pathname)
      : false;

  // Auto-expand if child is active
  useEffect(() => {
    if (hasActiveChild && !isCollapsed) {
      setIsOpen(true);
    }
  }, [hasActiveChild, isCollapsed]);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          className={`group flex items-center w-full ${
            isCollapsed ? "justify-center" : "justify-between"
          } px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
            hasActiveChild
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          }`}
          style={{
            paddingLeft: isCollapsed
              ? undefined
              : `${0.75 + level * 0.5 - (hasActiveChild ? 0.125 : 0)}rem`,
          }}
          title={isCollapsed ? item.name : ""}
        >
          <div className="flex items-center space-x-3">
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                hasActiveChild
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
              }`}
            />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </div>
          {!isCollapsed && (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ease-out flex-shrink-0 ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
              style={{ willChange: "transform" }}
            />
          )}
        </button>

        {!isCollapsed && (
          <div
            className={`overflow-hidden transition-all duration-150 ease-out ${
              isOpen
                ? "max-h-[500px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-2"
            }`}
            style={{
              transitionProperty: "max-height, opacity, transform",
            }}
          >
            <div className="py-1 space-y-1 pl-2">
              {item.children?.map((child) => (
                <NavigationItemComponent
                  key={child.href || child.name}
                  item={child}
                  isCollapsed={isCollapsed}
                  level={level + 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href!}
      className={`group flex items-center ${
        isCollapsed ? "justify-center" : "justify-start"
      } space-x-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      }`}
      style={{
        paddingLeft: isCollapsed ? undefined : `${0.75 + level * 0.5}rem`,
      }}
      title={isCollapsed ? item.name : ""}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${
          isActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
        }`}
      />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  // const { user } = useContext(UserContext);
  const [projectData, setProjectData] = useState<ProjectView[]>([]);

  // Get navigation items based on user role
  // const navigationItems = getNavigationItems(user?.role_name);
  const navigationItems = menuItemsByRole.superadmin;

  // useEffect(() => {
  //   const source = axios.CancelToken.source();

  //   const fetchProjects = async () => {
  //     try {
  //       const response = await apiClient.get("/projects_overview", {
  //         cancelToken: source.token,
  //       });

  //       if (response.status === 200) {
  //         setProjectData(response.data.projects);
  //       } else {
  //         toast.error(response.data?.message || "Failed to fetch projects");
  //       }
  //     } catch (err: unknown) {
  //       if (!axios.isCancel(err)) {
  //         toast.error(getErrorMessage(err, "projects data"));
  //       }
  //     }
  //   };

  //   fetchProjects();

  //   return () => {
  //     source.cancel();
  //   };
  // }, []);

  // Handle project selection
  const handleProjectSelect = (project: ProjectView) => {
    navigate(`/project/${project.project_id}/dashboard`);
  };

  return (
    <div
      className={`flex flex-col h-full bg-sidebar text-sidebar-foreground transition-[width] duration-150 ease-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ willChange: "width" }}
    >
      {/* Header */}
      <div
        className={`flex items-center h-16 p-4 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center space-x-2 overflow-hidden transition-all duration-150 ease-out ${
            isCollapsed
              ? "opacity-0 w-0 scale-95"
              : "opacity-100 w-auto scale-100"
          }`}
          style={{ willChange: "opacity, width, transform" }}
        >
          <div className="w-8 h-8 bg-primary flex items-center justify-center rounded">
            <span className="text-primary-foreground font-bold text-sm">
              LM
            </span>
          </div>
          <span className="font-semibold text-lg whitespace-nowrap">
            Logistics Manag.
          </span>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors flex-shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavigationItemComponent
            key={item.href || item.name}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>
    </div>
  );
}
