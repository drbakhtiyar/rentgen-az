import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getDownloadUrlAction } from "@/app/actions/rentgen-files";
import { FileViewer } from "@/components/viewer/file-viewer";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Fayl baxışı",
  path: "/viewer",
  noIndex: true,
});

/**
 * In-browser viewer for rentgen files (DICOM/CBCT series, images, PDF).
 * Access control is the same as downloads — getDownloadUrlAction gates by
 * center / patient / accepted partner doctor / admin and audits the access.
 */
export default async function ViewerPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/giris?next=/viewer/${fileId}`);

  const res = await getDownloadUrlAction(fileId);
  if (!res.ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
          {res.error}
        </p>
      </div>
    );
  }

  const file = await prisma.rentgenFile.findUnique({
    where: { id: fileId },
    select: { fileName: true, size: true, contentType: true },
  });
  if (!file) redirect("/");

  return (
    <div className="h-[calc(100vh-4rem)]">
      <FileViewer
        url={res.url}
        fileName={file.fileName}
        size={file.size}
        contentType={file.contentType}
      />
    </div>
  );
}
