import { Suspense } from "react";
import AuthForm from "./AuthForm";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] dark:bg-[#1A1918]">
          Загрузка...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
