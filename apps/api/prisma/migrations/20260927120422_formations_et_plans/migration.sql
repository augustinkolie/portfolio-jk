-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('IN_PERSON', 'LIVE_ONLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NEW', 'CONTACTED', 'ENROLLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "software" TEXT NOT NULL,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "format" "CourseFormat" NOT NULL DEFAULT 'IN_PERSON',
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT,
    "location" TEXT,
    "price" TEXT,
    "nextSession" TEXT,
    "teaserKey" TEXT,
    "teaserMime" TEXT,
    "teaserSize" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "levels" TEXT,
    "surface" TEXT,
    "bedrooms" INTEGER,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_published_order_idx" ON "Course"("published", "order");

-- CreateIndex
CREATE INDEX "Enrollment_status_createdAt_idx" ON "Enrollment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "Plan_published_order_idx" ON "Plan"("published", "order");

-- CreateIndex
CREATE INDEX "Media_courseId_order_idx" ON "Media"("courseId", "order");

-- CreateIndex
CREATE INDEX "Media_planId_order_idx" ON "Media"("planId", "order");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
