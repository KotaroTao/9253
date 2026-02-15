-- CreateTable
CREATE TABLE "improvement_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_question" TEXT,
    "baseline_score" DOUBLE PRECISION,
    "target_score" DOUBLE PRECISION,
    "result_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (improvement_actions)
CREATE INDEX "improvement_actions_clinic_id_idx" ON "improvement_actions"("clinic_id");
CREATE INDEX "improvement_actions_clinic_id_status_idx" ON "improvement_actions"("clinic_id", "status");

-- CreateIndex (survey_responses - new composite index)
CREATE INDEX "survey_responses_clinic_id_staff_id_idx" ON "survey_responses"("clinic_id", "staff_id");

-- AddForeignKey
ALTER TABLE "improvement_actions" ADD CONSTRAINT "improvement_actions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
