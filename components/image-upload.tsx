"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"
import { uploadImage } from "@/app/actions/upload-image"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 3 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files)
        .slice(0, remainingSlots)
        .map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          const result = await uploadImage(formData)
          if (result.success && result.url) {
            return result.url
          }
          throw new Error(result.error || "Upload failed")
        })

      const uploadedUrls = await Promise.all(uploadPromises)
      onImagesChange([...images, ...uploadedUrls])
    } catch (error) {
      console.error("Error uploading images:", error)
      alert("Failed to upload images. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Photos"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#7D9B7F]/20">
              <img
                src={url || "/placeholder.svg"}
                alt={`Product view ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                {index === 0 ? "Front" : index === 1 ? "Side" : "Back"}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {images.length}/{maxImages} photos • Add different views (front, side, back)
      </p>
    </div>
  )
}
