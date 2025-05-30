import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="w-full bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md shadow-sm">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 