export default function BLOG({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <header className="shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <p className="text-lg text-gray-700">
            A single blog post will be displayed here.
          </p>
        </div>
      </main>
    </div>
  );
}
