import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/app/utlis/auth";
import CompanyModel from "@/database/schema/CompanyModel";

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export async function requireCompany() {
  const session = await requireUser();
  const company = await CompanyModel.findById(session.id).select("_id");

  if (!company) {
    redirect("/");
  }

  return company;
}