CREATE TYPE "public"."cita_status" AS ENUM('pendiente', 'confirmada', 'cancelada', 'completada');--> statement-breakpoint
CREATE TYPE "public"."cita_tipo" AS ENUM('consulta', 'tratamiento', 'revision', 'otro');--> statement-breakpoint
CREATE TYPE "public"."origen_contacto" AS ENUM('web', 'redes_sociales', 'google', 'conocido', 'otro');--> statement-breakpoint
CREATE TYPE "public"."staff_rol" AS ENUM('admin', 'medico', 'esteticista', 'recepcion');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "citas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid NOT NULL,
	"staff_id" uuid,
	"tipo_tratamiento_id" uuid,
	"fecha" timestamp NOT NULL,
	"duracion_min" integer DEFAULT 60 NOT NULL,
	"tipo" "cita_tipo" DEFAULT 'consulta' NOT NULL,
	"status" "cita_status" DEFAULT 'pendiente' NOT NULL,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historia_fotos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"historia_id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"url" text NOT NULL,
	"tipo" text NOT NULL,
	"descripcion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"seccion" jsonb NOT NULL,
	"notas" text,
	"creado_por" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"email" text,
	"telefono" text,
	"fecha_nacimiento" date,
	"origen" "origen_contacto" DEFAULT 'otro' NOT NULL,
	"avatar_url" text,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipos_tratamiento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"duracion_min" integer DEFAULT 60 NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"rol" "staff_rol" DEFAULT 'recepcion' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_tipo_tratamiento_id_tipos_tratamiento_id_fk" FOREIGN KEY ("tipo_tratamiento_id") REFERENCES "public"."tipos_tratamiento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historia_fotos" ADD CONSTRAINT "historia_fotos_historia_id_historias_id_fk" FOREIGN KEY ("historia_id") REFERENCES "public"."historias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historia_fotos" ADD CONSTRAINT "historia_fotos_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historias" ADD CONSTRAINT "historias_paciente_id_pacientes_id_fk" FOREIGN KEY ("paciente_id") REFERENCES "public"."pacientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historias" ADD CONSTRAINT "historias_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "citas_paciente_idx" ON "citas" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "citas_staff_idx" ON "citas" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "citas_fecha_idx" ON "citas" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "citas_status_idx" ON "citas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fotos_historia_idx" ON "historia_fotos" USING btree ("historia_id");--> statement-breakpoint
CREATE INDEX "historias_paciente_idx" ON "historias" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX "historias_fecha_idx" ON "historias" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "pacientes_nombre_idx" ON "pacientes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "pacientes_email_idx" ON "pacientes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pacientes_created_at_idx" ON "pacientes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vt_identifier_token_idx" ON "verification_tokens" USING btree ("identifier","token");