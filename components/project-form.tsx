"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/app/actions/projects";
import { CARRERAS, type SearchResult } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PdfUpload } from "@/components/pdf-upload";
import { PdfComparisonDialog } from "@/components/pdf-comparison-dialog";
import { CheckCircle2, AlertCircle, Plus, PencilLine, Tag } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

type ProjectFormProps = {
  mode?: "create" | "edit";
  project?: SearchResult | null;
  onSuccess?: () => void;
  initialData?: {
    title?: string;
    studentName?: string;
    career?: string;
    year?: number;
    abstract?: string;
    pdfUrl?: string | null;
  } | null;
};

export function ProjectForm({
  mode = "create",
  project = null,
  onSuccess,
  initialData = null,
}: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [studentName, setStudentName] = useState("");
  const [career, setCareer] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [abstract, setAbstract] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    title: string;
    studentName: string;
    career: string;
    year: string;
    abstract: string;
    pdfUrl: string;
    keywords: string[];
  } | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setStudentName(project.studentName);
      setCareer(project.career);
      setYear(project.year);
      setAbstract(project.abstract);
      setPdfUrl(project.pdfUrl ?? null);
      setTags((project.tags ?? []).join(", "));
    } else {
      setTitle("");
      setStudentName("");
      setCareer("");
      setYear(CURRENT_YEAR);
      setAbstract("");
      setPdfUrl(null);
      setTags("");
    }
  }, [project]);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.title !== undefined) setTitle(initialData.title);
    if (initialData.studentName !== undefined) setStudentName(initialData.studentName);
    if (initialData.career !== undefined) setCareer(initialData.career);
    if (initialData.year !== undefined) setYear(initialData.year);
    if (initialData.abstract !== undefined) setAbstract(initialData.abstract);
    if (initialData.pdfUrl !== undefined) setPdfUrl(initialData.pdfUrl ?? null);
  }, [initialData]);

  function handlePdfExtracted(data: {
    title: string;
    studentName: string;
    career: string;
    year: string;
    abstract: string;
    pdfUrl: string;
    keywords: string[];
  }) {
    setExtractedData(data);
    setShowComparison(true);
  }

  function applyExtractedData() {
    if (!extractedData) return;
    if (extractedData.title) setTitle(extractedData.title);
    if (extractedData.studentName) setStudentName(extractedData.studentName);
    if (extractedData.career) setCareer(extractedData.career);
    if (extractedData.year) setYear(Number(extractedData.year));
    if (extractedData.abstract) setAbstract(extractedData.abstract);
    if (extractedData.pdfUrl) setPdfUrl(extractedData.pdfUrl);
    if (extractedData.keywords && extractedData.keywords.length > 0) {
      setTags(extractedData.keywords.join(", "));
    }
    setShowComparison(false);
    setFeedback({
      type: "ok",
      text: "Se aplicaron los datos detectados del PDF.",
    });
  }

  function keepCurrentData() {
    setShowComparison(false);
    setFeedback({
      type: "ok",
      text: "Se conservaron los datos actuales del formulario.",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!career) {
      setFeedback({ type: "error", text: "Por favor selecciona una carrera." });
      return;
    }

    startTransition(async () => {
      const payload = { title, studentName, career, year, abstract, pdfUrl, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) };

      // Aseguramos que si es modo edit, el ID se pase como string explícitamente
      const res =
        mode === "edit" && project
          ? await updateProject(project.id as string, payload)
          : await createProject(payload);

      if (res.ok) {
        setFeedback({
          type: "ok",
          text:
            mode === "edit"
              ? "Proyecto actualizado correctamente."
              : "Proyecto registrado correctamente.",
        });
        if (mode !== "edit") {
          setTitle("");
          setStudentName("");
          setCareer("");
          setYear(CURRENT_YEAR);
          setAbstract("");
          setPdfUrl(null);
        }
        router.refresh();
        onSuccess?.();
      } else {
        setFeedback({ type: "error", text: res.error || "Ocurrió un error." });
      }
    });
  }

  return (
    <>
      <PdfComparisonDialog
        open={showComparison}
        current={{ title, studentName, career, year, abstract, tags }}
        extracted={
          extractedData ?? {
            title: "",
            studentName: "",
            career: "",
            year: "",
            abstract: "",
            keywords: [],
          }
        }
        onUseExtracted={applyExtractedData}
        onKeepCurrent={keepCurrentData}
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <PdfUpload
          onExtracted={handlePdfExtracted}
          onUploadComplete={setPdfUrl}
          existingPdfUrl={pdfUrl}
        />

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="title"
            className="text-sm font-semibold"
          >
            Título del proyecto <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Sistema de gestión de inventarios con IA"
            className="h-12 text-base"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="studentName"
              className="text-sm font-semibold"
            >
              Nombre del alumno <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studentName"
              name="studentName"
              required
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Ej. María Fernanda Quiroga"
              className="h-12 text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="year"
              className="text-sm font-semibold"
            >
              Año <span className="text-destructive">*</span>
            </Label>
            <Input
              id="year"
              name="year"
              type="number"
              required
              min={1980}
              max={2100}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="h-12 text-base"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="career"
              className="text-sm font-semibold"
            >
              Carrera <span className="text-destructive">*</span>
            </Label>
            <Select
              value={career}
              onValueChange={(val) => {
                if (val !== null) {
                  setCareer(val);
                }
              }}
            >
              <SelectTrigger
                id="career"
                className="h-12 text-base"
              >
                <SelectValue placeholder="Selecciona una carrera" />
              </SelectTrigger>
              <SelectContent>
                {CARRERAS.map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="text-base"
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="abstract"
            className="text-sm font-semibold"
          >
            Resumen
          </Label>
          <Textarea
            id="abstract"
            name="abstract"
            rows={5}
            value={abstract}
            onChange={(event) => setAbstract(event.target.value)}
            placeholder="Describe brevemente el objetivo y alcance del proyecto de grado..."
            className="resize-y text-base leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tags"
            className="text-sm font-semibold"
          >
            <Tag className="inline size-3.5 mr-1" aria-hidden="true" />
            Palabras clave / Tags
          </Label>
          <Input
            id="tags"
            name="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Ej. inteligencia artificial, base de datos, monitoreo"
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground">
            Ingresa palabras clave separadas por coma. Se extraerán
            automáticamente del resumen si se deja vacío.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={
              feedback.type === "ok"
                ? "flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
                : "flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            }
          >
            {feedback.type === "ok" ? (
              <CheckCircle2
                className="size-5 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="size-5 shrink-0"
                aria-hidden="true"
              />
            )}
            {feedback.text}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-13 text-base font-semibold"
        >
          {mode === "edit" ? (
            <PencilLine
              className="mr-2 size-5"
              aria-hidden="true"
            />
          ) : (
            <Plus
              className="mr-2 size-5"
              aria-hidden="true"
            />
          )}
          {isPending
            ? mode === "edit"
              ? "Actualizando..."
              : "Registrando..."
            : mode === "edit"
              ? "Actualizar proyecto"
              : "Registrar proyecto"}
        </Button>
      </form>
    </>
  );
}
