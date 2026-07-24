"use client";

import { useState } from "react";

export default function ProfileForm({ initialData, onSubmit }) {
  const [form, setForm] = useState({
    age: initialData?.age || "",
    gender: initialData?.gender || "",
    city: initialData?.city || "",
    bio: initialData?.bio || "",
    interests: initialData?.interests?.join(", ") || "",
    images: initialData?.images || [],

    preferences: {
      minAge: initialData?.preferences?.minAge || 18,
      maxAge: initialData?.preferences?.maxAge || 60,
      genders: initialData?.preferences?.genders || [],
      lookingFor: initialData?.preferences?.lookingFor || [],
      cityPreference:
        initialData?.preferences?.cityPreference || "same-city",
    },
  });

  // =============================
  // Handlers
  // =============================

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + form.images.length > 3) {
      alert("Maximum 3 images allowed");
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));

    setForm({
      ...form,
      images: [...form.images, ...previews],
    });
  };

  const handleGenderPreference = (gender) => {
    const exists = form.preferences.genders.includes(gender);

    setForm({
      ...form,
      preferences: {
        ...form.preferences,
        genders: exists
          ? form.preferences.genders.filter((g) => g !== gender)
          : [...form.preferences.genders, gender],
      },
    });
  };

  const handleLookingFor = (type) => {
    const exists = form.preferences.lookingFor.includes(type);

    setForm({
      ...form,
      preferences: {
        ...form.preferences,
        lookingFor: exists
          ? form.preferences.lookingFor.filter((t) => t !== type)
          : [...form.preferences.lookingFor, type],
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.images.length < 1) {
      alert("At least 1 image is required");
      return;
    }

    onSubmit({
      ...form,
      interests: form.interests.split(",").map((i) => i.trim()),
    });
  };

  // =============================
  // UI
  // =============================

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md p-6 rounded-xl shadow-lg"
      style={{ backgroundColor: "var(--card)" }}
    >
      <h2 className="text-xl font-bold mb-4 text-center">
        Complete Your Profile
      </h2>

      {/* Age */}
      <input
        name="age"
        type="number"
        placeholder="Age"
        value={form.age}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded bg-transparent"
      />

      {/* Gender */}
      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded bg-transparent"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      {/* City */}
      <input
        name="city"
        placeholder="City"
        value={form.city}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded bg-transparent"
      />

      {/* Bio */}
      <textarea
        name="bio"
        placeholder="Bio"
        value={form.bio}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded bg-transparent"
      />

      {/* Interests */}
      <input
        name="interests"
        placeholder="Interests (comma separated)"
        value={form.interests}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded bg-transparent"
      />

      {/* Images */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Upload Images (Max 3)</p>

        <input type="file" multiple onChange={handleImageUpload} />

        <div className="flex gap-2 mt-2">
          {form.images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-16 h-16 rounded object-cover"
            />
          ))}
        </div>
      </div>

      {/* Looking For */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Looking For:</p>

        {["dating", "friendship", "networking"].map((type) => (
          <label key={type} className="mr-3">
            <input
              type="checkbox"
              checked={form.preferences.lookingFor.includes(type)}
              onChange={() => handleLookingFor(type)}
            />
            {type}
          </label>
        ))}
      </div>

      {/* Gender Preference */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Interested In:</p>

        {["male", "female", "other"].map((g) => (
          <label key={g} className="mr-3">
            <input
              type="checkbox"
              checked={form.preferences.genders.includes(g)}
              onChange={() => handleGenderPreference(g)}
            />
            {g}
          </label>
        ))}
      </div>

      {/* City Preference */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Location Preference:</p>

        <select
          value={form.preferences.cityPreference}
          onChange={(e) =>
            setForm({
              ...form,
              preferences: {
                ...form.preferences,
                cityPreference: e.target.value,
              },
            })
          }
          className="w-full p-2 border rounded bg-transparent"
        >
          <option value="same-city">Same City</option>
          <option value="nearby">Nearby</option>
          <option value="anywhere">Anywhere</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 rounded font-bold"
        style={{
          backgroundColor: "var(--primary)",
          color: "#fff",
        }}
      >
        Save Profile
      </button>
    </form>
  );
}