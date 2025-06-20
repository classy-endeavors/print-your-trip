import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-5xl font-bold text-gray-900">404</h1>
      <p className="mb-6 text-lg text-gray-700">Page Not Found</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go back Home
      </Link>
    </div>
  );
}
