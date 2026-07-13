-- AlterTable
ALTER TABLE "AdminMessage" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT;
