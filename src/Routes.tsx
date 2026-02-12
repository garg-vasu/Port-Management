import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";
import UserCreationTable from "./Pages/User/UserCreationtable";
import MainLayout from "./Layout/MainLayout";
import { UserTable } from "./Pages/User/UserTable";

import { AllNfa } from "./AllNfa";

import StageCreationTable from "./Pages/Stage/AddStage";
import Login from "./Pages/login";
import PrivateRoute from "./Pages/PrivateRoute";
import { UserProvider } from "./Provider/UserProvider";
import { StageTable } from "./Pages/Stage/StageTable";
import { OrderSelection } from "./Pages/Stage/OrderSelection";
import MixNfa from "./Pages/nfa/MixNfa";
import EditUser from "./Pages/User/EditUser";
import { AddNfa } from "./Pages/nfa/AddNfa";

import { ApprovalPending } from "./Pages/nfa/ApprovalPending";

import { NfaDetailPage } from "./Pages/nfa/nfaDetailPage";

const routes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <UserProvider>
          <MainLayout />
        </UserProvider>
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <MixNfa />,
      },
      { path: "/nfa-detail/:nfa_id", element: <NfaDetailPage /> },
      // { path: "/mix-card-view", element: <MixCardNfa /> },
      { path: "/users", element: <UserTable /> },
      { path: "/edit-user/:user_id", element: <EditUser /> },
      { path: "/user-creation", element: <UserCreationTable /> },
      { path: "/order-selection", element: <OrderSelection /> },
      { path: "/working-nfa/:nfa_id/:stage_id", element: <ApprovalPending /> },
      { path: "/add/stage", element: <StageCreationTable /> },
      { path: "/stages", element: <StageTable /> },
      {
        path: "/add/nfa",
        element: (
          <AddNfa refresh={() => {}} initialData={null} onClose={() => {}} />
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
export default router;
