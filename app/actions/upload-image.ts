"use server"

import { put } from "@vercel/blob"

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { success: false, error: "Failed to upload image" }
  }
}
