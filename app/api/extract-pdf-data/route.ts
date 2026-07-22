import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY no está configurada." },
        { status: 501 },
      );
    }

    // Prompt optimizado para tesis de grado bolivianas (formato UDABOL)
    const prompt = `Eres un asistente experto en documentos académicos de universidades bolivianas, específicamente tesis y proyectos de grado de la Universidad de Aquino Bolivia (UDABOL).

A continuación se presenta el texto extraído (posiblemente con errores de OCR) de un proyecto de grado o tesis boliviana. Los documentos suelen tener este formato:
- "CARRERA DE INGENIERÍA EN SISTEMAS" (o Telecomunicaciones, o Petrolera)
- "POSTULANTE: Nombre Completo" o "AUTOR: Nombre Completo"
- "EXAMEN DE GRADO" o "PROYECTO DE GRADO" o "TESIS DE GRADO"
- Título del proyecto en mayúsculas después de la carrera
- Sección "RESUMEN" o "RESUMEN EJECUTIVO" o "ABSTRACT" con el resumen
- Fechas típicas: "Cochabamba - Bolivia", "Gestión 2024"

Tu objetivo es extraer los siguientes datos y devolverlos ESTRICTAMENTE en formato JSON, sin texto adicional ni markdown. Corrige cualquier error tipográfico del OCR.

Campos a extraer:
- title: El título completo del proyecto de grado (string). Normalmente aparece en mayúsculas después de la carrera. Ej: "SISTEMA DE GESTIÓN ACADÉMICA PARA LA UNIVERSIDAD DE AQUINO BOLIVIA"
- studentName: El nombre completo del postulante o autor (string). Busca después de palabras como "POSTULANTE:", "AUTOR:", "ALUMNO:", "POR:".
- career: La carrera (string). Debe ser exactamente una de: "Ingeniería en Sistemas", "Ingeniería en Telecomunicaciones", "Ingeniería Petrolera", o string vacío si no se identifica claramente.
- year: El año del documento (string, 4 dígitos). Busca en fechas como "Gestión 2024", "Cochabamba, 2023", o cualquier año cercano al texto.
- abstract: El texto completo del resumen (string). Extrae SOLO el contenido bajo "RESUMEN", "RESUMEN EJECUTIVO" o "ABSTRACT". NO incluyas el título de la sección ni el índice/tabla de contenidos. Si el texto contiene índices o numeración mezclada con el resumen, sepáralos e incluye solo el párrafo del resumen. Devuelve string vacío si no encuentras un resumen claro.
- keywords: Un array de strings con 5 a 10 palabras clave relevantes del proyecto (tecnologías, metodologías, temas principales). Ej: ["machine learning", "base de datos", "monitoreo remoto", "dashboard web"]. Si no hay resumen para extraerlas, devuelve un array vacío [].

Texto del documento:
"""
${text.substring(0, 15000)}
"""`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq API error:", errorText);
      return NextResponse.json({ error: "Failed to parse with Groq" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    return NextResponse.json({
      title: parsed.title || "",
      studentName: parsed.studentName || "",
      career: parsed.career || "",
      year: parsed.year || "",
      abstract: parsed.abstract || "",
      keywords: parsed.keywords || [],
    });
  } catch (error) {
    console.error("Error in extract-pdf-data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
