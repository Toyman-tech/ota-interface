import OtaUploadForm from "@/components/OtaUploadForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="container  mx-auto h-full flex items-center justify-center">
        <OtaUploadForm />
      </div>
    </div>
  )
}
