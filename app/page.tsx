'use client'

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react'
import {
  Clock3,
  FileText,
  LoaderCircle,
  Mic2,
  Trash2,
  Upload,
} from 'lucide-react'

type UploadFile = {
  id: string
  file: File
}

const ACCEPTED_TYPES = ['application/pdf', 'text/plain']

export default function Home() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [voice, setVoice] = useState('neutro')
  const [duration, setDuration] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalSize = useMemo(
    () => files.reduce((acc, item) => acc + item.file.size, 0),
    [files],
  )

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return

    const validFiles = Array.from(incoming).filter((file) => {
      return ACCEPTED_TYPES.includes(file.type)
    })

    const newFiles = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const handleGeneratePodcast = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1800)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 bg-slate-950 px-6 py-10 text-slate-100 md:px-10">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Podcast IA</p>
        <h1 className="text-3xl font-bold md:text-5xl">Convierte tus documentos en audio en segundos</h1>
        <p className="max-w-2xl text-sm text-slate-300 md:text-base">
          Sube uno o varios archivos para crear un podcast con voz sintética. Todo el estado se maneja localmente,
          sin llamadas externas.
        </p>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div
            className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition ${
              isDragging
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-950/60 hover:border-cyan-300/80 hover:bg-slate-950'
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-9 w-9 text-cyan-300" />
            <h2 className="text-lg font-semibold">Arrastra y suelta tus archivos</h2>
            <p className="text-sm text-slate-400">Formatos permitidos: PDF y TXT</p>
            <button
              type="button"
              className="rounded-full border border-slate-600 px-4 py-1.5 text-sm font-medium hover:border-cyan-300 hover:text-cyan-200"
            >
              Seleccionar archivos
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.txt"
              className="hidden"
              onChange={onChangeInput}
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Archivos seleccionados</h3>
              <span className="text-xs text-slate-400">
                {files.length} archivo(s) · {(totalSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {files.length === 0 ? (
              <p className="text-sm text-slate-400">Aún no has agregado documentos.</p>
            ) : (
              <ul className="space-y-2">
                {files.map(({ id, file }) => (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-cyan-300" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-2 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                      onClick={() => removeFile(id)}
                      aria-label={`Eliminar ${file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleGeneratePodcast}
            disabled={isGenerating || files.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Generando podcast...
              </>
            ) : (
              'Generar podcast'
            )}
          </button>
        </div>

        <form className="flex h-fit flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold">Configuración</h2>

          <label className="space-y-1 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Mic2 className="h-4 w-4" /> Voz
            </span>
            <select
              value={voice}
              onChange={(event) => setVoice(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300"
            >
              <option value="neutro">Neutra</option>
              <option value="narrador">Narrador</option>
              <option value="energica">Enérgica</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-300">
              <Clock3 className="h-4 w-4" /> Duración
            </span>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300"
            >
              <option value="3">3 minutos</option>
              <option value="5">5 minutos</option>
              <option value="10">10 minutos</option>
            </select>
          </label>
        </form>
      </section>
    </main>
  )
}
