"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  MapPin,
  User,
  Calendar,
  X,
  ImagePlus,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfileForm({
  initialData,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState({
    age: "",
    gender: "",
    city: "",
    bio: "",
    interests: [],
    images: [],

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
      images: initialData.images || [],

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
  }, [initialData]);

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
  // Upload Images
  // -----------------------------

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (
      files.length + form.images.length >
      3
    ) {
      // alert("Maximum 3 photos allowed");
      toast("Maximum 3 photos allowed", {
        icon: "❌",
        style: {},
      });
      return;
    }

    const previews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setForm({
      ...form,
      images: [...form.images, ...previews],
    });
  };

  const removeImage = (index) => {
    setForm({
      ...form,
      images: form.images.filter(
        (_, i) => i !== index
      ),
    });
  };

  // -----------------------------
  // Submit
  // -----------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.images.length === 0) {
      // alert("Upload at least one photo");
      toast("Upload at least one photo", {
        icon: "❌",
        style: {},
      });
      return;
    }


    if (!form.age || !form.gender) {
      // alert("Fill required fields");
      toast("Fill required fields", {
        icon: "❌",
        style: {},
      });
      return;
    }

    onSubmit({
      ...form,
      age: Number(form.age),
      preferences: {
        ...form.preferences,
        minAge: Number(form.preferences.minAge),
        maxAge: Number(form.preferences.maxAge),
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className=" rounded-3xl shadow-2xl p-8 space-y-8"
    >
      {/* ========================= */}
      {/* PHOTO UPLOAD */}
      {/* ========================= */}

      <div>

        <h2 className="font-bold text-xl mb-4">

          Your Photos

        </h2>

        <div className="grid grid-cols-3 gap-4">

          {form.images.map((img, index) => (

            <div
              key={index}
              className="relative"
            >

              <img
                src={img}
                alt=""
                className="aspect-9/16 rounded-2xl object-cover shadow-md"
              />

              <button
                type="button"
                onClick={() =>
                  removeImage(index)
                }
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>

            </div>

          ))}

          {form.images.length < 3 && (

            <label className="aspect-9/16 border-2 border-dashed rounded-2xl flex flex-col justify-center items-center cursor-pointer hover:border-pink-500 transition">

              <ImagePlus
                size={40}
                className="text-pink-500"
              />

              <span className="text-sm mt-2">

                Add Photo

              </span>

              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />

            </label>

          )}

        </div>

        <p className="text-sm text-gray-500 mt-2">

          Add up to 3 photos.

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
              className="absolute left-4 top-4 text-gray-400"
            />

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-xl border pl-12 pr-4 py-3 bg-transparent focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">

                Select Gender

              </option>

              <option value="male">

                Male

              </option>

              <option value="female">

                Female

              </option>

              <option value="other">

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
          <option value="same-city">

            Same City

          </option>

          <option value="nearby">

            Nearby Cities

          </option>

          <option value="anywhere">

            Anywhere

          </option>

        </select>

      </div>

      {/* ========================= */}
      {/* SUBMIT */}
      {/* ========================= */}

      <button
        disabled={saving}
        type="submit"
        className="w-full bg-linear-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
      >
        {saving ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          "Save Profile ❤️"
        )}
      </button>

    </form>
  );
}