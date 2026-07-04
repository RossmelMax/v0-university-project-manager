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

    // Prompt for the LLM
    const prompt = `Eres un asistente legal experto en Bolivia. 
A continuación se presenta el texto extraído de un borrador de contrato o proyecto de grado.
Tu objetivo es extraer los siguientes datos y devolverlos ESTRICTAMENTE en formato JSON, sin texto adicional. Asegúrate de corregir cualquier error tipográfico originado por la lectura del escaneo (OCR).
- title: El título del proyecto (string).
- studentName: El nombre del postulante o alumno (string).
- career: La carrera a la que pertenece (e.g. "Ingeniería en Sistemas", "Ingeniería en Telecomunicaciones", "Ingeniería Petrolera"). Si no estás seguro, devuelve un string vacío.
- year: El año del documento (string, usualmente 4 dígitos).
- abstract: El resumen del proyecto. Extrae solo el contenido bajo la sección "RESUMEN", "ABSTRACT" o "RESUMEN EJECUTIVO", sin incluir el título de la sección y sin mezclarlo con el índice. Si no hay un párrafo redactado de resumen, devuelve un string vacío.

Aquí está el texto:
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
    });
  } catch (error) {
    console.error("Error in extract-pdf-data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
