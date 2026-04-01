// Register is handled by the same auth page — redirect there
import { redirect } from "next/navigation";
export default function RegisterPage() {
  redirect("/login");
}
