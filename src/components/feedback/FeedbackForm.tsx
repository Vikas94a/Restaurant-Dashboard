import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FeedbackFormProps {
  orderId: string;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
}

interface FeedbackData {
  rating: number;
  foodQuality: number;
  serviceExperience: number;
  valueForMoney: number;
  comments: string;
}

export default function FeedbackForm({ orderId, onSubmit }: FeedbackFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    foodQuality: 0,
    serviceExperience: 0,
    valueForMoney: 0,
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(feedback);
      router.push('/thank-you');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    value: number,
    onChange: (value: number) => void,
    label: string
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">How was your experience?</h2>
      
      {renderStarRating(feedback.rating, (value) => 
        setFeedback(prev => ({ ...prev, rating: value })), 
        'Overall Rating'
      )}
      
      {renderStarRating(feedback.foodQuality, (value) => 
        setFeedback(prev => ({ ...prev, foodQuality: value })), 
        'Food Quality'
      )}
      
      {renderStarRating(feedback.serviceExperience, (value) => 
        setFeedback(prev => ({ ...prev, serviceExperience: value })), 
        'Service Experience'
      )}
      
      {renderStarRating(feedback.valueForMoney, (value) => 
        setFeedback(prev => ({ ...prev, valueForMoney: value })), 
        'Value for Money'
      )}

      <div className="mb-4">
        <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments
        </label>
        <textarea
          id="comments"
          value={feedback.comments}
          onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          rows={4}
          placeholder="Tell us more about your experience..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || feedback.rating === 0}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isSubmitting || feedback.rating === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
} 