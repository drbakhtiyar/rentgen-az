import { redirect } from "next/navigation";

// Merged into /hekimler — this page now redirects there.
export default function ForDoctorsRedirect() {
  redirect("/hekimler");
}
