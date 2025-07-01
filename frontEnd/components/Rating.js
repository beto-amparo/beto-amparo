import { useState } from 'react';

export default function Rating({ rating, editable = false, onRatingChange }) {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`text-2xl ${editable ? 'cursor-pointer' : 'cursor-default'} transition-colors ${
                        star <= (hoverRating || rating) ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                    onClick={() => editable && onRatingChange(star)}
                    onMouseEnter={() => editable && setHoverRating(star)}
                    onMouseLeave={() => editable && setHoverRating(0)}
                    disabled={!editable}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}