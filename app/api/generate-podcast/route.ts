import { NextResponse } from 'next/server'

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Falta configurar OPENAI_API_KEY en el servidor.' }, { status: 500 })
  }

  const formData = await request.formData()
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0)

  const voice = String(formData.get('voice') ?? 'neutro')
  const duration = String(formData.get('duration') ?? '5')

  if (files.length === 0) {
    return NextResponse.json({ error: 'Debes enviar al menos un archivo PDF.' }, { status: 400 })
  }

  const uploadedFileIds: string[] = []

  try {
    for (const file of files) {
      const uploadData = new FormData()
      uploadData.append('purpose', 'user_data')
      uploadData.append('file', file, file.name)

      const uploadResponse = await fetch(`${OPENAI_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: uploadData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        return NextResponse.json(
          { error: `No se pudo subir el archivo ${file.name}. Detalle: ${errorText}` },
          { status: 502 },
        )
      }

      const uploadJson = (await uploadResponse.json()) as { id?: string }

      if (!uploadJson.id) {
        return NextResponse.json(
          { error: `OpenAI no devolvió file_id para ${file.name}.` },
          { status: 502 },
        )
      }

      uploadedFileIds.push(uploadJson.id)
    }

    const responsePayload = {
      model: 'gpt-5-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'Eres un guionista experto en podcasts en español. Responde solo con el guion dialogado entre dos personas: Persona A y Persona B, de forma natural y fluida.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Genera un podcast conversacional en español basado en los documentos adjuntos. Voz solicitada: ${voice}. Duración objetivo: ${duration} minutos. Devuelve únicamente el diálogo final y usa el formato:\nPersona A: ...\nPersona B: ...`,
            },
            ...uploadedFileIds.map((fileId) => ({
              type: 'input_file' as const,
              file_id: fileId,
            })),
          ],
        },
      ],
    }

    const generationResponse = await fetch(`${OPENAI_BASE_URL}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responsePayload),
    })

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text()
      return NextResponse.json(
        { error: `No se pudo generar el podcast. Detalle: ${errorText}` },
        { status: 502 },
      )
    }

    const generationJson = (await generationResponse.json()) as { output_text?: string }

    if (!generationJson.output_text) {
      return NextResponse.json(
        { error: 'La respuesta de OpenAI no incluyó output_text.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ dialogue: generationJson.output_text })
  } finally {
    await Promise.all(
      uploadedFileIds.map((fileId) =>
        fetch(`${OPENAI_BASE_URL}/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }).catch(() => null),
      ),
    )
  }
}
