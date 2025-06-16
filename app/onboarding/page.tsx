import React from "react";

import { redirect } from "next/navigation";
import { requireUser } from "../utlis/hooks";
import UserModel from "@/database/schema/UserModel";
import { connectDB } from "@/lib/db";
import OnboardingForm from "@/components/forms/OnboardingForm";

async function checkIfOnboardingCompleted(userId: string) {
  await connectDB()
      const user = await UserModel.findOne({_id: userId , onboardingCompleted: true})
    if(user?.onboardingCompleted === true){
        redirect("/")
    }
}

const OnboardingPage = async () => {
  const session = await requireUser();

  await checkIfOnboardingCompleted(session.id!);
  return (
    <div className="min-h-screen w-screen py-10 flex flex-col items-center justify-center">
       <OnboardingForm />
    </div>
  );
};

export default OnboardingPage;