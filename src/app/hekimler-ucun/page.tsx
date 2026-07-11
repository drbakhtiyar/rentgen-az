import { permanentRedirect } from "next/navigation";

// Merged into /hekimler — permanent (308) redirect for SEO link equity.
export default function ForDoctorsRedirect() {
  permanentRedirect("/hekimler");
}
