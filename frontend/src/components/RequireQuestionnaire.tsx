import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

type RequireQuestionnaireProps = Readonly<{
  children: ReactNode;
}>;

export default function RequireQuestionnaire({
  children,
}: RequireQuestionnaireProps) {
  const completed = localStorage.getItem("hasCompletedQuestionnaire");

  if (completed === "true") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
