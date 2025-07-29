
"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { getDatabase, ref, push } from "firebase/database"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { initializeApp } from "firebase/app"
import { firebaseConfig } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react"

// Initialize Firebase
initializeApp(firebaseConfig)
const db = getDatabase()
const storage = getStorage()

// Dummy data for the table (move this above the component)
const firmwareData = [
  {
    fileName: "firmware_v1.0.2.bin",
    targetDevice: "ESP32",
    version: "1.0.2",
    uploadDate: "2024-06-01 14:23",
    size: 1048576,
    checksum: "a1b2c3d4e5f6g7h8i9j0",
    status: "Pending",
  },
  {
    fileName: "firmware_v1.0.1.bin",
    targetDevice: "ESP8266",
    version: "1.0.1",
    uploadDate: "2024-05-20 09:10",
    size: 524288,
    checksum: "z9y8x7w6v5u4t3s2r1q0",
    status: "Active",
  },
]

export default function OtaUploadForm() {
  const [version, setVersion] = useState("")
  const [targetDevice, setTargetDevice] = useState("")
  const [releaseNote, setReleaseNote] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  // Validation
  const [errors, setErrors] = useState({
    version: "",
    file: "",
    releaseNote: "",
    targetDevice: "",
  })

  const validateForm = () => {
    const newErrors = {
      version: "",
      file: "",
      releaseNote: "",
      targetDevice: "",
    }

    

    if (!version.trim()) {
      newErrors.version = "Version is required"
    } else if (!/^\d+\.\d+\.\d+$/.test(version)) {
      newErrors.version = "Version must be in format x.x.x (e.g., 1.0.0)"
    }

    if (!file) {
      newErrors.file = "Firmware file is required"
    } else if (file.size > 50 * 1024 * 1024) {
      newErrors.file = "File size must be less than 50MB"
    }

    if (!targetDevice.trim()) {
      newErrors.targetDevice = "Target Device is required"
    } else if (targetDevice.length < 4) {
      newErrors.targetDevice = "Target Device must be more than 3 characters"
    }

    

    if (!releaseNote.trim()) {
      newErrors.releaseNote = "Release Note is required"
    } else if (releaseNote.length < 4) {
      newErrors.releaseNote = "Release Note must be more than 3 characters"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      setErrors((prev) => ({ ...prev, file: "" }))
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setErrors((prev) => ({ ...prev, file: "" }))
    }
  }

  const removeFile = () => {
    setFile(null)
    setErrors((prev) => ({ ...prev, file: "" }))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const resetForm = () => {
    setVersion("")
    setFile(null)
    setErrors({
      version: "",
      file: "",
      releaseNote: "",
      targetDevice: "",
    })
    setError("")
    setSuccess(false)
    setUploadProgress(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload file to Firebase Storage
      // const fileRef = storageRef(storage, `firmwares/${deviceId}/${file!.name}`)
      // await uploadBytes(fileRef, file!)
      // const fileUrl = await getDownloadURL(fileRef)

      // // Save metadata to Realtime Database
      // await push(ref(db, `firmwareUpdates/${deviceId}`), {
      //   version,
      //   fileUrl,
      //   fileName: file!.name,
      //   fileSize: file!.size,
      //   uploadedAt: new Date().toISOString(),
      // })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (err) {
      console.error("Upload failed:", err)
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Upload Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Firmware version {version} has been uploaded for device {targetDevice}
              </p>
            </div>
            <Button onClick={resetForm} variant="outline" className="w-full bg-transparent">
              Upload Another Firmware
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full  mx-auto">
      <Card className="w-full  mx-auto  border-none shadow-none ">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Upload className="h-5 w-5" />
           Zubi Technologies OTA Firmware Upload
          </CardTitle>
          <CardDescription>Upload firmware updates for your IoT devices</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 ">
            {/* Device ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              
              {/* Target device */}
              <div className="space-y-2">
                <Label htmlFor="targetDevice">Target Device</Label>
                <Input
                  id="targetDevice"
                  type="text"
                  placeholder="Access control"
                  value={targetDevice}
                  onChange={(e) => {
                    setTargetDevice(e.target.value)
                    if (errors.targetDevice) setErrors((prev) => ({ ...prev, targetDevice: "" }))
                  }}
                  className={errors.targetDevice ? "border-red-500" : ""}
                />
                {errors.targetDevice && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.targetDevice}
                  </p>
                )}

              </div>

              {/* Version */}
              <div className="space-y-2">
                <Label htmlFor="version">Firmware Version</Label>
                <Input
                  id="version"
                  type="text"
                  placeholder="e.g., 1.0.0"
                  value={version}
                  onChange={(e) => {
                    setVersion(e.target.value)
                    if (errors.version) setErrors((prev) => ({ ...prev, version: "" }))
                  }}
                  className={errors.version ? "border-red-500" : ""}
                />
                {errors.version && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.version}
                  </p>
                )}
              </div>


              {/* Release note */}
              <div className="space-y-2">
                <Label htmlFor="releaseNote">Release Note</Label>
                <Input
                  id="releaseNote"
                  type="text"
                  placeholder="This OTA is for....."
                  value={releaseNote}
                  onChange={(e) => {
                    setReleaseNote(e.target.value)
                    if (errors.releaseNote) setErrors((prev) => ({ ...prev, releaseNote: "" }))
                  }}
                  className={errors.releaseNote ? "border-red-500" : ""}
                />
                {errors.releaseNote && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.releaseNote}
                  </p>
                )}

              </div>

              {/* Checksome */}
              <div className="space-y-2">
                <Label htmlFor="checksome">CheckSum</Label>
                <Input
                  id="checksum"
                  type="text"
                  placeholder="29th of July, 2025"
                  // value={version}
                  disabled
                />

              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  placeholder="29th of July, 2025"
                  // value={version}
                  disabled
                />

              </div>

              {/* time */}
              <div className="space-y-2">
                <Label htmlFor="date">Time</Label>
                <Input
                  id="time"
                  type="time"
                  // placeholder="29th of July, 2025"
                  // value={version}
                  disabled
                />

              </div>

            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Firmware File</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
                    ? "border-primary bg-primary/5"
                    : errors.file
                      ? "border-red-500"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".bin,.hex,.elf,.img"
                />

                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Drop firmware file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse (.bin, .hex, .elf, .img)</p>
                  </div>
                )}
              </div>
              {errors.file && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.file}
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={uploading} size="lg">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading Firmware...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Firmware
                </>
              )}
            </Button>

            {/* File Info */}
            {file && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  Size: {formatFileSize(file.size)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Type: {file.type || "Unknown"}
                </Badge>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Firmware Table with dummy data */}
      <Card className="w-full mt-8 border-none shadow-none">
        <CardHeader>
          <CardTitle>Firmware Uploads</CardTitle>
          <CardDescription>List of uploaded firmware files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Filename</th>
                  <th className="px-4 py-2 text-left">Target Device</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Upload Date</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-left">Checksum</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {firmwareData.map((fw, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{fw.fileName}</td>
                    <td className="px-4 py-2">{fw.targetDevice}</td>
                    <td className="px-4 py-2">{fw.version}</td>
                    <td className="px-4 py-2">{fw.uploadDate}</td>
                    <td className="px-4 py-2">{fw.size.toLocaleString()} bytes</td>
                    <td className="px-4 py-2">{fw.checksum}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant={
                          fw.status === "Active"
                            ? "default"
                            : fw.status === "Pending"
                            ? "secondary"
                            : "outline"
                        }
                        disabled={fw.status !== "Pending"}
                        onClick={() => {
                          if (fw.status === "Pending") {
                            // Add your status change logic here
                            alert(`Status for ${fw.fileName} clicked!`);
                          }
                        }}
                        className={
                          fw.status === "Pending"
                            ? "cursor-pointer bg-black text-white"
                            : "cursor-not-allowed opacity-60 "
                        }
                      >
                        {fw.status}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Card>
  )
}


// "use client"

// import { useState } from "react"
// import { getDatabase, ref, push } from "firebase/database"
// import { initializeApp } from "firebase/app"
// import { firebaseConfig } from "@/lib/firebase"

// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { CheckCircle, AlertCircle } from "lucide-react"

// // Initialize Firebase
// initializeApp(firebaseConfig)
// const db = getDatabase()

// export default function OtaUploadForm() {
//   const [deviceId, setDeviceId] = useState("")
//   const [version, setVersion] = useState("")
//   const [uploading, setUploading] = useState(false)
//   const [success, setSuccess] = useState(false)
//   const [error, setError] = useState("")

//   const resetForm = () => {
//     setDeviceId("")
//     setVersion("")
//     setSuccess(false)
//     setError("")
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!deviceId.trim() || !version.trim()) {
//       setError("Device ID and Version are required")
//       return
//     }

//     setUploading(true)
//     setError("")

//     try {
//       await push(ref(db, `firmwareUpdates/${deviceId}`), {
//         version,
//         uploadedAt: new Date().toISOString(),
//       })

//       setSuccess(true)
//       setTimeout(() => resetForm(), 3000)
//     } catch (err) {
//       console.error("Error saving firmware info:", err)
//       setError("Failed to submit firmware info")
//     } finally {
//       setUploading(false)
//     }
//   }

//   if (success) {
//     return (
//       <Card className="w-full max-w-md mx-auto">
//         <CardContent className="pt-6">
//           <div className="text-center space-y-4">
//             <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
//             <div>
//               <h3 className="text-lg font-semibold text-green-700">Upload Successful!</h3>
//               <p className="text-sm text-muted-foreground mt-2">
//                 Firmware version {version} has been saved for device {deviceId}
//               </p>
//             </div>
//             <Button onClick={resetForm} variant="outline" className="w-full bg-transparent">
//               Upload Another
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <Card className="w-full max-w-lg mx-auto">
//       <CardHeader className="text-center">
//         <CardTitle className="flex items-center justify-center gap-2">
//           OTA Firmware Upload
//         </CardTitle>
//         <CardDescription>Submit firmware version for your IoT device</CardDescription>
//       </CardHeader>

//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Device ID */}
//           <div className="space-y-2">
//             <Label htmlFor="deviceId">Device ID</Label>
//             <Input
//               id="deviceId"
//               type="text"
//               placeholder="Enter device identifier"
//               value={deviceId}
//               onChange={(e) => setDeviceId(e.target.value)}
//             />
//           </div>

//           {/* Version */}
//           <div className="space-y-2">
//             <Label htmlFor="version">Firmware Version</Label>
//             <Input
//               id="version"
//               type="text"
//               placeholder="e.g., 1.0.0"
//               value={version}
//               onChange={(e) => setVersion(e.target.value)}
//             />
//           </div>

//           {/* Error */}
//           {error && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           {/* Submit */}
//           <Button type="submit" className="w-full" disabled={uploading}>
//             {uploading ? "Uploading..." : "Submit"}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }
