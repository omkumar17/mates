"use client";

import { useEffect, useState, useRef } from "react";
import {
  Camera,
  MapPin,
  User,
  Calendar,
  X,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ImageCropper from "./ImageCropper";
import api from "@/api/apiClient";

export default function ProfileForm({
  initialData,
  onSubmit,
  saving,
}) {
  const fileInputRef = useRef(null);

  // -----------------------------
  // Image State
  // -----------------------------
  // existingImages: images already saved in DB { url, publicId }
  // newImageFiles: newly selected files (cropped) waiting to be uploaded
  // removedExistingIds: publicIds of existing images user wants to delete
  // -----------------------------
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [removedExistingIds, setRemovedExistingIds] = useState([]);

  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState(null);

  // Upload state
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    city: "",
    bio: "",
    interests: [],

    preferences: {
      minAge: 18,
      maxAge: 60,
      genders: [],
      lookingFor: [],
      cityPreference: "same-city",
    },
  });

  useEffect(() => {
    if (!initialData) return;

    setForm({
      age: initialData.age || "",
      gender: initialData.gender || "",
      city: initialData.city || "",
      bio: initialData.bio || "",
      interests: initialData.interests || [],

      preferences: {
        minAge:
          initialData.preferences?.minAge || 18,

        maxAge:
          initialData.preferences?.maxAge || 60,

        genders:
          initialData.preferences?.genders || [],

        lookingFor:
          initialData.preferences?.lookingFor || [],

        cityPreference:
          initialData.preferences?.cityPreference ||
          "same-city",
      },
    });

    // Normalize existing images to { url, publicId } format
    const images = initialData.images || [];
    const normalized = images.map((img) => {
      if (typeof img === "string") return { url: img, publicId: null };
      return { url: img.url || "", publicId: img.publicId || null };
    }).filter((img) => img.url);
    setExistingImages(normalized);
  }, [initialData]);

  // -----------------------------
  // Helpers
  // -----------------------------

  const totalImageCount = existingImages.length + newImageFiles.length;

  const getImageUrl = (item) => {
    if (item instanceof File) return URL.createObjectURL(item);
    return item.url || "";
  };

  const isFile = (item) => item instanceof File;

  // -----------------------------
  // File Selection → Cropper
  // -----------------------------

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + totalImageCount > 3) {
      toast("Maximum 3 photos allowed", { icon: "❌" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Read first file and open cropper
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // -----------------------------
  // Crop Complete → Store File
  // -----------------------------

  const handleCropComplete = (croppedFile) => {
    setNewImageFiles((prev) => [...prev, croppedFile]);
    setCropImageSrc(null);
    toast.success("Photo added!");
  };

  // -----------------------------
  // Remove Image
  // -----------------------------

  const handleRemoveImage = (index, isExisting) => {
    if (isExisting) {
      const removed = existingImages[index];
      if (removed.publicId) {
        setRemovedExistingIds((prev) => [...prev, removed.publicId]);
      }
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // It's a new file - just remove from list
      setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // -----------------------------
  // Submit with Cloudinary Upload
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (totalImageCount === 0) {
      toast("Upload at least one photo", { icon: "❌" });
      return;
    }

    if (!form.age || !form.gender) {
      toast("Fill required fields", { icon: "❌" });
      return;
    }

    // If there are no new images to upload, directly submit
    if (newImageFiles.length === 0) {
      const finalImages = existingImages.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      }));

      onSubmit({
        ...form,
        age: Number(form.age),
        images: finalImages,
        preferences: {
          ...form.preferences,
          minAge: Number(form.preferences.minAge),
          maxAge: Number(form.preferences.maxAge),
        },
      });
      return;
    }

    // Upload new images to Cloudinary
    try {
      setUploadingImages(true);

      const formData = new FormData();
      newImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.message || "Upload failed");
      }

      const uploadedImages = uploadRes.data.images.map((img) => ({
        url: img.secure_url,
        publicId: img.public_id,
      }));

      // Merge existing (minus removed) + newly uploaded
      const finalImages = [
        ...existingImages.map((img) => ({
          url: img.url,
          publicId: img.publicId,
        })),
        ...uploadedImages,
      ];

      setUploadingImages(false);

      onSubmit({
        ...form,
        age: Number(form.age),
        images: finalImages,
        preferences: {
          ...form.preferences,
          minAge: Number(form.preferences.minAge),
          maxAge: Number(form.preferences.maxAge),
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload images";
      toast.error(msg);
      setUploadingImages(false);
    }
  };

  // -----------------------------
  // Basic Inputs
  // -----------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // -----------------------------
  // Render all images (existing + new)
  // -----------------------------

  const allImagesForDisplay = [
    ...existingImages.map((img) => ({
      key: `existing-${existingImages.indexOf(img)}`,
      src: getImageUrl(img),
      isExisting: true,
      index: existingImages.indexOf(img),
    })),
    ...newImageFiles.map((file) => ({
      key: `new-${newImageFiles.indexOf(file)}`,
      src: getImageUrl(file),
      isExisting: false,
      index: newImageFiles.indexOf(file),
    })),
  ];

  return (
    <>
      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl shadow-2xl p-8 space-y-8"
      >
        {/* ========================= */}
        {/* PHOTO UPLOAD */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Your Photos

          </h2>

          <div className="grid grid-cols-3 gap-4">

            {allImagesForDisplay.map((img) => (

              <div
                key={img.key}
                className="relative"
              >

                <img
                  src={img.src}
                  alt=""
                  className="aspect-9/16 rounded-2xl object-cover shadow-md"
                />

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveImage(img.index, img.isExisting)
                  }
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                >
                  <X size={16} />
                </button>

              </div>

            ))}

            {totalImageCount < 3 && (
              <label className="aspect-9/16 border-2 border-dashed rounded-2xl flex flex-col justify-center items-center cursor-pointer hover:border-pink-500 transition">

                <ImagePlus
                  size={40}
                  className="text-pink-500"
                />

                <span className="text-sm mt-2">

                  Add Photo

                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileSelect}
                />

              </label>

            )}

          </div>

          <p className="text-sm text-gray-500 mt-2">

            Add up to 3 photos. Tap a photo to adjust its crop.

          </p>

        </div>

        {/* ========================= */}
        {/* BASIC DETAILS */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Basic Information

          </h2>

          <div className="space-y-4">

            {/* Age */}

            <div className="relative">

              <Calendar
                size={18}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                className="w-full rounded-xl border pl-12 pr-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />

            </div>

            {/* Gender */}

            <div className="relative">

              <User
                size={18}
                className="absolute left-4 top-4 text-foreground"
              />

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-xl border pl-12 pr-4 py-3 bg-transparent text-foreground focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="" className="bg-background text-foreground">

                  Select Gender

                </option>

                <option value="male" className="bg-background text-foreground">

                  Male

                </option>

                <option value="female" className="bg-background text-foreground">

                  Female

                </option>

                <option value="other" className="bg-background text-foreground">

                  Other

                </option>

              </select>

            </div>

            {/* City */}

            <div className="relative">

              <MapPin
                size={18}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full rounded-xl border pl-12 pr-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
              />

            </div>

            {/* Bio */}

            <div>

              <textarea
                rows={5}
                maxLength={250}
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell everyone about yourself..."
                className="w-full rounded-xl border p-4 resize-none focus:ring-2 focus:ring-pink-500 outline-none"
              />

              <div className="text-right text-xs text-gray-500 mt-1">

                {form.bio.length}/250

              </div>

            </div>

          </div>

        </div>
        {/* ========================= */}
        {/* INTERESTS */}
        {/* ========================= */}

        <div>
          <h2 className="font-bold text-xl mb-4">
            Your Interests
          </h2>

          <div className="flex flex-wrap gap-3">

            {[
              "Travel",
              "Music",
              "Movies",
              "Gaming",
              "Gym",
              "Photography",
              "Reading",
              "Cooking",
              "Cricket",
              "Football",
              "Coding",
              "Art",
              "Dancing",
              "Pets",
              "Nature",
              "Fashion",
              "Cafe",
              "Adventure",
            ].map((interest) => {
              const selected =
                form.interests.includes(interest);

              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      interests: selected
                        ? form.interests.filter(
                          (i) => i !== interest
                        )
                        : [
                          ...form.interests,
                          interest,
                        ],
                    })
                  }
                  className={`px-4 py-2 rounded-full border transition ${selected
                      ? "bg-pink-500 text-white border-pink-500"
                      : "hover:border-pink-500"
                    }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================= */}
        {/* LOOKING FOR */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Looking For

          </h2>

          <div className="grid grid-cols-3 gap-4">

            {[
              {
                id: "dating",
                emoji: "❤️",
                title: "Dating",
              },
              {
                id: "friendship",
                emoji: "🤝",
                title: "Friendship",
              },
              {
                id: "networking",
                emoji: "💼",
                title: "Networking",
              },
            ].map((item) => {

              const active =
                form.preferences.lookingFor.includes(
                  item.id
                );

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {

                    const exists =
                      form.preferences.lookingFor.includes(
                        item.id
                      );

                    setForm({
                      ...form,
                      preferences: {
                        ...form.preferences,
                        lookingFor: exists
                          ? form.preferences.lookingFor.filter(
                            (x) => x !== item.id
                          )
                          : [
                            ...form.preferences
                              .lookingFor,
                            item.id,
                          ],
                      },
                    });
                  }}
                  className={`rounded-2xl border p-5 transition text-center ${active
                      ? "bg-pink-500 text-white border-pink-500"
                      : "hover:border-pink-500"
                    }`}
                >
                  <div className="text-3xl">

                    {item.emoji}

                  </div>

                  <p className="mt-2 font-semibold">

                    {item.title}

                  </p>

                </button>
              );
            })}

          </div>

        </div>

        {/* ========================= */}
        {/* INTERESTED IN */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Interested In

          </h2>

          <div className="flex gap-3 flex-wrap">

            {[
              "male",
              "female",
              "other",
            ].map((gender) => {

              const active =
                form.preferences.genders.includes(
                  gender
                );

              return (
                <button
                  key={gender}
                  type="button"
                  onClick={() => {

                    const exists =
                      form.preferences.genders.includes(
                        gender
                      );

                    setForm({
                      ...form,
                      preferences: {
                        ...form.preferences,
                        genders: exists
                          ? form.preferences.genders.filter(
                            (g) => g !== gender
                          )
                          : [
                            ...form.preferences
                              .genders,
                            gender,
                          ],
                      },
                    });
                  }}
                  className={`px-6 py-3 rounded-full border transition ${active
                      ? "bg-pink-500 text-white border-pink-500"
                      : "hover:border-pink-500"
                    }`}
                >
                  {gender.charAt(0).toUpperCase() +
                    gender.slice(1)}
                </button>
              );
            })}

          </div>

        </div>

        {/* ========================= */}
        {/* AGE PREFERENCE */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Preferred Age Range

          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-sm text-gray-500">

                Minimum Age

              </label>

              <input
                type="number"
                min={18}
                max={100}
                value={form.preferences.minAge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferences: {
                      ...form.preferences,
                      minAge: e.target.value,
                    },
                  })
                }
                className="mt-2 w-full border rounded-xl p-3"
              />

            </div>

            <div>

              <label className="text-sm text-gray-500">

                Maximum Age

              </label>

              <input
                type="number"
                min={18}
                max={100}
                value={form.preferences.maxAge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferences: {
                      ...form.preferences,
                      maxAge: e.target.value,
                    },
                  })
                }
                className="mt-2 w-full border rounded-xl p-3"
              />

            </div>

          </div>

        </div>

        {/* ========================= */}
        {/* LOCATION */}
        {/* ========================= */}

        <div>

          <h2 className="font-bold text-xl mb-4">

            Location Preference

          </h2>

          <select
            value={
              form.preferences.cityPreference
            }
            onChange={(e) =>
              setForm({
                ...form,
                preferences: {
                  ...form.preferences,
                  cityPreference:
                    e.target.value,
                },
              })
            }
            className="w-full border rounded-xl p-3"
          >
            <option value="same-city" className="bg-background text-foreground">

              Same City

            </option>

            <option value="nearby" className="bg-background text-foreground">

              Nearby Cities

            </option>

            <option value="anywhere" className="bg-background text-foreground">

              Anywhere

            </option>

          </select>

        </div>

        {/* ========================= */}
        {/* SUBMIT */}
        {/* ========================= */}

        <button
          disabled={saving || uploadingImages}
          type="submit"
          className="w-full bg-linear-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
        >
          {saving || uploadingImages ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {uploadingImages ? "Saving..." : "Saving..."}
            </>
          ) : (
            "Save Profile ❤️"
          )}
        </button>

      </form>
    </>
  );
}

