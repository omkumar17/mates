import Image from "next/image";

export default function FullPageLoader({
  title = "Metly",
  subtitle = "Loading...",
  logoSize = 96,
  showDots = true,
  fullscreen = true,
  className = "",
}) {
  return (
    <div
      className={`
        ${
          fullscreen
            ? "fixed inset-0"
            : "w-full h-full min-h-75"
        }
        flex flex-col items-center justify-center
        bg-linear-to-br
        from-pink-50
        via-white
        to-rose-100
        dark:from-neutral-900
        dark:via-neutral-950
        dark:to-black
        ${className}
      `}
    >
      <Image
        src="/logo.png"
        alt="Metly"
        width={logoSize}
        height={logoSize}
        className="animate-pulse"
        priority
      />

      <h2 className="mt-6 text-3xl font-bold text-pink-500">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          {subtitle}
        </p>
      )}

      {showDots && (
        <div className="mt-8 flex gap-2">
          <span className="h-3 w-3 rounded-full bg-pink-500 animate-bounce" />

          <span
            className="h-3 w-3 rounded-full bg-pink-400 animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />

          <span
            className="h-3 w-3 rounded-full bg-pink-300 animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      )}
    </div>
  );
}