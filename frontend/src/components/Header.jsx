import React from "react";

export default function Header({
  currentPage,
  onNavigate,
  onNewAnalysis,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-200/70 bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-[1600px]
          items-center
          justify-between
          gap-3
          px-3
          py-2.5
          sm:px-6
          sm:py-3
          lg:px-8
        "
      >

        {/* =========================
            LOGO + TITLE
        ========================== */}

        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-b
              from-blue-500
              to-sky-500
              text-xs
              font-extrabold
              text-white
              shadow-lg
              shadow-sky-200

              sm:h-11
              sm:w-11
              sm:text-sm
            "
          >
            CS
          </div>

          <div className="min-w-0">

            <h1
              className="
                truncate
                text-sm
                font-extrabold
                tracking-tight
                text-slate-800

                sm:text-lg
                lg:text-xl
              "
            >
              CodeSenseAI
            </h1>

            <p
              className="
                hidden
                truncate
                text-xs
                font-semibold
                text-cyan-600

                sm:block
                lg:text-sm
              "
            >
              Repository-aware developer assistant
            </p>

          </div>

        </div>


        {/* =========================
            NAVIGATION
        ========================== */}

        <nav
          className="
            flex
            shrink-0
            items-center
            gap-1

            sm:gap-2
            lg:gap-3
          "
        >

          {/* HOME */}

          <button
            onClick={() => onNavigate("home")}
            aria-label="Home"
            className={`
              flex
              items-center
              justify-center
              rounded-xl
              px-2.5
              py-2
              text-sm
              font-bold
              transition-all
              duration-200

              sm:px-3
              lg:px-4

              ${
                currentPage === "home"
                  ? `
                    bg-gradient-to-b
                    from-blue-500
                    to-sky-500
                    text-white
                    shadow-md
                    shadow-sky-200
                  `
                  : `
                    text-slate-600
                    hover:bg-cyan-50
                    hover:text-blue-600
                  `
              }
            `}
          >
            <span className="text-sm sm:mr-1">
              🏠
            </span>

            <span className="hidden sm:inline">
              Home
            </span>
          </button>


          {/* HISTORY */}

          <button
            onClick={() => onNavigate("history")}
            aria-label="History"
            className={`
              flex
              items-center
              justify-center
              rounded-xl
              px-2.5
              py-2
              text-sm
              font-bold
              transition-all
              duration-200

              sm:px-3
              lg:px-4

              ${
                currentPage === "history"
                  ? `
                    bg-gradient-to-b
                    from-blue-500
                    to-sky-500
                    text-white
                    shadow-md
                    shadow-sky-200
                  `
                  : `
                    text-slate-600
                    hover:bg-cyan-50
                    hover:text-blue-600
                  `
              }
            `}
          >
            <span className="text-sm sm:mr-1">
              📚
            </span>

            <span className="hidden sm:inline">
              History
            </span>
          </button>


          {/* NEW ANALYSIS */}

          <button
            onClick={onNewAnalysis}
            aria-label="New Analysis"
            className="
              flex
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-300
              bg-gradient-to-r
              from-cyan-50
              to-sky-50
              px-2.5
              py-2
              text-sm
              font-bold
              text-cyan-700

              transition-all
              duration-200

              hover:border-cyan-400
              hover:from-cyan-100
              hover:to-sky-100
              hover:text-blue-700

              shadow-sm
              hover:shadow-md
              hover:shadow-cyan-100

              sm:px-3
              lg:px-4
            "
          >
            <span className="text-base">
              ＋
            </span>

            <span className="hidden sm:inline">
              &nbsp;New Analysis
            </span>
          </button>


          {/* LOGOUT */}

          <button
            onClick={onLogout}
            aria-label="Logout"
            className="
              flex
              items-center
              justify-center
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-2.5
              py-2
              text-sm
              font-bold
              text-red-600

              transition-all
              duration-200

              hover:border-red-300
              hover:bg-red-100
              hover:text-red-700

              shadow-sm
              hover:shadow-md

              sm:px-3
              lg:px-4
            "
          >
            <span className="text-sm sm:mr-1">
              🚪
            </span>

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </nav>

      </div>
    </header>
  );
}