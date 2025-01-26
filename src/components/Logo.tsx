function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      <h2 className="text-center text-3xl font-extrabold text-gray-900">
        Chat App
      </h2>
    </div>
  )
}

export default Logo
